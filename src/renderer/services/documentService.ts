import { Turbopuffer } from "@turbopuffer/turbopuffer";
import type {
  Document,
  DocumentsQueryParams,
  DocumentsQueryResponse,
  DocumentWriteParams,
  DocumentWriteResponse,
  ExportFormat,
  Filter,
} from "../../types/document";
import { turbopufferService } from "./turbopufferService";
import { permissionService } from "./permissionService";

export class DocumentService {
  private client: Turbopuffer | null = null;

  setClient(client: Turbopuffer): void {
    this.client = client;
  }

  getClient(): Turbopuffer | null {
    return this.client;
  }

  async queryDocuments(
    namespaceId: string,
    params: DocumentsQueryParams
  ): Promise<DocumentsQueryResponse> {
    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    const result = await ns.query({
      rank_by: params.rank_by,
      top_k: params.top_k,
      ...(params.limit && { limit: params.limit }),
      filters: params.filters,
      include_attributes: params.include_attributes,
      ...(params.exclude_attributes && { exclude_attributes: params.exclude_attributes }),
      aggregate_by: params.aggregate_by,
      group_by: params.group_by,
      vector_encoding: params.vector_encoding,
      consistency: params.consistency,
    });

    return {
      rows: result.rows || [],
      aggregations: result.aggregations,
      aggregation_groups: result.aggregation_groups,
      billing: result.billing,
      performance: result.performance,
    };
  }

  /**
   * Runs N queries concurrently against the same namespace and returns their
   * results separately. Used as the foundation for client-side hybrid search
   * (vector + BM25 fusion via RRF, see utils/rankFusion.ts).
   *
   * Pass DocumentsQueryParams-shaped objects in `queries` — the same shape
   * you'd hand to queryDocuments. The server runs them in parallel; bills
   * once. Response shape: { results: [{ rows }, { rows }, ...] } in the
   * same order as the input queries.
   */
  async multiQuery(
    namespaceId: string,
    queries: DocumentsQueryParams[]
  ): Promise<{
    results: Array<{ rows: Document[] }>;
    billing?: DocumentsQueryResponse["billing"];
    performance?: DocumentsQueryResponse["performance"];
  }> {
    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }
    if (queries.length === 0) {
      return { results: [] };
    }
    const ns = this.client.namespace(namespaceId);
    const response = await ns.multiQuery({
      queries: queries.map((q) => ({
        rank_by: q.rank_by,
        top_k: q.top_k,
        ...(q.limit && { limit: q.limit }),
        filters: q.filters,
        include_attributes: q.include_attributes,
        ...(q.exclude_attributes && { exclude_attributes: q.exclude_attributes }),
        aggregate_by: q.aggregate_by,
        group_by: q.group_by,
        vector_encoding: q.vector_encoding,
        consistency: q.consistency,
      })) as Parameters<typeof ns.multiQuery>[0]["queries"],
    });
    return {
      results: response.results.map((r) => ({ rows: (r.rows ?? []) as Document[] })),
      billing: response.billing,
      performance: response.performance,
    };
  }

  /**
   * Returns the query plan for the given query without executing it. Useful
   * for understanding which indexes a query will use and rough cost. Mirrors
   * the shape of queryDocuments — pass the same params you'd pass to query()
   * and read the returned plan_text.
   *
   * Uses the SDK's explainQuery (NamespaceExplainQueryParams). Surface area
   * is API-only right now; UI follow-up will mirror the query toolbar with a
   * dedicated "Explain" panel.
   */
  async explainQuery(
    namespaceId: string,
    params: DocumentsQueryParams
  ): Promise<{ plan_text?: string }> {
    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }
    const ns = this.client.namespace(namespaceId);
    const result = await ns.explainQuery({
      rank_by: params.rank_by,
      top_k: params.top_k,
      ...(params.limit && { limit: params.limit }),
      filters: params.filters,
      include_attributes: params.include_attributes,
      ...(params.exclude_attributes && { exclude_attributes: params.exclude_attributes }),
      aggregate_by: params.aggregate_by,
      group_by: params.group_by,
      consistency: params.consistency,
    });
    return { plan_text: result.plan_text };
  }

  async searchDocuments(
    namespaceId: string,
    searchTerm: string,
    limit = 100
  ): Promise<Document[]> {
    const response = await this.queryDocuments(namespaceId, {
      filters: ["id", "Glob", `${searchTerm}*`],
      rank_by: ["id", "asc"],
      top_k: limit,
      include_attributes: true,
    });

    return response.rows || [];
  }

