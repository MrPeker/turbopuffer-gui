import { safeStorage, app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { Turbopuffer } from '@turbopuffer/turbopuffer';
import type { 
  Connection, 
  ConnectionFormData, 
  StoredConnection, 
  TurbopufferRegion,
  TestConnectionResult,
  ConnectionWithKey
} from '../../types/connection';
import { TURBOPUFFER_REGIONS } from '../../types/connection';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const CONNECTIONS_FILE = 'connections.json';

export class CredentialService {
  private connectionsPath: string;
  private regions: TurbopufferRegion[];
  private encryptionAvailable: boolean;
  private fallbackKey: Buffer;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.connectionsPath = path.join(userDataPath, CONNECTIONS_FILE);
    this.regions = TURBOPUFFER_REGIONS;
    
    // Check if safeStorage encryption is available
    this.encryptionAvailable = safeStorage.isEncryptionAvailable();
    
    // Create a fallback key based on machine ID or a fixed key
    // This is less secure but works when safeStorage is unavailable
    this.fallbackKey = crypto.createHash('sha256')
      .update(app.getName() + 'turbopuffer-gui-fallback')
      .digest();
  }

  private encryptString(text: string): Buffer {
    if (this.encryptionAvailable) {
      return safeStorage.encryptString(text);
    } else {
      // Fallback encryption using crypto
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.fallbackKey, iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      // Prepend IV to encrypted data
      return Buffer.concat([iv, encrypted]);
    }
  }

  private decryptString(encrypted: Buffer): string {
    if (this.encryptionAvailable) {
      return safeStorage.decryptString(encrypted);
    } else {
      // Fallback decryption
      const iv = encrypted.slice(0, 16);
      const encryptedData = encrypted.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.fallbackKey, iv);
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      return decrypted.toString('utf8');
    }
  }

  async saveConnection(connectionData: ConnectionFormData): Promise<Connection> {
    const connections = await this.loadStoredConnections();
    
    const region = this.regions.find(r => r.id === connectionData.regionId);
    if (!region) {
      throw new Error('Invalid region selected');
    }

    // Encrypt the API key
    const encryptedApiKey = this.encryptString(connectionData.apiKey);

    // If this is set as default, unset other defaults
    if (connectionData.isDefault) {
      connections.forEach(conn => {
        conn.isDefault = false;
      });
    }

    const newConnection: StoredConnection = {
      id: uuidv4(),
      name: connectionData.name,
      region,
      apiKeyEncrypted: encryptedApiKey,
      isDefault: connectionData.isDefault || false,
      lastUsed: new Date(),
      createdAt: new Date(),
    };

    connections.push(newConnection);
    await this.saveStoredConnections(connections);

    // Return without encrypted key
    const { apiKeyEncrypted: _, ...connectionWithoutKey } = newConnection;
    return connectionWithoutKey;
  }

  async loadConnections(): Promise<Connection[]> {
    const storedConnections = await this.loadStoredConnections();
    
    // Return connections without encrypted keys
    return storedConnections.map(({ apiKeyEncrypted: _, ...conn }) => conn);
  }

  async getConnectionForUse(connectionId: string): Promise<ConnectionWithKey> {
    const connections = await this.loadStoredConnections();
    const connection = connections.find(c => c.id === connectionId);
    
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Decrypt the API key
    const apiKey = this.decryptString(connection.apiKeyEncrypted);
    
    // Update last used
    connection.lastUsed = new Date();
    await this.saveStoredConnections(connections);

    const { apiKeyEncrypted: _, ...connectionData } = connection;
    return {
      ...connectionData,
      apiKey
    };
  }

  async testConnection(connectionId: string): Promise<TestConnectionResult> {
    try {
      const connection = await this.getConnectionForUse(connectionId);
      
      // Initialize Turbopuffer client
      const client = new Turbopuffer({
        apiKey: connection.apiKey,
        region: connection.region.id,
      });
      
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
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    const connections = await this.loadStoredConnections();
    const filteredConnections = connections.filter(c => c.id !== connectionId);
    
    if (connections.length === filteredConnections.length) {
      throw new Error('Connection not found');
    }

    await this.saveStoredConnections(filteredConnections);
  }

  async setDefaultConnection(connectionId: string): Promise<void> {
    const connections = await this.loadStoredConnections();
    
    const connectionToSetDefault = connections.find(c => c.id === connectionId);
    if (!connectionToSetDefault) {
      throw new Error('Connection not found');
    }

    // Unset all defaults and set the new one
    connections.forEach(conn => {
      conn.isDefault = conn.id === connectionId;
    });

    await this.saveStoredConnections(connections);
  }

  getRegions(): TurbopufferRegion[] {
    return this.regions;
  }

  private async loadStoredConnections(): Promise<StoredConnection[]> {
    try {
      const data = await fs.readFile(this.connectionsPath, 'utf-8');
      const connections = JSON.parse(data);
      
      // Convert date strings back to Date objects and Buffer data
      interface StoredConnectionData {
        id: string;
        name: string;
        region: TurbopufferRegion;
        apiKeyEncrypted: string;
        isDefault: boolean;
        lastUsed: string;
        createdAt: string;
        testStatus?: 'success' | 'failed' | 'testing';
      }
      
      return connections.map((conn: StoredConnectionData) => ({
        ...conn,
        apiKeyEncrypted: Buffer.from(conn.apiKeyEncrypted, 'base64'),
        lastUsed: new Date(conn.lastUsed),
        createdAt: new Date(conn.createdAt),
      }));
    } catch (error) {
      // File doesn't exist or is corrupted, return empty array
      return [];
    }
  }

  private async saveStoredConnections(connections: StoredConnection[]): Promise<void> {
    // Convert Buffers to base64 for JSON storage
    const connectionsToSave = connections.map(conn => ({
      ...conn,
      apiKeyEncrypted: conn.apiKeyEncrypted.toString('base64'),
    }));

    await fs.writeFile(
      this.connectionsPath, 
      JSON.stringify(connectionsToSave, null, 2),
      'utf-8'
    );
  }

  async testConnectionDirect(connectionData: {
    regionId: string;
    apiKey: string;
  }): Promise<{ success: boolean; message: string; namespaces?: string[] }> {
    const region = TURBOPUFFER_REGIONS.find(r => r.id === connectionData.regionId);
    if (!region) {
      throw new Error('Invalid region');
    }

    try {
      console.log('Testing connection with Turbopuffer SDK...');
      console.log('API Key prefix:', connectionData.apiKey.substring(0, 10) + '...');
      console.log('Region:', region.name);
      
      // Initialize Turbopuffer client
      const client = new Turbopuffer({
        apiKey: connectionData.apiKey,
        region: region.id,
      });
      
      // Test the connection by listing namespaces
      const namespaces = await client.namespaces();
      const namespaceIds = [];
      
      for await (const namespace of namespaces) {
        namespaceIds.push(namespace.id);
      }
      
      console.log('Connection successful! Found', namespaceIds.length, 'namespaces');
      
      return {
        success: true,
        message: 'Connection successful',
        namespaces: namespaceIds,
      };
    } catch (error) {
      console.error('Connection failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}