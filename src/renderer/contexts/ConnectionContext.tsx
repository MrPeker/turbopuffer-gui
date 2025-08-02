import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Connection, ConnectionFormData, TestConnectionResult } from '../../types/connection';
import { turbopufferService } from '../services/turbopufferService';
import { settingsService } from '../services/settingsService';

interface ConnectionContextType {
  connections: Connection[];
  selectedConnection: Connection | null;
  activeConnection: Connection | null;
  isLoading: boolean;
  error: string | null;
  loadConnections: () => Promise<void>;
  saveConnection: (connection: ConnectionFormData) => Promise<Connection>;
  deleteConnection: (connectionId: string) => Promise<void>;
  testConnection: (connectionId: string) => Promise<TestConnectionResult>;
  selectConnection: (connectionId: string) => void;
  setDefaultConnection: (connectionId: string) => Promise<void>;
  getDelimiterPreference: (connectionId: string) => string;
  setDelimiterPreference: (connectionId: string, delimiter: string) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delimiterPreferences, setDelimiterPreferences] = useState<Record<string, string>>({});

  const loadConnections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedConnections = await window.electronAPI.loadConnections();
      setConnections(loadedConnections);
      
      // Auto-select connection based on settings or default
      if (!selectedConnection) {
        const settings = await settingsService.getSettings();
        
        // First try to select the connection from settings
        if (settings.connection.defaultConnectionId) {
          const settingsConn = loadedConnections.find(c => c.id === settings.connection.defaultConnectionId);
          if (settingsConn) {
            setSelectedConnection(settingsConn);
            return;
          }
        }
        
        // Fall back to connection marked as default
        const defaultConn = loadedConnections.find(c => c.isDefault);
        if (defaultConn) {
          setSelectedConnection(defaultConn);
        }
      }
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

  const deleteConnection = async (connectionId: string) => {
    setError(null);
    try {
      await window.electronAPI.deleteConnection(connectionId);
      
      // If we deleted the selected connection, clear selection
      if (selectedConnection?.id === connectionId) {
        setSelectedConnection(null);
      }
      
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
      
      // Test using the renderer-side service
      const result = await turbopufferService.testConnection(
        connectionDetails.apiKey,
        connectionDetails.region
      );
      
      // Update the connection status in storage
      if (result.success) {
        // You might want to update the connection's test status here
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const selectConnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      setSelectedConnection(connection);
    }
  };

  const setDefaultConnection = async (connectionId: string) => {
    setError(null);
    try {
      await window.electronAPI.setDefaultConnection(connectionId);
      await loadConnections();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
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

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        selectedConnection,
        activeConnection: selectedConnection,
        isLoading,
        error,
        loadConnections,
        saveConnection,
        deleteConnection,
        testConnection,
        selectConnection,
        setDefaultConnection,
        getDelimiterPreference,
        setDelimiterPreference,
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