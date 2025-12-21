import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type { Namespace, NamespaceMetadata, NamespacesResponse } from "../../types/namespace";
import type { TurbopufferRegion } from "../../types/connection";
import { namespaceService } from "../services/namespaceService";
import { turbopufferService } from "../services/turbopufferService";

// Enable Set/Map support in Immer
enableMapSet();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RECENT_NAMESPACES_KEY = 'turbopuffer_recent_namespaces';
const MAX_RECENT_NAMESPACES = 6;

interface RecentNamespaceEntry {
  namespace: Namespace;
  connectionId: string;
  timestamp: string;
}

interface NamespacesState {
  // Data
  namespaces: Namespace[];
  totalCount: number | null;
  recentNamespaces: Namespace[];

  // Connection State
  currentConnectionId: string | null;

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchTerm: string;
  viewMode: 'list' | 'tree';
  intendedDestination: string | null;

  // Tree View State
  expandedFolders: Set<string>;
  loadingFolders: Set<string>;
  loadedPrefixes: Set<string>;

  // Delete State
  deletingNamespace: string | null;
  deleteDialogNamespace: string | null;

  // Client State
  isClientInitialized: boolean;
  initializationAttempts: number;
  maxInitAttempts: number;

  // Cache (per connection)
  namespacesCache: Map<string, {
    namespaces: Namespace[];
    timestamp: number;
  }>;
  viewModeCache: Map<string, 'list' | 'tree'>; // Per-connection view preference
  expandedFoldersCache: Map<string, Set<string>>; // Per-connection expanded state

  // Metadata Cache
  metadataCache: Map<string, {
    metadata: NamespaceMetadata;
    timestamp: number;
  }>;
  metadataLoading: Set<string>; // Namespace IDs currently loading metadata

  // Actions - Connection
  setConnectionId: (connectionId: string | null) => void;
  initializeClient: (connectionId: string, region: TurbopufferRegion) => Promise<boolean>;

  // Actions - Data Loading
  loadNamespaces: (force?: boolean, prefix?: string, isLoadMore?: boolean) => Promise<void>;
  refresh: () => Promise<void>;

  // Actions - CRUD
  createNamespace: (namespaceId: string) => Promise<void>;
  deleteNamespace: (namespaceId: string) => Promise<void>;
  getNamespaceById: (connectionId: string, namespaceId: string) => Promise<Namespace | null>;

  // Actions - Search
  setSearchTerm: (term: string) => void;
  searchNamespacesAPI: (prefix: string) => Promise<void>;
  clearSearch: () => void;

  // Actions - UI
  setViewMode: (mode: 'list' | 'tree') => void;
  setIntendedDestination: (destination: string | null) => void;

  // Actions - Tree View
  toggleFolder: (folderId: string) => Promise<void>;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  addLoadingFolder: (folderId: string) => void;
  removeLoadingFolder: (folderId: string) => void;
  loadMoreForPrefix: (prefix: string) => Promise<void>;
  resetExpandedFolders: () => void;
  autoExpandSingleChildren: (folderId: string) => Promise<void>;

  // Actions - Delete Dialog
  setDeleteDialogNamespace: (namespaceId: string | null) => void;
  handleDeleteConfirm: () => Promise<void>;

  // Actions - Recent Namespaces
  addRecentNamespace: (connectionId: string, namespace: Namespace) => void;
  clearRecentNamespaces: () => void;
  loadRecentNamespaces: (connectionId?: string) => void;

  // Actions - Metadata
  fetchMetadataForNamespaces: (namespaceIds: string[]) => Promise<void>;
  getNamespaceMetadata: (namespaceId: string) => NamespaceMetadata | undefined;
  isMetadataLoading: (namespaceId: string) => boolean;

  // Selectors (computed state)
  getFilteredNamespaces: () => Namespace[];

  // Utilities
  clearCache: () => void;
  reset: () => void;
  resetInitialization: () => void;
}

