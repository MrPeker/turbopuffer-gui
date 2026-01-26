import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Connection, ConnectionFormData, ConnectionUpdateData, TestConnectionResult } from '../../types/connection';
import { getEffectiveRegions } from '../../types/connection';
import { Turbopuffer } from '@turbopuffer/turbopuffer';
import { turbopufferService } from '../services/turbopufferService';
import { settingsService } from '../services/settingsService';
import { permissionService } from '../services/permissionService';

interface ConnectionContextType {
  connections: Connection[];
  isLoading: boolean;
  error: string | null;
  activeConnectionId: string | null;
  turbopufferClient: Turbopuffer | null;
  clientError: Error | null;
  isActiveConnectionReadOnly: boolean;
  loadConnections: () => Promise<void>;
  saveConnection: (connection: ConnectionFormData) => Promise<Connection>;
  updateConnection: (connection: ConnectionUpdateData) => Promise<Connection>;
  deleteConnection: (connectionId: string) => Promise<void>;
  testConnection: (connectionId: string) => Promise<TestConnectionResult>;
  getConnectionById: (connectionId: string) => Connection | undefined;
  getDelimiterPreference: (connectionId: string) => string;
  setDelimiterPreference: (connectionId: string, delimiter: string) => void;
  setActiveConnection: (connectionId: string) => Promise<void>;
  clearActiveConnection: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delimiterPreferences, setDelimiterPreferences] = useState<Record<string, string>>({});
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [turbopufferClient, setTurbopufferClient] = useState<Turbopuffer | null>(null);
  const [clientError, setClientError] = useState<Error | null>(null);
  const [isActiveConnectionReadOnly, setIsActiveConnectionReadOnly] = useState(false);

  const loadConnections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedConnections = await window.electronAPI.loadConnections();
      setConnections(loadedConnections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnection = async (connectionData: ConnectionFormData): Promise<Connection> => {
    setError(null);
    try {
      const newConnection = await window.electronAPI.saveConnection(connectionData);
      await loadConnections(); // Reload to get updated list
      return newConnection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateConnection = async (updateData: ConnectionUpdateData): Promise<Connection> => {
    setError(null);
    try {
      const updatedConnection = await window.electronAPI.updateConnection(updateData);
      await loadConnections(); // Reload to get updated list
      return updatedConnection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    setError(null);
    try {
      await window.electronAPI.deleteConnection(connectionId);
      await loadConnections();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const testConnection = async (connectionId: string): Promise<TestConnectionResult> => {
    setError(null);
    try {
      // Get the connection details with decrypted API key
      const connectionDetails = await window.electronAPI.getConnectionForUse(connectionId);

      // Get effective regions (supporting migration from old format)
      const regions = getEffectiveRegions(connectionDetails);
      if (regions.length === 0) {
        throw new Error('No regions configured for this connection');
      }

      // Test using the first region (API key is valid across all regions)
      const result = await turbopufferService.testConnection(
        connectionDetails.apiKey,
        regions[0]
      );

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getConnectionById = (connectionId: string): Connection | undefined => {
    return connections.find(c => c.id === connectionId);
  };

  // Load connections on mount
  useEffect(() => {
    loadConnections();
    // Load delimiter preferences from localStorage
    const saved = localStorage.getItem('delimiterPreferences');
    if (saved) {
      setDelimiterPreferences(JSON.parse(saved));
    }
  }, []);

  const getDelimiterPreference = (connectionId: string): string => {
    return delimiterPreferences[connectionId] || '-';
  };

  const setDelimiterPreference = (connectionId: string, delimiter: string) => {
    const updated = { ...delimiterPreferences, [connectionId]: delimiter };
    setDelimiterPreferences(updated);
    localStorage.setItem('delimiterPreferences', JSON.stringify(updated));
  };

  const setActiveConnection = useCallback(async (connectionId: string) => {
    setClientError(null);
    setTurbopufferClient(null);

    try {
      // Get the connection details with decrypted API key
      const connectionDetails = await window.electronAPI.getConnectionForUse(connectionId);

      // Get the connection metadata to check read-only status
      const connection = connections.find(c => c.id === connectionId);
      const readOnly = connection?.isReadOnly ?? false;

      // Update permission service
      permissionService.setReadOnly(readOnly);
      setIsActiveConnectionReadOnly(readOnly);

      // Get effective regions (supporting migration from old format)
      const regions = getEffectiveRegions(connectionDetails);
      if (regions.length === 0) {
        throw new Error('No regions configured for this connection');
      }

      // Initialize Turbopuffer clients for all regions
      await turbopufferService.initializeClients(
        connectionDetails.apiKey,
        regions
      );

      const client = turbopufferService.getClient();
      if (!client) {
        throw new Error('Failed to initialize Turbopuffer client');
      }

      setActiveConnectionId(connectionId);
      setTurbopufferClient(client);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize connection');
      setClientError(error);
      throw error;
    }
  }, [connections]);

  const clearActiveConnection = () => {
    setActiveConnectionId(null);
    setTurbopufferClient(null);
    setClientError(null);
    setIsActiveConnectionReadOnly(false);
    permissionService.setReadOnly(false);
  };

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        isLoading,
        error,
        activeConnectionId,
        turbopufferClient,
        clientError,
        isActiveConnectionReadOnly,
        loadConnections,
        saveConnection,
        updateConnection,
        deleteConnection,
        testConnection,
        getConnectionById,
        getDelimiterPreference,
        setDelimiterPreference,
        setActiveConnection,
        clearActiveConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnections() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnections must be used within a ConnectionProvider');
  }
  return context;
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}