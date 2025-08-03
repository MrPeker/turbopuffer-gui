import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useConnection } from './ConnectionContext';
import { turbopufferService } from '../services/turbopufferService';
import { namespaceService } from '../services/namespaceService';
import type { Namespace } from '../../types/namespace';

interface NamespaceContextType {
  selectedNamespace: Namespace | null;
  selectNamespace: (namespace: Namespace | null) => void;
  clearNamespace: () => void;
  loadNamespaceById: (namespaceId: string) => Promise<Namespace | null>;
  recentNamespaces: Namespace[];
  addRecentNamespace: (namespace: Namespace) => void;
  clearRecentNamespaces: () => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(undefined);

const NAMESPACE_STORAGE_KEY = 'selectedNamespace';
const RECENT_NAMESPACES_STORAGE_KEY = 'recentNamespaces';
const MAX_RECENT_NAMESPACES = 3;

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [recentNamespaces, setRecentNamespaces] = useState<Namespace[]>([]);
  const { activeConnection } = useConnection();

  // Load namespace from localStorage on mount
  useEffect(() => {
    const loadStoredNamespace = () => {
      try {
        const storedData = localStorage.getItem(NAMESPACE_STORAGE_KEY);
        if (storedData) {
          const stored = JSON.parse(storedData);
          // Only restore if we have the same connection
          if (stored.connectionId === activeConnection?.id && stored.namespace) {
            setSelectedNamespace(stored.namespace);
          }
        }
      } catch (error) {
        console.error('Failed to load stored namespace:', error);
      }
    };

    if (activeConnection) {
      loadStoredNamespace();
    }
  }, [activeConnection]);

  // Load recent namespaces from localStorage on mount and when connection changes
  useEffect(() => {
    const loadRecentNamespaces = () => {
      try {
        const storedData = localStorage.getItem(RECENT_NAMESPACES_STORAGE_KEY);
        if (storedData) {
          const stored = JSON.parse(storedData);
          // Only restore if we have the same connection
          if (stored.connectionId === activeConnection?.id && stored.namespaces) {
            setRecentNamespaces(stored.namespaces);
          }
        }
      } catch (error) {
        console.error('Failed to load recent namespaces:', error);
        setRecentNamespaces([]);
      }
    };

    if (activeConnection) {
      loadRecentNamespaces();
    } else {
      setRecentNamespaces([]);
    }
  }, [activeConnection]);

  // Clear namespace when connection changes
  useEffect(() => {
    if (!activeConnection) {
      setSelectedNamespace(null);
      localStorage.removeItem(NAMESPACE_STORAGE_KEY);
    }
  }, [activeConnection]);

  const addRecentNamespace = useCallback((namespace: Namespace) => {
    if (!activeConnection) return;
    
    setRecentNamespaces(prev => {
      // Remove duplicates and limit to MAX_RECENT_NAMESPACES
      const filtered = prev.filter(ns => ns.id !== namespace.id);
      const updated = [namespace, ...filtered].slice(0, MAX_RECENT_NAMESPACES);
      
      // Persist to localStorage
      localStorage.setItem(RECENT_NAMESPACES_STORAGE_KEY, JSON.stringify({
        namespaces: updated,
        connectionId: activeConnection.id,
        timestamp: new Date().toISOString()
      }));
      
      return updated;
    });
  }, [activeConnection]);

  const clearRecentNamespaces = useCallback(() => {
    setRecentNamespaces([]);
    localStorage.removeItem(RECENT_NAMESPACES_STORAGE_KEY);
  }, []);

  const selectNamespace = useCallback((namespace: Namespace | null) => {
    setSelectedNamespace(namespace);
    
    // Persist to localStorage
    if (namespace && activeConnection) {
      localStorage.setItem(NAMESPACE_STORAGE_KEY, JSON.stringify({
        namespace,
        connectionId: activeConnection.id,
        timestamp: new Date().toISOString()
      }));
      
      // Add to recent namespaces
      addRecentNamespace(namespace);
    } else {
      localStorage.removeItem(NAMESPACE_STORAGE_KEY);
    }
  }, [activeConnection, addRecentNamespace]);

  const clearNamespace = useCallback(() => {
    setSelectedNamespace(null);
    localStorage.removeItem(NAMESPACE_STORAGE_KEY);
  }, []);

  const loadNamespaceById = useCallback(async (namespaceId: string): Promise<Namespace | null> => {
    if (!activeConnection || !namespaceId) {
      return null;
    }

    try {
      // Initialize the client if needed
      const connectionDetails = await window.electronAPI.getConnectionForUse(activeConnection.id);
      await turbopufferService.initializeClient(connectionDetails.apiKey, connectionDetails.region);
      
      const client = turbopufferService.getClient();
      if (!client) {
        throw new Error('Failed to initialize TurboPuffer client');
      }

      namespaceService.setClient(client);
      const namespace = await namespaceService.getNamespaceById(namespaceId);
      
      if (namespace) {
        // Auto-select the namespace if it was found
        selectNamespace(namespace);
      }
      
      return namespace;
    } catch (error) {
      console.error('Failed to load namespace by ID:', error);
      return null;
    }
  }, [activeConnection, selectNamespace]);

  return (
    <NamespaceContext.Provider
      value={{
        selectedNamespace,
        selectNamespace,
        clearNamespace,
        loadNamespaceById,
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