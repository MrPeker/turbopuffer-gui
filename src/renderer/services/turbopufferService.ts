import { Turbopuffer } from '@turbopuffer/turbopuffer';
import type { TurbopufferRegion, TestConnectionResult } from '../../types/connection';
import { settingsService } from './settingsService';

export class TurbopufferService {
  private clients: Map<string, Turbopuffer> = new Map();
  private currentApiKey: string | null = null;
  private currentRegionIds: Set<string> = new Set();

  // Legacy single-client support (for backward compatibility during transition)
  private primaryRegionId: string | null = null;

  /**
   * Log API requests based on the configured logging level
   */
  private async logRequest(method: string, url: string, data?: any, response?: any, error?: any) {
    const settings = await settingsService.getSettings();
    const loggingLevel = settings.api.requestLoggingLevel;

    if (loggingLevel === 'none') return;

    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      method,
      url,
    };

    if (loggingLevel === 'basic') {
      console.log('[API Request]', baseLog, {
        status: response?.status || (error ? 'error' : 'pending'),
      });
    } else if (loggingLevel === 'detailed') {
      console.log('[API Request]', {
        ...baseLog,
        headers: response?.headers || {},
        status: response?.status,
        error: error?.message,
      });
    } else if (loggingLevel === 'verbose') {
      console.log('[API Request]', {
        ...baseLog,
        requestData: data,
        response: response?.data,
        headers: response?.headers || {},
        status: response?.status,
        error: error,
      });
    }
  }

  /**
   * Initialize clients for multiple regions
   */
  async initializeClients(apiKey: string, regions: TurbopufferRegion[]): Promise<void> {
    const regionIds = new Set(regions.map(r => r.id));

    // Check if already initialized with same configuration
    if (
      this.currentApiKey === apiKey &&
      this.currentRegionIds.size === regionIds.size &&
      [...regionIds].every(id => this.currentRegionIds.has(id))
    ) {
      return; // Already initialized with same regions
    }

    const settings = await settingsService.getSettings();

    // Clear existing clients
    this.clients.clear();

    // Create a client for each region
    for (const region of regions) {
      const config: any = {
        apiKey,
        region: region.id,
      };

      // Apply custom endpoint if configured
      if (settings.api.customEndpoint) {
        config.baseURL = settings.api.customEndpoint;
      }

      // Apply timeout (convert seconds to milliseconds)
      if (settings.connection.requestTimeout) {
        config.timeout = settings.connection.requestTimeout * 1000;
      }

      // Apply retry configuration
      if (settings.connection.retryAttempts > 0) {
        config.retry = {
          retries: settings.connection.retryAttempts,
        };
      }

      this.clients.set(region.id, new Turbopuffer(config));
    }

    this.currentApiKey = apiKey;
    this.currentRegionIds = regionIds;
    this.primaryRegionId = regions.length > 0 ? regions[0].id : null;
  }

  /**
   * Initialize or update a single Turbopuffer client (legacy method for backward compatibility)
   */
  async initializeClient(apiKey: string, region: TurbopufferRegion): Promise<void> {
    await this.initializeClients(apiKey, [region]);
  }

  /**
   * Test connection by listing namespaces
   */
  async testConnection(apiKey: string, region: TurbopufferRegion): Promise<TestConnectionResult> {
    try {
      const settings = await settingsService.getSettings();
      
      // Create client configuration for testing
      const config: any = {
        apiKey,
        region: region.id,
      };

      // Apply custom endpoint if configured
      if (settings.api.customEndpoint) {
        config.baseURL = settings.api.customEndpoint;
      }

      // Apply timeout for test (shorter timeout for testing)
      config.timeout = Math.min(settings.connection.requestTimeout * 1000, 10000);

      const client = new Turbopuffer(config);

      // Test the connection by listing namespaces
      const namespaces = await client.namespaces();
      const namespaceIds = [];
      
      for await (const namespace of namespaces) {
        namespaceIds.push(namespace.id);
      }

      return {
        success: true,
        message: 'Connection successful',
        namespaces: namespaceIds,
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          return {
            success: false,
            message: 'Invalid API key. Please check your credentials.',
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }
      
      return {
        success: false,
        message: 'Connection failed',
      };
    }
  }

  /**
   * Get the primary client instance (first region, for legacy compatibility)
   */
  getClient(): Turbopuffer | null {
    if (this.primaryRegionId) {
      return this.clients.get(this.primaryRegionId) || null;
    }
    // Fallback to first client if any
    const firstClient = this.clients.values().next();
    return firstClient.done ? null : firstClient.value;
  }

  /**
   * Get a client for a specific region
   */
  getClientForRegion(regionId: string): Turbopuffer | null {
    return this.clients.get(regionId) || null;
  }

  /**
   * Get all initialized clients
   */
  getAllClients(): Map<string, Turbopuffer> {
    return new Map(this.clients);
  }

  /**
   * Get all region IDs that have initialized clients
   */
  getInitializedRegionIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * List all namespaces from the primary client
   */
  async listNamespaces(): Promise<string[]> {
    const client = this.getClient();
    if (!client) {
      throw new Error('Client not initialized');
    }

    const namespaceIds: string[] = [];
    const namespaces = await client.namespaces();

    for await (const namespace of namespaces) {
      namespaceIds.push(namespace.id);
    }

    return namespaceIds;
  }

  /**
   * List namespaces from a specific region
   */
  async listNamespacesForRegion(regionId: string): Promise<string[]> {
    const client = this.clients.get(regionId);
    if (!client) {
      throw new Error(`Client not initialized for region: ${regionId}`);
    }

    const namespaceIds: string[] = [];
    const namespaces = await client.namespaces();

    for await (const namespace of namespaces) {
      namespaceIds.push(namespace.id);
    }

    return namespaceIds;
  }

  /**
   * Clear all clients
   */
  clearClients(): void {
    this.clients.clear();
    this.currentApiKey = null;
    this.currentRegionIds.clear();
    this.primaryRegionId = null;
  }
}

// Export singleton instance
export const turbopufferService = new TurbopufferService();