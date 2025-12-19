import { Turbopuffer } from '@turbopuffer/turbopuffer';
import type {
  Namespace,
  NamespaceListParams,
  NamespaceSchema,
  NamespacesResponse
} from '../../types/namespace';
import { permissionService } from './permissionService';

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

  async createNamespace(namespaceId: string): Promise<void> {
    permissionService.checkWritePermission();

    if (!this.client) {
      throw new Error('Turbopuffer client not initialized');
    }

    // Namespaces are created implicitly on first write
    // We'll create an empty document and then delete it
    const ns = this.client.namespace(namespaceId);
    
    try {
      // Write a temporary document to create the namespace
      await ns.write({
        upsert_columns: {
          id: ['__temp_init__'],
          vector: [[0.0, 0.0]], // Minimal vector
        },
        distance_metric: 'cosine_distance'
      });

      // Delete the temporary document
      await ns.write({
        deletes: ['__temp_init__']
      });
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