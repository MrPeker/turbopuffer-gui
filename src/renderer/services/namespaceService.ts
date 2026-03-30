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

    const namespaces: Namespace[] = [];
    let count = 0;
    const pageSize = params?.page_size || 100;

    try {
      const iterator = await this.client.namespaces({
        cursor: params?.cursor,
        prefix: params?.prefix,
        page_size: pageSize
      });

      for await (const namespace of iterator) {
        namespaces.push({
          id: namespace.id,
          // Additional stats would need to be fetched separately
          // as the API doesn't return them in the list
        });
        
        count++;
        if (count >= pageSize) {
          break;
        }
      }

      // Note: The turbopuffer SDK doesn't expose next_cursor directly
      // In a real implementation, we might need to handle pagination differently
      return {
        namespaces,
        // next_cursor would be set here if available from the API
      };
    } catch (error) {
      console.error('Failed to list namespaces:', error);
      throw error;
    }
  }

  async createNamespaceWithDocuments(
    namespaceId: string,
    documents: Array<{ id: string | number; vector?: number[]; [key: string]: any }>,
    schema: NamespaceSchema = {}
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

        // Null-fill missing attributes
        Object.keys(attributeColumns).forEach((key) => {
          if (attributeColumns[key].length < ids.length) {
            attributeColumns[key].push(null);
          }
        });
      });

      const hasVectors = vectors.length > 0;
      const allHaveVectors = vectors.length === ids.length;

      if (hasVectors && !allHaveVectors) {
        throw new Error(
          `Cannot mix documents with and without vectors in the same batch. ` +
          `${vectors.length} of ${ids.length} documents have vectors.`
        );
      }

      const includeVectors = hasVectors && allHaveVectors;

      const writeParams: Record<string, any> = {
        upsert_columns: {
          id: ids,
          ...(includeVectors && { vector: vectors }),
          ...attributeColumns,
        },
        ...(includeVectors && { distance_metric: 'cosine_distance' }),
      };

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
      // Try to get the namespace schema to verify it exists
      const ns = this.client.namespace(namespaceId);
      const schema = await ns.schema();
      
      // If we can get the schema, the namespace exists
      // Create a Namespace object from the available information
      return {
        id: namespaceId,
        created_at: new Date().toISOString(), // We don't have the actual creation date
        dimensions: schema.vector?.dimensions || 0
      };
    } catch (error) {
      // If we can't get the schema, the namespace doesn't exist
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
   * List namespaces from all configured regions in parallel
   */
  async listNamespacesFromAllRegions(
    regions: TurbopufferRegion[]
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
        const iterator = await client.namespaces({ page_size: 1000 });

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