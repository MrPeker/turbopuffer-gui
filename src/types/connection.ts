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
  // GCP Regions
  { id: 'gcp-us-east4', name: 'GCP N. Virginia', url: 'https://gcp-us-east4.turbopuffer.com', location: 'N. Virginia', provider: 'gcp' },
  { id: 'gcp-northamerica-northeast2', name: 'GCP Toronto', url: 'https://gcp-northamerica-northeast2.turbopuffer.com', location: 'Toronto', provider: 'gcp' },
  { id: 'gcp-us-west1', name: 'GCP Oregon', url: 'https://gcp-us-west1.turbopuffer.com', location: 'Oregon', provider: 'gcp' },
  { id: 'gcp-europe-west3', name: 'GCP Frankfurt', url: 'https://gcp-europe-west3.turbopuffer.com', location: 'Frankfurt', provider: 'gcp' },
  { id: 'gcp-us-central1', name: 'GCP Iowa', url: 'https://gcp-us-central1.turbopuffer.com', location: 'Iowa', provider: 'gcp' },
  { id: 'gcp-asia-southeast1', name: 'GCP Singapore', url: 'https://gcp-asia-southeast1.turbopuffer.com', location: 'Singapore', provider: 'gcp' },
  { id: 'gcp-asia-northeast3', name: 'GCP Seoul', url: 'https://gcp-asia-northeast3.turbopuffer.com', location: 'Seoul', provider: 'gcp' },
  // AWS Regions
  { id: 'aws-us-east-1', name: 'AWS N. Virginia', url: 'https://aws-us-east-1.turbopuffer.com', location: 'N. Virginia', provider: 'aws' },
  { id: 'aws-us-east-2', name: 'AWS Ohio', url: 'https://aws-us-east-2.turbopuffer.com', location: 'Ohio', provider: 'aws' },
  { id: 'aws-us-west-2', name: 'AWS Oregon', url: 'https://aws-us-west-2.turbopuffer.com', location: 'Oregon', provider: 'aws' },
  { id: 'aws-eu-central-1', name: 'AWS Frankfurt', url: 'https://aws-eu-central-1.turbopuffer.com', location: 'Frankfurt', provider: 'aws' },
  { id: 'aws-eu-west-1', name: 'AWS Ireland', url: 'https://aws-eu-west-1.turbopuffer.com', location: 'Ireland', provider: 'aws' },
  { id: 'aws-ap-southeast-2', name: 'AWS Sydney', url: 'https://aws-ap-southeast-2.turbopuffer.com', location: 'Sydney', provider: 'aws' },
  { id: 'aws-ap-south-1', name: 'AWS Mumbai', url: 'https://aws-ap-south-1.turbopuffer.com', location: 'Mumbai', provider: 'aws' },
];

export type ConnectionAPI = {
  saveConnection: (connection: ConnectionFormData) => Promise<Connection>;
  loadConnections: () => Promise<Connection[]>;
  testConnection: (connectionId: string) => Promise<TestConnectionResult>;
  testConnectionDirect: (connectionData: { regionId: string; apiKey: string }) => Promise<TestConnectionResult>;
  deleteConnection: (connectionId: string) => Promise<void>;
  getRegions: () => Promise<TurbopufferRegion[]>;
  getConnectionForUse: (connectionId: string) => Promise<ConnectionWithKey>;
};