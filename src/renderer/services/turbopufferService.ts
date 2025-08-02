import { Turbopuffer } from '@turbopuffer/turbopuffer';
import type { TurbopufferRegion, TestConnectionResult } from '../../types/connection';
import { settingsService } from './settingsService';

export class TurbopufferService {
  private client: Turbopuffer | null = null;
  private currentRegion: string | null = null;
  private currentApiKey: string | null = null;

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
   * Initialize or update the Turbopuffer client with new credentials
   */
  async initializeClient(apiKey: string, region: TurbopufferRegion): Promise<void> {
    if (this.currentApiKey === apiKey && this.currentRegion === region.id && this.client) {
      return; // Client already initialized with same credentials
    }

    const settings = await settingsService.getSettings();
    
    // Create client configuration
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

    this.client = new Turbopuffer(config);

    this.currentApiKey = apiKey;
    this.currentRegion = region.id;
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
   * Get the current client instance
   */
  getClient(): Turbopuffer | null {
    return this.client;
  }

  /**
   * List all namespaces
   */
  async listNamespaces(): Promise<string[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const namespaceIds = [];
    const namespaces = await this.client.namespaces();
    
    for await (const namespace of namespaces) {
      namespaceIds.push(namespace.id);
    }
    
    return namespaceIds;
  }
}

// Export singleton instance
export const turbopufferService = new TurbopufferService();