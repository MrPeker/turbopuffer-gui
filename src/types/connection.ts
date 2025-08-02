export interface TurbopufferRegion {
  id: string;
  name: string;
  url: string; // Not used anymore, kept for backward compatibility
  location: string;
  provider: 'aws' | 'gcp';
}

export interface Connection {
  id: string;
  name: string;
  region: TurbopufferRegion;
  isDefault: boolean;
  lastUsed: Date;
  createdAt: Date;
  testStatus?: 'success' | 'failed' | 'testing';
}

export interface ConnectionWithKey extends Connection {
  apiKey: string;
}

export interface StoredConnection extends Connection {
  apiKeyEncrypted: Buffer;
}

export interface ConnectionFormData {
  name: string;
  regionId: string;
  apiKey: string;
  isDefault?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  namespaces?: string[];
}

export interface NamespaceResponse {
  id: string;
}

export const TURBOPUFFER_REGIONS: TurbopufferRegion[] = [
  { id: 'aws-ap-southeast-2', name: 'AWS Sydney', url: 'https://api.turbopuffer.com', location: 'Sydney', provider: 'aws' },
  { id: 'aws-eu-central-1', name: 'AWS Frankfurt', url: 'https://api.turbopuffer.com', location: 'Frankfurt', provider: 'aws' },
  { id: 'aws-us-east-1', name: 'AWS N. Virginia', url: 'https://api.turbopuffer.com', location: 'N. Virginia', provider: 'aws' },
  { id: 'aws-us-east-2', name: 'AWS Ohio', url: 'https://api.turbopuffer.com', location: 'Ohio', provider: 'aws' },
  { id: 'aws-us-west-2', name: 'AWS Oregon', url: 'https://api.turbopuffer.com', location: 'Oregon', provider: 'aws' },
  { id: 'gcp-us-central1', name: 'GCP Iowa', url: 'https://api.turbopuffer.com', location: 'Iowa', provider: 'gcp' },
  { id: 'gcp-us-west1', name: 'GCP Oregon', url: 'https://api.turbopuffer.com', location: 'Oregon', provider: 'gcp' },
  { id: 'gcp-us-east4', name: 'GCP N. Virginia', url: 'https://api.turbopuffer.com', location: 'N. Virginia', provider: 'gcp' },
  { id: 'gcp-europe-west3', name: 'GCP Frankfurt', url: 'https://api.turbopuffer.com', location: 'Frankfurt', provider: 'gcp' },
];

export type ConnectionAPI = {
  saveConnection: (connection: ConnectionFormData) => Promise<Connection>;
  loadConnections: () => Promise<Connection[]>;
  testConnection: (connectionId: string) => Promise<TestConnectionResult>;
  testConnectionDirect: (connectionData: { regionId: string; apiKey: string }) => Promise<TestConnectionResult>;
  deleteConnection: (connectionId: string) => Promise<void>;
  getRegions: () => Promise<TurbopufferRegion[]>;
  setDefaultConnection: (connectionId: string) => Promise<void>;
  getConnectionForUse: (connectionId: string) => Promise<ConnectionWithKey>;
};