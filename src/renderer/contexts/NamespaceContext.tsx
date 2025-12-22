import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { turbopufferService } from '../services/turbopufferService';
import { namespaceService } from '../services/namespaceService';
import type { Namespace } from '../../types/namespace';

interface NamespaceContextType {
  getNamespaceById: (connectionId: string, namespaceId: string) => Promise<Namespace | null>;
  loadNamespacesForConnection: (connectionId: string) => Promise<Namespace[]>;
  recentNamespaces: Namespace[];
  addRecentNamespace: (connectionId: string, namespace: Namespace) => void;
  clearRecentNamespaces: () => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(undefined);

const RECENT_NAMESPACES_STORAGE_KEY = 'recentNamespaces';
const MAX_RECENT_NAMESPACES = 3;

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const [recentNamespaces, setRecentNamespaces] = useState<Namespace[]>([]);

  // Load recent namespaces from localStorage on mount
  useEffect(() => {
    const loadRecentNamespaces = () => {
      try {
        const storedData = localStorage.getItem(RECENT_NAMESPACES_STORAGE_KEY);
        if (storedData) {
          const stored = JSON.parse(storedData);
          if (stored.namespaces) {
            setRecentNamespaces(stored.namespaces);
          }
        }
      } catch (error) {
        console.error('Failed to load recent namespaces:', error);
        setRecentNamespaces([]);
      }
    };

    loadRecentNamespaces();
  }, []);

  const addRecentNamespace = useCallback((connectionId: string, namespace: Namespace) => {
    if (!connectionId) return;

    setRecentNamespaces(prev => {
      // Remove duplicates and limit to MAX_RECENT_NAMESPACES
      const filtered = prev.filter(ns => ns.id !== namespace.id);
      const updated = [namespace, ...filtered].slice(0, MAX_RECENT_NAMESPACES);

      // Persist to localStorage
      localStorage.setItem(RECENT_NAMESPACES_STORAGE_KEY, JSON.stringify({
        namespaces: updated,
        connectionId,
        timestamp: new Date().toISOString()
      }));

      return updated;
    });
  }, []);

  const clearRecentNamespaces = useCallback(() => {
    setRecentNamespaces([]);
    localStorage.removeItem(RECENT_NAMESPACES_STORAGE_KEY);
  }, []);

  const getNamespaceById = useCallback(async (
    connectionId: string,
    namespaceId: string
  ): Promise<Namespace | null> => {
    if (!connectionId || !namespaceId) {
      return null;
    }

    try {
      // Initialize the client if needed
      const connectionDetails = await window.electronAPI.getConnectionForUse(connectionId);
      await turbopufferService.initializeClient(connectionDetails.apiKey, connectionDetails.region);

      const client = turbopufferService.getClient();
      if (!client) {
        throw new Error('Failed to initialize TurboPuffer client');
      }

      namespaceService.setClient(client);
      const namespace = await namespaceService.getNamespaceById(namespaceId);

      if (namespace) {
        // Add to recent namespaces
        addRecentNamespace(connectionId, namespace);
      }

      return namespace;
    } catch (error) {
      console.error('Failed to load namespace by ID:', error);
      return null;
    }
  }, [addRecentNamespace]);

  const loadNamespacesForConnection = useCallback(async (
    connectionId: string
  ): Promise<Namespace[]> => {
    if (!connectionId) {
      return [];
    }

    try {
      // Initialize the client if needed
      const connectionDetails = await window.electronAPI.getConnectionForUse(connectionId);
      await turbopufferService.initializeClient(connectionDetails.apiKey, connectionDetails.region);

      const client = turbopufferService.getClient();
      if (!client) {
        throw new Error('Failed to initialize TurboPuffer client');
      }

      namespaceService.setClient(client);
      const response = await namespaceService.listNamespaces();

      return response.namespaces;
    } catch (error) {
      console.error('Failed to load namespaces for connection:', error);
      return [];
    }
  }, []);

  return (
    <NamespaceContext.Provider
      value={{
        getNamespaceById,
        loadNamespacesForConnection,
        recentNamespaces,
        addRecentNamespace,
        clearRecentNamespaces,
      }}
    >
      {children}
    </NamespaceContext.Provider>
  );
}

export function useNamespace() {
  const context = useContext(NamespaceContext);
  if (!context) {
    throw new Error('useNamespace must be used within a NamespaceProvider');
  }
  return context;
}