async listDocuments(
        namespaceId: string,
        params: {
          limit?: number;
          cursor?: string | number;
          filters?: Filter;
          includeAttributes?: string[] | boolean;
        } = {}
      ): Promise<{ documents: Document[]; nextCursor?: string | number }> {
        const limit = params.limit || 100;

        // Cursor-based pagination via id Gt filter — Turbopuffer has no offset param.
        let filters = params.filters;

        if (params.cursor !== undefined) {
          const cursorFilter: Filter = ["id", "Gt", params.cursor];
          filters = filters ? ["And", [filters, cursorFilter]] : cursorFilter;
        }

        const response = await this.queryDocuments(namespaceId, {
          rank_by: ["id", "asc"],
          top_k: limit,
          filters: filters,
          include_attributes:
            params.includeAttributes !== undefined
              ? params.includeAttributes
              : true,
        });

        const documents = response.rows || [];
        const nextCursor =
          documents.length === limit
            ? documents[documents.length - 1].id
            : undefined;

        return { documents, nextCursor };
      }
  async upsertDocuments(
    namespaceId: string,
    documents: Document[],
    distanceMetric: "cosine_distance" | "euclidean_squared" = "cosine_distance"
  ): Promise<DocumentWriteResponse> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    const docsWithVectors = documents.filter((d) => d.vector !== undefined).length;
    const allHaveVectors = docsWithVectors === documents.length;
    const anyHasVector = docsWithVectors > 0;
    const mixedVectors = anyHasVector && !allHaveVectors;

    let writeParams: DocumentWriteParams;

    if (mixedVectors) {
      // Row form: columnar upsert requires equal-length columns, which would
      // force inserting null vectors (rejected by the server). Row form lets
      // each document declare its own fields, so vector-optional namespaces
      // can mix vector-bearing and vector-less rows in one batch.
      writeParams = {
        upsert_rows: documents.map((doc) => ({
          id: doc.id,
          ...(doc.vector && { vector: doc.vector }),
          ...(doc.attributes ?? {}),
        })),
        distance_metric: distanceMetric,
      };
    } else {
      // Uniform batch: columnar form for throughput.
      const ids: (string | number)[] = [];
      const vectors: number[][] = [];
      const attributeColumns: Record<string, any[]> = {};

      documents.forEach((doc) => {
        ids.push(doc.id);
        if (doc.vector) {
          vectors.push(doc.vector);
        }

        if (doc.attributes) {
          Object.entries(doc.attributes).forEach(([key, value]) => {
            if (!attributeColumns[key]) {
              attributeColumns[key] = [];
            }
            attributeColumns[key].push(value);
          });
        }

        // Null-pad missing attributes to keep columns equal length.
        Object.keys(attributeColumns).forEach((key) => {
          if (attributeColumns[key].length < ids.length) {
            attributeColumns[key].push(null);
          }
        });
      });

      writeParams = {
        upsert_columns: {
          id: ids,
          ...(allHaveVectors && { vector: vectors }),
          ...attributeColumns,
        },
        ...(allHaveVectors && { distance_metric: distanceMetric }),
      };
    }

    try {
      const result = await ns.write(writeParams);
      return {
        rows_affected: result.rows_affected || documents.length,
      };
    } catch (error) {
      console.error("Failed to upsert documents:", error);
      throw error;
    }
  }

  async updateDocument(
    namespaceId: string,
    documentId: string | number,
    attributes: Record<string, any>
  ): Promise<DocumentWriteResponse> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    const patchColumns: Record<string, any[]> = {
      id: [documentId],
    };

    // Fields that cannot be patched via the API
    const nonPatchableFields = new Set(['id', 'vector', '$dist']);

    Object.entries(attributes).forEach(([key, value]) => {
      // Skip non-patchable fields (id, vector, $dist)
      if (nonPatchableFields.has(key)) {
        return;
      }
      // Skip vector-like arrays (high-dimensional numeric arrays)
      if (Array.isArray(value) && value.length >= 64 && value.every(v => typeof v === 'number')) {
        console.warn(`Skipping field "${key}" - appears to be a vector (not patchable)`);
        return;
      }
      patchColumns[key] = [value];
    });

    try {
      const result = await ns.write({
        patch_columns: patchColumns,
      });
      return {
        rows_affected: result.rows_affected || 1,
      };
    } catch (error) {
      console.error("Failed to update document:", error);
      throw error;
    }
  }

  async deleteDocuments(
    namespaceId: string,
    documentIds: (string | number)[]
  ): Promise<DocumentWriteResponse> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    try {
      const result = await ns.write({
        deletes: documentIds,
      });
      return {
        rows_affected: result.rows_affected || documentIds.length,
      };
    } catch (error) {
      console.error("Failed to delete documents:", error);
      throw error;
    }
  }

  async deleteByFilter(
    namespaceId: string,
    filter: Filter
  ): Promise<DocumentWriteResponse> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    try {
      const result = await ns.write({
        delete_by_filter: filter,
      });
      return {
        rows_affected: result.rows_affected || 0,
      };
    } catch (error) {
      console.error("Failed to delete by filter:", error);
      throw error;
    }
  }

  async exportDocuments(
    namespaceId: string,
    format: ExportFormat,
    filters?: Filter
  ): Promise<string | Blob> {
    // First, query all documents with the given filters
    const allDocuments: Document[] = [];
    let cursor: string | number | undefined;
    let hasMore = true;

    while (hasMore) {
      const { documents, nextCursor } = await this.listDocuments(namespaceId, {
        limit: 1000,
        cursor,
        filters,
        includeAttributes: true,
      });

      allDocuments.push(...documents);
      hasMore = !!nextCursor;
      cursor = nextCursor;
    }

    // Export based on format
    if (format.format === "json") {
      const data = format.includeVectors
        ? allDocuments
        : allDocuments.map((doc) => {
            const { vector, ...rest } = doc;
            return rest;
          });

      return JSON.stringify(data, null, 2);
    } else if (format.format === "csv") {
      return this.convertToCSV(allDocuments, format);
    }

    throw new Error(`Unsupported export format: ${format.format}`);
  }

  private convertToCSV(documents: Document[], format: ExportFormat): string {
    if (documents.length === 0) {
      return "";
    }

    // Collect all unique attribute keys
    const attributeKeys = new Set<string>();
    documents.forEach((doc) => {
      if (doc.attributes) {
        Object.keys(doc.attributes).forEach((key) => attributeKeys.add(key));
      }
    });

    // Build header
    const headers = ["id"];
    if (format.includeVectors) {
      headers.push("vector");
    }
    const selectedAttributes = format.attributes || Array.from(attributeKeys);
    headers.push(...selectedAttributes);

    // Build rows
    const rows = documents.map((doc) => {
      const row: any[] = [doc.id];

      if (format.includeVectors) {
        row.push(doc.vector ? JSON.stringify(doc.vector) : "");
      }

      selectedAttributes.forEach((attr) => {
        const value = doc.attributes?.[attr];
        if (value === null || value === undefined) {
          row.push("");
        } else if (typeof value === "string") {
          // Escape quotes and wrap in quotes if contains comma, newline, or quotes
          const escaped = value.replace(/"/g, '""');
          row.push(
            escaped.includes(",") ||
              escaped.includes("\n") ||
              escaped.includes('"')
              ? `"${escaped}"`
              : escaped
          );
        } else {
          row.push(JSON.stringify(value));
        }
      });

      return row;
    });

    // Combine header and rows
    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }

  async parseImportFile(file: File): Promise<Document[]> {
    const text = await file.text();
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "json") {
      return this.parseJSON(text);
    } else if (extension === "csv") {
      return this.parseCSV(text);
    } else {
      throw new Error("Unsupported file format. Please use JSON or CSV.");
    }
  }

  private parseJSON(text: string): Document[] {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error("JSON file must contain an array of documents");
      }

      return data.map((item, index) => {
        if (!item.id) {
          throw new Error(
            `Document at index ${index} is missing required 'id' field`
          );
        }

        const { id, vector, ...attributes } = item;
        return {
          id,
          vector: vector || undefined,
          attributes:
            Object.keys(attributes).length > 0 ? attributes : undefined,
        };
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON format");
      }
      throw error;
    }
  }

  private parseCSV(text: string): Document[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error(
        "CSV file must contain headers and at least one data row"
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const idIndex = headers.findIndex((h) => h.toLowerCase() === "id");

    if (idIndex === -1) {
      throw new Error('CSV file must contain an "id" column');
    }

    const vectorIndex = headers.findIndex((h) => h.toLowerCase() === "vector");
    const documents: Document[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        throw new Error(
          `Row ${i + 1} has ${values.length} values but expected ${
            headers.length
          }`
        );
      }

      const id = values[idIndex];
      if (!id) {
        throw new Error(`Row ${i + 1} is missing required id value`);
      }

      const doc: Document = { id: isNaN(Number(id)) ? id : Number(id) };

      if (vectorIndex !== -1 && values[vectorIndex]) {
        try {
          doc.vector = JSON.parse(values[vectorIndex]);
        } catch {
          throw new Error(`Invalid vector format in row ${i + 1}`);
        }
      }

      const attributes: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index !== idIndex && index !== vectorIndex && values[index]) {
          try {
            // Try to parse as JSON first (for objects/arrays)
            attributes[header] = JSON.parse(values[index]);
          } catch {
            // If not valid JSON, treat as string
            attributes[header] = values[index];
          }
        }
      });

      if (Object.keys(attributes).length > 0) {
        doc.attributes = attributes;
      }

      documents.push(doc);
    }

    return documents;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }
}

export const documentService = new DocumentService();
