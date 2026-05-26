import { Turbopuffer } from '@turbopuffer/turbopuffer';
import type {
  Namespace,
  NamespaceListParams,
  NamespaceMetadata,
  NamespaceSchema,
  NamespacesResponse,
  VectorType
} from '../../types/namespace';
import type {
  TurbopufferRegion,
  NamespaceWithRegion,
  RegionError
} from '../../types/connection';
import { permissionService } from './permissionService';
import { turbopufferService } from './turbopufferService';

export class NamespaceService {
  private client: Turbopuffer | null = null;

  setClient(client: Turbopuffer): void {
    this.client = client;
  }

  async listNamespaces(params?: NamespaceListParams): Promise<NamespacesResponse> {
    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    // page_size is the request batch size, not a hard cap. The SDK's PagePromise
    // auto-paginates via `for await...of` until exhausted, so this returns all
    // matches (respecting `prefix` and `cursor` if provided).
    const pageSize = params?.page_size ?? 1000;

    try {
      const iterator = this.client.namespaces({
        cursor: params?.cursor,
        prefix: params?.prefix,
        page_size: pageSize,
      });

      const namespaces: Namespace[] = [];
      for await (const namespace of iterator) {
        namespaces.push({ id: namespace.id });
      }

      return { namespaces };
    } catch (error) {
      console.error('Failed to list namespaces:', error);
      throw error;
    }
  }

  async createNamespaceWithDocuments(
    namespaceId: string,
    documents: Array<{ id: string | number; vector?: number[]; [key: string]: any }>,
    schema: NamespaceSchema = {},
    distanceMetric: 'cosine_distance' | 'euclidean_squared' = 'cosine_distance'
  ): Promise<void> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    if (documents.length === 0) {
      throw new Error('At least one document is required to create a namespace');
    }

    const ns = this.client.namespace(namespaceId);

    try {
      const docsWithVectors = documents.filter((d) => d.vector !== undefined).length;
      const allHaveVectors = docsWithVectors === documents.length;
      const anyHasVector = docsWithVectors > 0;
      const mixedVectors = anyHasVector && !allHaveVectors;

      let writeParams: Record<string, any>;

      if (mixedVectors) {
        // Row form supports vector-optional namespaces where some docs in a
        // batch carry vectors and others don't. Columnar form would require
        // null padding the vector column, which the server rejects.
        writeParams = {
          upsert_rows: documents.map((doc) => {
            const { id, vector, ...attrs } = doc;
            return {
              id,
              ...(vector && { vector }),
              ...attrs,
            };
          }),
          distance_metric: distanceMetric,
        };
      } else {
        // Uniform batch: columnar form for throughput.
        const ids: (string | number)[] = [];
        const vectors: number[][] = [];
        const attributeColumns: Record<string, any[]> = {};

        documents.forEach((doc) => {
          const { id, vector, ...attrs } = doc;
          ids.push(id);
          if (vector) vectors.push(vector);

          Object.entries(attrs).forEach(([key, value]) => {
            if (!attributeColumns[key]) attributeColumns[key] = [];
            attributeColumns[key].push(value);
          });

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
          ...(allHaveVectors && { distance_metric: 'cosine_distance' }),
        };
      }

      if (Object.keys(schema).length > 0) {
        writeParams.schema = schema;
      }

      await ns.write(writeParams);
    } catch (error) {
      console.error('Failed to create namespace:', error);
      throw error;
    }
  }

  async getNamespaceById(namespaceId: string): Promise<Namespace | null> {
    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    try {
      // Probe schema to verify the namespace exists; discard the result.
      // Callers should use getNamespaceMetadata() for created_at, row count, etc.
      const ns = this.client.namespace(namespaceId);
      await ns.schema();

      return { id: namespaceId };
    } catch (error) {
      console.error(`Namespace ${namespaceId} not found:`, error);
      return null;
    }
  }

  async deleteNamespace(namespaceId: string): Promise<void> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    const ns = this.client.namespace(namespaceId);
    
