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
    console.log("🚀 CHECKPOINT 5: API Call - queryDocuments");
    console.log("📡 API Request Details:", {
      namespaceId,
      method: "queryDocuments",
      timestamp: new Date().toISOString(),
    });
    console.log("📋 Query Parameters:", {
      rank_by: params.rank_by,
      top_k: params.top_k,
      filters: params.filters,
      include_attributes: params.include_attributes,
      aggregate_by: params.aggregate_by,
      vector_encoding: params.vector_encoding,
      consistency: params.consistency,
    });
    console.log("🔍 Filter Structure Analysis:");
    if (params.filters) {
      console.log("  - Filter exists:", true);
      console.log(
        "  - Filter type:",
        Array.isArray(params.filters) ? "Array" : typeof params.filters
      );
      console.log(
        "  - Filter content:",
        JSON.stringify(params.filters, null, 2)
      );

      // Analyze filter structure for debugging
      if (Array.isArray(params.filters)) {
        if (params.filters.length >= 3 && params.filters[1] === "Eq") {
          console.log("  - Detected EQUALS filter:", {
            attribute: params.filters[0],
            operator: params.filters[1],
            value: params.filters[2],
            valueType: typeof params.filters[2],
          });
        }
      }
    } else {
      console.log("  - Filter exists:", false);
      console.log("  - This will return ALL documents (no filtering)");
    }

    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    try {
      console.log("📤 Making API call to Turbopuffer...");
      const result = await ns.query({
        rank_by: params.rank_by,
        top_k: params.top_k,
        filters: params.filters,
        include_attributes: params.include_attributes,
        aggregate_by: params.aggregate_by,
        vector_encoding: params.vector_encoding,
        consistency: params.consistency,
      });

      console.log("📥 API Response Received:", {
        rowsCount: result.rows?.length || 0,
        hasAggregations: !!result.aggregations,
        hasBilling: !!result.billing,
        hasPerformance: !!result.performance,
      });

      if (result.rows && result.rows.length > 0) {
        console.log("📄 Sample Results (first 2 documents):");
        result.rows.slice(0, 2).forEach((doc, index) => {
          console.log(`  Document ${index + 1}:`, {
            id: doc.id,
            hasVector: !!doc.vector,
            hasAttributes: !!doc.attributes,
            attributeKeys: doc.attributes ? Object.keys(doc.attributes) : [],
            attributes: doc.attributes,
          });
        });
      } else {
        console.log("⚠️ No documents returned from API");
      }

      return {
        rows: result.rows || [],
        aggregations: result.aggregations,
        billing: result.billing,
        performance: result.performance,
      };
    } catch (error) {
      console.error("💥 API call failed:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        error,
      });
      throw error;
    }
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
          offset?: number;
        } = {}
      ): Promise<{ documents: Document[]; nextCursor?: string | number }> {
        const limit = params.limit || 100;
        const offset = params.offset || 0;

        // For offset-based pagination, we need to get documents starting from the offset
        // We'll do this by first getting the documents at the offset position as a cursor
        // then using that cursor for the actual query
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
          offset: offset > 0 ? offset : undefined,
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
    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    // Convert to column format for better performance
    const ids: (string | number)[] = [];
    const vectors: number[][] = [];
    const attributeColumns: Record<string, any[]> = {};

    documents.forEach((doc) => {
      ids.push(doc.id);
      if (doc.vector) {
        vectors.push(doc.vector);
      }

      // Process attributes
      if (doc.attributes) {
        Object.entries(doc.attributes).forEach(([key, value]) => {
          if (!attributeColumns[key]) {
            attributeColumns[key] = [];
          }
          attributeColumns[key].push(value);
        });
      }

      // Fill missing attributes with null
      Object.keys(attributeColumns).forEach((key) => {
        if (attributeColumns[key].length < ids.length) {
          attributeColumns[key].push(null);
        }
      });
    });

    const writeParams: DocumentWriteParams = {
      upsert_columns: {
        id: ids,
        ...(vectors.length > 0 && { vector: vectors }),
        ...attributeColumns,
      },
      distance_metric: distanceMetric,
    };

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
    if (!this.client) {
      throw new Error("Turbopuffer client not initialized");
    }

    const ns = this.client.namespace(namespaceId);

    const patchColumns: Record<string, any[]> = {
      id: [documentId],
    };

    Object.entries(attributes).forEach(([key, value]) => {
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

    while (true) {
      const { documents, nextCursor } = await this.listDocuments(namespaceId, {
        limit: 1000,
        cursor,
        filters,
        includeAttributes: true,
      });

      allDocuments.push(...documents);

      if (!nextCursor) {
        break;
      }
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