export const useNamespacesStore = create<NamespacesState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        namespaces: [],
        totalCount: null,
        recentNamespaces: [],

        currentConnectionId: null,

        isLoading: false,
        isRefreshing: false,
        isSearching: false,
        isLoadingMore: false,
        error: null,
        searchTerm: '',
        viewMode: 'list',
        intendedDestination: null,

        expandedFolders: new Set(),
        loadingFolders: new Set(),
        loadedPrefixes: new Set(),

        deletingNamespace: null,
        deleteDialogNamespace: null,

        isClientInitialized: false,
        initializationAttempts: 0,
        maxInitAttempts: 3,

        namespacesCache: new Map(),
        viewModeCache: new Map(),
        expandedFoldersCache: new Map(),
        metadataCache: new Map(),
        metadataLoading: new Set(),

        // Connection Actions
        setConnectionId: (connectionId) => {
          const state = get();
          if (state.currentConnectionId !== connectionId) {
            set((state) => {
              state.currentConnectionId = connectionId;
              // Reset namespace data
              state.namespaces = [];
              state.totalCount = null;
              state.searchTerm = '';
              state.loadedPrefixes = new Set();
              state.error = null;
              state.isClientInitialized = false;
              state.initializationAttempts = 0;

              // Restore per-connection UI state from cache
              if (connectionId) {
                state.viewMode = state.viewModeCache.get(connectionId) || 'list';
                state.expandedFolders = state.expandedFoldersCache.get(connectionId) || new Set();
              }
            });
          }
        },

        initializeClient: async (connectionId, region) => {
          const state = get();

          if (state.initializationAttempts >= state.maxInitAttempts) {
            console.error('Max initialization attempts reached');
            set((state) => {
              state.error = 'Failed to initialize client after multiple attempts';
            });
            return false;
          }

          set((state) => {
            state.initializationAttempts++;
          });

          try {
            // Get the connection details with decrypted API key
            const connectionDetails = await window.electronAPI.getConnectionForUse(connectionId);

            // Initialize client with API key and region
            await turbopufferService.initializeClient(connectionDetails.apiKey, region);
            const client = turbopufferService.getClient();
            namespaceService.setClient(client);

            set((state) => {
              state.isClientInitialized = true;
              state.error = null;
              state.initializationAttempts = 0; // Reset counter on success
            });

            return true;
          } catch (error) {
            console.error('Failed to initialize client:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to initialize client';
              state.isClientInitialized = false;
            });
            return false;
          }
        },

        // Data Loading Actions
        loadNamespaces: async (force = false, prefix, isLoadMore = false) => {
          const state = get();

          if (!state.currentConnectionId || (state.isLoading && !isLoadMore)) {
            return;
          }

          if (!state.isClientInitialized) {
            console.warn('Client not initialized');
            return;
          }

          const cacheKey = `${state.currentConnectionId}${prefix ? `-${prefix}` : ''}`;

          // Check cache
          if (!force && !isLoadMore) {
            const cached = state.namespacesCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              set((state) => {
                state.namespaces = cached.namespaces;
                state.totalCount = cached.namespaces.length;
              });
              return;
            }
          }

          set((state) => {
            if (!isLoadMore) {
              state.isLoading = true;
            } else {
              state.isLoadingMore = true;
            }
            state.error = null;
          });

          try {
            const response = await namespaceService.listNamespaces({
              prefix,
              page_size: 1000
            });

            set((state) => {
              if (prefix && isLoadMore) {
                // Merge results when loading more
                const existingIds = new Set(state.namespaces.map(ns => ns.id));
                const newNamespaces = response.namespaces.filter(ns => !existingIds.has(ns.id));
                state.namespaces = [...state.namespaces, ...newNamespaces];
                state.loadedPrefixes.add(prefix);
              } else {
                state.namespaces = response.namespaces;
                state.loadedPrefixes = new Set();
              }
              state.totalCount = state.namespaces.length;

              // Update cache
              state.namespacesCache.set(cacheKey, {
                namespaces: state.namespaces,
                timestamp: Date.now()
              });
            });
          } catch (error) {
            console.error('Failed to load namespaces:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to load namespaces';
            });
          } finally {
            set((state) => {
              state.isLoading = false;
              state.isLoadingMore = false;
            });
          }
        },

        refresh: async () => {
          set((state) => {
            state.isRefreshing = true;
          });

          try {
            await get().loadNamespaces(true);
          } finally {
            set((state) => {
              state.isRefreshing = false;
            });
          }
        },

        // CRUD Actions
        createNamespace: async (namespaceId) => {
          try {
            await namespaceService.createNamespace(namespaceId);
            // Reload namespaces to show the new one
            await get().loadNamespaces(true);
          } catch (error) {
            console.error('Failed to create namespace:', error);
            throw error;
          }
        },

        deleteNamespace: async (namespaceId) => {
          set((state) => {
            state.deletingNamespace = namespaceId;
          });

          try {
            await namespaceService.deleteNamespace(namespaceId);

            // Remove from state
            set((state) => {
              state.namespaces = state.namespaces.filter(ns => ns.id !== namespaceId);
              state.totalCount = state.namespaces.length;
              state.deletingNamespace = null;
              state.deleteDialogNamespace = null;
            });

            // Clear cache
            get().clearCache();
          } catch (error) {
            console.error('Failed to delete namespace:', error);
            set((state) => {
              state.deletingNamespace = null;
              state.error = error instanceof Error ? error.message : 'Failed to delete namespace';
            });
            throw error;
          }
        },

        getNamespaceById: async (connectionId, namespaceId) => {
          try {
            return await namespaceService.getNamespaceById(namespaceId);
          } catch (error) {
            console.error('Failed to get namespace:', error);
            return null;
          }
        },

        // Search Actions
        setSearchTerm: (term) => {
          set((state) => {
            state.searchTerm = term;
          });
        },

        searchNamespacesAPI: async (prefix) => {
          set((state) => {
            state.isSearching = true;
            state.error = null;
          });

          try {
            const results = await namespaceService.searchNamespaces(prefix);
            set((state) => {
              state.namespaces = results;
              state.totalCount = results.length;
            });
          } catch (error) {
            console.error('Failed to search namespaces:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to search namespaces';
            });
          } finally {
            set((state) => {
              state.isSearching = false;
            });
          }
        },

        clearSearch: () => {
          set((state) => {
            state.searchTerm = '';
          });
          get().loadNamespaces(true);
        },

        // UI Actions
        setViewMode: (mode) => {
          const state = get();
          set((state) => {
            state.viewMode = mode;

            // Cache per connection
            if (state.currentConnectionId) {
              state.viewModeCache.set(state.currentConnectionId, mode);
            }
          });
        },

        setIntendedDestination: (destination) => {
          set((state) => {
            state.intendedDestination = destination;
          });
        },

        // Tree View Actions
        toggleFolder: async (folderId) => {
          const state = get();
          const newExpanded = new Set(state.expandedFolders);

          if (newExpanded.has(folderId)) {
            // Collapse
            get().collapseFolder(folderId);
          } else {
            // Expand
            get().expandFolder(folderId);

            // Load more if needed
            if (!state.loadedPrefixes.has(folderId)) {
              await get().loadMoreForPrefix(folderId);
            }

            // Auto-expand single-child folders (non-blocking)
            get().autoExpandSingleChildren(folderId);
          }
        },

        expandFolder: (folderId) => {
          set((state) => {
            state.expandedFolders.add(folderId);

            // Cache per connection
            if (state.currentConnectionId) {
              state.expandedFoldersCache.set(state.currentConnectionId, new Set(state.expandedFolders));
            }
          });
        },

        collapseFolder: (folderId) => {
          set((state) => {
            state.expandedFolders.delete(folderId);

            // Cache per connection
            if (state.currentConnectionId) {
              state.expandedFoldersCache.set(state.currentConnectionId, new Set(state.expandedFolders));
            }
          });
        },

        addLoadingFolder: (folderId) => {
          set((state) => {
            state.loadingFolders.add(folderId);
          });
        },

        removeLoadingFolder: (folderId) => {
          set((state) => {
            state.loadingFolders.delete(folderId);
          });
        },

        loadMoreForPrefix: async (prefix) => {
          get().addLoadingFolder(prefix);

          try {
            await get().loadNamespaces(false, prefix, true);
          } finally {
            get().removeLoadingFolder(prefix);
          }
        },

        resetExpandedFolders: () => {
          set((state) => {
            state.expandedFolders = new Set();

            // Clear cache for current connection
            if (state.currentConnectionId) {
              state.expandedFoldersCache.delete(state.currentConnectionId);
            }
          });
        },

        autoExpandSingleChildren: async (folderId) => {
          // Small delay to let UI update
          await new Promise(resolve => setTimeout(resolve, 150));

          const state = get();

          // Find the folder node in the namespace list
          const folderNamespaces = state.namespaces.filter(ns =>
            ns.id.startsWith(folderId) && ns.id !== folderId
          );

          // Check if there's only one direct child that is also a folder
          // This is a simplified check - the actual tree building logic is in the component
          if (folderNamespaces.length === 1) {
            const childFolderId = folderNamespaces[0].id;

            // Expand the child folder
            set((state) => {
              state.expandedFolders.add(childFolderId);

              if (state.currentConnectionId) {
                state.expandedFoldersCache.set(state.currentConnectionId, new Set(state.expandedFolders));
              }
            });

            // Load more for child if needed
            if (!state.loadedPrefixes.has(childFolderId)) {
              await get().loadMoreForPrefix(childFolderId);
            }

            // Continue recursively
            get().autoExpandSingleChildren(childFolderId);
          }
        },

        // Delete Dialog Actions
        setDeleteDialogNamespace: (namespaceId) => {
          set((state) => {
            state.deleteDialogNamespace = namespaceId;
          });
        },

        handleDeleteConfirm: async () => {
          const state = get();
          if (state.deleteDialogNamespace) {
            await get().deleteNamespace(state.deleteDialogNamespace);
          }
        },

        // Recent Namespaces Actions
        addRecentNamespace: (connectionId, namespace) => {
          if (!connectionId) return;

          set((state) => {
            // Remove duplicates and add to front
            const filtered = state.recentNamespaces.filter(ns => ns.id !== namespace.id);
            state.recentNamespaces = [namespace, ...filtered].slice(0, MAX_RECENT_NAMESPACES);
          });

          // Persist to localStorage
          try {
            const recentEntry: RecentNamespaceEntry = {
              namespace,
              connectionId,
              timestamp: new Date().toISOString()
            };

            const stored = localStorage.getItem(RECENT_NAMESPACES_KEY);
            const allRecent: RecentNamespaceEntry[] = stored ? JSON.parse(stored) : [];

            // Remove duplicates for this connection
            const filtered = allRecent.filter(
              entry => !(entry.connectionId === connectionId && entry.namespace.id === namespace.id)
            );

            // Add to front and limit
            const updated = [recentEntry, ...filtered].slice(0, MAX_RECENT_NAMESPACES * 3); // Store more, show less

            localStorage.setItem(RECENT_NAMESPACES_KEY, JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to persist recent namespaces:', error);
          }
        },

        clearRecentNamespaces: () => {
          set((state) => {
            state.recentNamespaces = [];
          });

          try {
            localStorage.removeItem(RECENT_NAMESPACES_KEY);
          } catch (error) {
            console.error('Failed to clear recent namespaces:', error);
          }
        },

        loadRecentNamespaces: (connectionId) => {
          try {
            const stored = localStorage.getItem(RECENT_NAMESPACES_KEY);
            if (stored) {
              const allRecent: RecentNamespaceEntry[] = JSON.parse(stored);

              // Filter by connection if provided
              const filtered = connectionId
                ? allRecent.filter(entry => entry.connectionId === connectionId)
                : allRecent;

              const namespaces = filtered
                .map(entry => entry.namespace)
                .slice(0, MAX_RECENT_NAMESPACES);

              set((state) => {
                state.recentNamespaces = namespaces;
              });
            }
          } catch (error) {
            console.error('Failed to load recent namespaces:', error);
          }
        },

        // Selectors
        getFilteredNamespaces: () => {
          const state = get();
          if (!state.searchTerm) {
            return state.namespaces;
          }

          const term = state.searchTerm.toLowerCase();
          return state.namespaces.filter(ns =>
            ns.id.toLowerCase().includes(term)
          );
        },

        // Metadata Actions
        fetchMetadataForNamespaces: async (namespaceIds) => {
          const state = get();

          // Filter out already cached (and still valid) or loading
          const toFetch = namespaceIds.filter(id => {
            if (state.metadataLoading.has(id)) return false;
            const cached = state.metadataCache.get(id);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return false;
            return true;
          });

          if (toFetch.length === 0) return;

          // Mark as loading
          set((state) => {
            toFetch.forEach(id => state.metadataLoading.add(id));
          });

          // Fetch in parallel with error handling per namespace
          const results = await Promise.allSettled(
            toFetch.map(async (id) => {
              const metadata = await namespaceService.getNamespaceMetadata(id);
              return { id, metadata };
            })
          );

          // Update cache with successful results
          set((state) => {
            results.forEach((result, idx) => {
              const id = toFetch[idx];
              state.metadataLoading.delete(id);

              if (result.status === 'fulfilled') {
                state.metadataCache.set(id, {
                  metadata: result.value.metadata,
                  timestamp: Date.now(),
                });
              }
            });
          });
        },

        getNamespaceMetadata: (namespaceId) => {
          const cached = get().metadataCache.get(namespaceId);
          if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.metadata;
          }
          return undefined;
        },

        isMetadataLoading: (namespaceId) => {
          return get().metadataLoading.has(namespaceId);
        },

        // Utilities
        clearCache: () => {
          set((state) => {
            state.namespacesCache.clear();
          });
        },

        reset: () => {
          set((state) => {
            state.namespaces = [];
            state.totalCount = null;
            state.currentConnectionId = null;
            state.isLoading = false;
            state.isRefreshing = false;
            state.isSearching = false;
            state.isLoadingMore = false;
            state.error = null;
            state.searchTerm = '';
            state.viewMode = 'list';
            state.intendedDestination = null;
            state.expandedFolders = new Set();
            state.loadingFolders = new Set();
            state.loadedPrefixes = new Set();
            state.deletingNamespace = null;
            state.deleteDialogNamespace = null;
            state.isClientInitialized = false;
            state.initializationAttempts = 0;
          });
        },

        resetInitialization: () => {
          set((state) => {
            state.isClientInitialized = false;
            state.initializationAttempts = 0;
          });
        },
      }))
    ),
    { name: 'NamespacesStore' }
  )
);