    try {
      await ns.delete();
    } catch (error) {
      console.error('Failed to delete namespace:', error);
      throw error;
    }
  }

  async getNamespaceSchema(namespaceId: string): Promise<NamespaceSchema> {
    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    const ns = this.client.namespace(namespaceId);
    
    try {
      const schema = await ns.schema();
      return schema as NamespaceSchema;
    } catch (error) {
      console.error('Failed to get namespace schema:', error);
      throw error;
    }
  }

  async updateNamespaceSchema(namespaceId: string, schema: NamespaceSchema): Promise<{ status?: number } | void> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    const ns = this.client.namespace(namespaceId);
    
    try {
      const response = await ns.updateSchema({ schema });
      // If the response includes HTTP status information, return it
      // This allows callers to detect HTTP 202 responses for index building
      if (response && typeof response === 'object' && 'status' in response) {
        return response as { status: number };
      }
      return response;
    } catch (error) {
      console.error('Failed to update namespace schema:', error);
      throw error;
    }
  }

  async searchNamespaces(prefix: string): Promise<Namespace[]> {
    const response = await this.listNamespaces({ prefix, page_size: 1000 });
    return response.namespaces;
  }

  /**
   * List namespaces from all configured regions in parallel.
   * Auto-paginates internally via the SDK's PagePromise iterator.
   */
  async listNamespacesFromAllRegions(
    regions: TurbopufferRegion[],
    prefix?: string
  ): Promise<{
    namespaces: NamespaceWithRegion[];
    errors: RegionError[];
  }> {
    const allClients = turbopufferService.getAllClients();

    if (allClients.size === 0) {
      throw new Error('No Turbopuffer clients initialized');
    }

    // Filter to only regions that have clients
    const regionsWithClients = regions.filter(r => allClients.has(r.id));

    // Fetch namespaces from all regions in parallel
    const results = await Promise.allSettled(
      regionsWithClients.map(async (region) => {
        const client = allClients.get(region.id);
        if (!client) {
          throw new Error(`Client not found for region: ${region.id}`);
        }

        const namespaces: NamespaceWithRegion[] = [];
        const iterator = client.namespaces({
          page_size: 1000,
          ...(prefix && { prefix }),
        });

        for await (const namespace of iterator) {
          namespaces.push({
            id: namespace.id,
            regionId: region.id,
            regionName: region.location, // Use human-readable location name
            regionProvider: region.provider,
          });
        }

        return { region, namespaces };
      })
    );

    // Aggregate results
    const allNamespaces: NamespaceWithRegion[] = [];
    const errors: RegionError[] = [];

    results.forEach((result, idx) => {
      const region = regionsWithClients[idx];
      if (result.status === 'fulfilled') {
        allNamespaces.push(...result.value.namespaces);
      } else {
        errors.push({
          regionId: region.id,
          regionName: region.location, // Use human-readable location name
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    });

    // Sort namespaces alphabetically by ID
    allNamespaces.sort((a, b) => a.id.localeCompare(b.id));

    return { namespaces: allNamespaces, errors };
  }

  /**
   * Copies an existing namespace into a new one. Server-side — much faster
   * than client-side export/import, and discounted (75% off write costs per
   * docs/export.md). Same region only; cross-region/cross-org copies need
   * source_region + source_api_key which aren't in SDK 0.10.18 yet.
   *
   * @param destinationId   Name of the new namespace to create
   * @param sourceId        Namespace to copy from
   * @param regionId        Region to perform the copy in (both must be in this region)
   */
  async copyNamespace(
    destinationId: string,
    sourceId: string,
    regionId?: string
  ): Promise<void> {
    permissionService.checkWritePermission();

    const client = regionId
      ? turbopufferService.getClientForRegion(regionId)
      : (this.client || turbopufferService.getClient());

    if (!client) {
      throw new Error('Turbopuffer client not initialized');
    }

    if (destinationId === sourceId) {
      throw new Error('Destination namespace must differ from source');
    }

    const ns = client.namespace(destinationId);
    try {
      await ns.write({ copy_from_namespace: sourceId });
    } catch (error) {
      console.error('Failed to copy namespace:', error);
      throw error;
    }
  }

  /**
   * Measures ANN recall by running approximate and exhaustive searches and
   * comparing their result sets. Returns the average across `num` queries
   * (default chosen by the server). Vector-only — meaningless without a
   * vector index.
   *
   * Per docs/recall.md, the recall figure is the share of "ground truth"
   * (exhaustive) results that the ANN index also returned. 1.0 = perfect.
   */
  async measureRecall(
    namespaceId: string,
    regionId?: string,
    options: { num?: number; top_k?: number } = {}
  ): Promise<{ avg_recall: number; avg_ann_count: number; avg_exhaustive_count: number }> {
    const client = regionId
      ? turbopufferService.getClientForRegion(regionId)
      : (this.client || turbopufferService.getClient());

    if (!client) {
      throw new Error('Turbopuffer client not initialized');
    }

    const ns = client.namespace(namespaceId);
    try {
      const result = await ns.recall({
        ...(options.num !== undefined && { num: options.num }),
        ...(options.top_k !== undefined && { top_k: options.top_k }),
      });
      return {
        avg_recall: result.avg_recall,
        avg_ann_count: result.avg_ann_count,
        avg_exhaustive_count: result.avg_exhaustive_count,
      };
    } catch (error) {
      console.error('Failed to measure recall:', error);
      throw error;
    }
  }

  /**
   * Hints the cache to warm for this namespace. The server responds ACCEPTED
   * and pre-fetches data in the background — subsequent queries are typically
   * faster. Safe to call repeatedly; no write permission required.
   */
  async warmCache(namespaceId: string, regionId?: string): Promise<void> {
    const client = regionId
      ? turbopufferService.getClientForRegion(regionId)
      : (this.client || turbopufferService.getClient());

    if (!client) {
      throw new Error('Turbopuffer client not initialized');
    }

    const ns = client.namespace(namespaceId);
    try {
      await ns.hintCacheWarm();
    } catch (error) {
      console.error('Failed to warm cache:', error);
      throw error;
    }
  }

  async getNamespaceMetadata(namespaceId: string, regionId?: string): Promise<NamespaceMetadata> {
    // Use region-specific client if regionId provided, otherwise fall back to default
    let client: Turbopuffer | null;
    if (regionId) {
      client = turbopufferService.getClientForRegion(regionId);
    } else {
      client = this.client || turbopufferService.getClient();
    }

    if (!client) {
      throw new Error('Turbopuffer client not initialized');
    }

    const ns = client.namespace(namespaceId);

    try {
      const metadata = await ns.metadata();
      return {
        approx_row_count: metadata.approx_row_count,
        approx_logical_bytes: metadata.approx_logical_bytes,
        created_at: metadata.created_at,
        schema: metadata.schema,
      };
    } catch (error) {
      console.error('Failed to get namespace metadata:', error);
      throw error;
    }
  }

  // DEPRECATED: Document count queries can cause 429 rate limit errors
  // This method is commented out to prevent automatic document counting
  // async getNamespaceStats(namespaceId: string): Promise<{ documentCount: number }> {
  //   if (!this.client) {
  //     throw new Error('Turbopuffer client not initialized');
  //   }

  //   const ns = this.client.namespace(namespaceId);
  //   
  //   try {
  //     // Use aggregation query to count documents
  //     const result = await ns.query({
  //       aggregate_by: {
  //         count: ['Count', 'id']
  //       }
  //     });

  //     return {
  //       documentCount: result.aggregations?.count || 0
  //     };
  //   } catch (error) {
  //     // If namespace doesn't exist or has no documents
  //     if (error instanceof Error && error.message.includes('404')) {
  //       return { documentCount: 0 };
  //     }
  //     console.error('Failed to get namespace stats:', error);
  //     throw error;
  //   }
  // }
}

export const namespaceService = new NamespaceService();