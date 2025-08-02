import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type {
  Document,
  Filter as TurbopufferFilter,
  DocumentsQueryResponse,
} from "../../types/document";
import type { DiscoveredAttribute } from "../../types/attributeDiscovery";
import type { TurbopufferRegion } from "../../types/connection";
import { documentService } from "../services/documentService";
import { turbopufferService } from "../services/turbopufferService";
import { attributeDiscoveryService } from "../services/attributeDiscoveryService";
import { namespaceService } from "../services/namespaceService";
import { generateFilterDescription } from "../utils/filterDescriptions";

interface SimpleFilter {
  id: string;
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "greater" | "greater_or_equal" | "less" | "less_or_equal" | "in" | "not_in" | "matches" | "not_matches" | "imatches" | "not_imatches";
  value: any;
  displayValue: string;
}

interface FilterHistoryEntry {
  id: string;
  name: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  appliedCount: number;
  description?: string;
}

interface RecentFilterEntry {
  id: string;
  searchText: string;
  filters: SimpleFilter[];
  timestamp: number;
  description?: string;
}

interface DocumentsState {
  // Data
  documents: Document[];
  totalCount: number | null;
  unfilteredTotalCount: number | null; // Store the total count without filters
  attributes: DiscoveredAttribute[];
  lastQueryResult: DocumentsQueryResponse | null;
  nextCursor: string | number | null;

  // Connection State
  currentConnectionId: string | null;
  
  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  isDiscoveringAttributes: boolean;
  error: string | null;
  selectedDocuments: Set<string | number>;
  visibleColumns: Set<string>;
  
  // Client State
  isClientInitialized: boolean;
  initializationAttempts: number;
  maxInitAttempts: number;

  // Query State
  currentNamespaceId: string | null;
  searchText: string;
  activeFilters: SimpleFilter[];
  isQueryMode: boolean;

  // Cache
  attributesCache: Map<
    string,
    { attributes: DiscoveredAttribute[]; timestamp: number }
  >;
  documentsCache: Map<
    string,
    { documents: Document[]; totalCount: number | null; timestamp: number }
  >;
  
  // Filter History (per namespace)
  filterHistory: Map<string, FilterHistoryEntry[]>; // Saved filters
  recentFilterHistory: Map<string, RecentFilterEntry[]>; // Auto-logged recent filters

  // Actions
  setConnectionId: (connectionId: string | null) => void;
  setNamespace: (namespaceId: string | null) => void;
  setSearchText: (text: string) => void;
  addFilter: (
    attribute: string,
    operator: SimpleFilter["operator"],
    value: any
  ) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  clearAllFilters: () => void;
  setSelectedDocuments: (selected: Set<string | number>) => void;
  setVisibleColumns: (columns: Set<string>) => void;
  toggleColumn: (column: string) => void;
  
  // Filter History Actions
  saveToFilterHistory: (name: string) => void;
  applyFilterFromHistory: (historyId: string) => void;
  deleteFilterFromHistory: (historyId: string) => void;
  getNamespaceFilterHistory: () => FilterHistoryEntry[];
  getNamespaceRecentHistory: () => RecentFilterEntry[];
  applyRecentFilter: (historyId: string) => void;
  logFilterChange: () => void;

  // Async Actions
  initializeClient: (connectionId: string, region: TurbopufferRegion) => Promise<boolean>;
  loadDocuments: (
    force?: boolean,
    loadMore?: boolean,
    limit?: number
  ) => Promise<void>;
  discoverAttributes: (force?: boolean) => Promise<void>;
  discoverAttributesFromDocuments: (documents: Document[]) => void;
  loadSchemaAndInitColumns: () => Promise<void>;
  deleteDocuments: (ids: (string | number)[]) => Promise<void>;
  updateDocument: (
    id: string | number,
    attributes: Record<string, any>
  ) => Promise<void>;
  uploadDocuments: (documents: Document[]) => Promise<void>;
  refresh: () => Promise<void>;
  exportDocuments: (
    format: "json" | "csv",
    documentIds?: string[]
  ) => Promise<void>;

  // Raw Query Actions
  setRawQueryResults: (documents: Document[], queryResponse?: any) => void;
  clearDocuments: () => void;

  // Utilities
  clearCache: () => void;
  reset: () => void;
  resetInitialization: () => void;
}

// Enable MapSet support for Immer
enableMapSet();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 500; // 500ms

let searchDebounceTimer: NodeJS.Timeout | null = null;

export const useDocumentsStore = create<DocumentsState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        documents: [],
        totalCount: null,
        unfilteredTotalCount: null,
        attributes: [],
        lastQueryResult: null,
        nextCursor: null,
        isLoading: false,
        isRefreshing: false,
        isDiscoveringAttributes: false,
        error: null,
        selectedDocuments: new Set(),
        visibleColumns: new Set(),
        isClientInitialized: false,
        initializationAttempts: 0,
        maxInitAttempts: 3,
        currentConnectionId: null,
        currentNamespaceId: null,
        searchText: "",
        activeFilters: [],
        isQueryMode: false,
        attributesCache: new Map(),
        documentsCache: new Map(),
        filterHistory: new Map(),
        recentFilterHistory: new Map(),

        // Actions
        setConnectionId: (connectionId) => {
          console.log('🔌 Setting connection ID:', connectionId);
          set((state) => {
            state.currentConnectionId = connectionId;
          });
        },
        setNamespace: async (namespaceId) => {
          const state = get();
          console.log('📁 Setting namespace:', {
            newNamespaceId: namespaceId,
            currentNamespaceId: state.currentNamespaceId,
            currentConnectionId: state.currentConnectionId
          });
          if (state.currentNamespaceId !== namespaceId) {
            set((state) => {
              state.currentNamespaceId = namespaceId;
              state.documents = [];
              state.totalCount = null;
              state.unfilteredTotalCount = null;
              state.attributes = [];
              state.lastQueryResult = null;
              state.nextCursor = null;
              state.selectedDocuments = new Set();
              state.visibleColumns = new Set();
              state.searchText = "";
              state.activeFilters = [];
              state.isQueryMode = false;
              state.error = null;
              // Reset client initialization state when changing namespace
              state.isClientInitialized = false;
              state.initializationAttempts = 0;
            });

            // Load query history from disk if we have connection ID
            if (state.currentConnectionId && namespaceId) {
              console.log('📚 Loading query history for:', {
                connectionId: state.currentConnectionId,
                namespaceId
              });
              try {
                const history = await window.electronAPI.loadQueryHistory(
                  state.currentConnectionId,
                  namespaceId
                );
                console.log('📚 Loaded query history:', {
                  saved: history.saved?.length || 0,
                  recent: history.recent?.length || 0
                });
                set((state) => {
                  state.filterHistory.set(namespaceId, history.saved || []);
                  state.recentFilterHistory.set(namespaceId, history.recent || []);
                });
              } catch (error) {
                console.error('Failed to load query history:', error);
              }
            }
          }
        },

        setSearchText: (text) =>
          set((state) => {
            state.searchText = text;
            state.isQueryMode =
              text.length > 0 || state.activeFilters.length > 0;

            // Clear previous timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Debounce the search
            searchDebounceTimer = setTimeout(() => {
              get().logFilterChange();
              get().loadDocuments(true, false, 1000);
            }, DEBOUNCE_DELAY);
          }),

        addFilter: (attribute, operator, value) => {
          console.log("🔍 CHECKPOINT 2: Filter Storage");
          console.log("addFilter called with:", {
            attribute,
            operator,
            value,
            valueType: typeof value,
            isArray: Array.isArray(value),
          });

          // Create human-readable display value
          let displayValue: string;
          if (value === null) {
            displayValue = "null";
          } else if (Array.isArray(value)) {
            if (value.length > 3) {
              displayValue = `[${value.slice(0, 3).join(', ')}, ...]`;
            } else {
              displayValue = `[${value.join(', ')}]`;
            }
          } else if (typeof value === "object") {
            displayValue = JSON.stringify(value);
          } else {
            displayValue = String(value);
          }
          const newFilter: SimpleFilter = {
            id: `${Date.now()}-${Math.random()}`,
            attribute,
            operator,
            value,
            displayValue,
          };

          console.log("Filter object created:", newFilter);

          set((state) => {
            console.log(
              "Before adding filter - activeFilters:",
              state.activeFilters.length
            );
            state.activeFilters = [...state.activeFilters, newFilter];
            state.isQueryMode = true;
            console.log(
              "After adding filter - activeFilters:",
              state.activeFilters.length
            );
            console.log("Current activeFilters:", state.activeFilters);
            console.log("Query mode set to:", state.isQueryMode);
          });

          // Log the filter change
          setTimeout(() => get().logFilterChange(), 100);
          
          // Automatically load documents when filter is added
          setTimeout(() => get().loadDocuments(true, false, 1000), 0);
        },

        removeFilter: (filterId) =>
          set((state) => {
            state.activeFilters = state.activeFilters.filter(
              (f) => f.id !== filterId
            );
            state.isQueryMode =
              state.searchText.length > 0 || state.activeFilters.length > 0;

            // Log the filter change
            setTimeout(() => get().logFilterChange(), 100);
            
            // Automatically load documents when filter is removed
            setTimeout(() => get().loadDocuments(true, false, 1000), 0);
          }),

        clearFilters: () =>
          set((state) => {
            state.searchText = "";
            state.activeFilters = [];
            state.isQueryMode = false;
            state.nextCursor = null; // Reset pagination when clearing filters

            // Clear debounce timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Log the filter change (empty filters)
            setTimeout(() => get().logFilterChange(), 100);
            
            // Trigger immediate load
            setTimeout(() => get().loadDocuments(true, false, 1000), 0);
          }),

        clearAllFilters: () =>
          set((state) => {
            state.searchText = "";
            state.activeFilters = [];
            state.isQueryMode = false;
            state.nextCursor = null; // Reset pagination when clearing filters

            // Clear debounce timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Automatically load documents when all filters are cleared
            setTimeout(() => get().loadDocuments(true, false, 1000), 0);
          }),

        setSelectedDocuments: (selected) =>
          set((state) => {
            state.selectedDocuments = selected;
          }),

        setVisibleColumns: (columns) =>
          set((state) => {
            state.visibleColumns = columns;
          }),

        toggleColumn: (column) =>
          set((state) => {
            const newColumns = new Set(state.visibleColumns);
            if (newColumns.has(column)) {
              newColumns.delete(column);
            } else {
              newColumns.add(column);
            }
            state.visibleColumns = newColumns;
          }),
          
        // Filter History Actions
        saveToFilterHistory: async (name) => {
          const state = get();
          const { currentConnectionId, currentNamespaceId, searchText, activeFilters } = state;
          
          console.log('💾 saveToFilterHistory called:', {
            name,
            currentConnectionId,
            currentNamespaceId,
            searchText,
            activeFilters: activeFilters.length
          });
          
          if (!currentConnectionId || !currentNamespaceId) {
            console.log('💾 Cannot save - missing connection or namespace');
            return;
          }
          
          const newEntry: FilterHistoryEntry = {
            id: `${Date.now()}-${Math.random()}`,
            name,
            searchText,
            filters: activeFilters.map(f => ({ ...f })), // Deep copy filters
            timestamp: Date.now(),
            appliedCount: 0,
            description: generateFilterDescription(activeFilters, searchText)
          };
          
          console.log('💾 Creating saved filter entry:', newEntry);
          
          try {
            // Save to disk
            await window.electronAPI.addSavedFilter(
              currentConnectionId,
              currentNamespaceId,
              newEntry
            );
            console.log('💾 Saved filter to disk successfully');
            
            // Update local state
            set((state) => {
              const namespaceHistory = state.filterHistory.get(currentNamespaceId) || [];
              const updatedHistory = [newEntry, ...namespaceHistory].slice(0, 20);
              state.filterHistory.set(currentNamespaceId, updatedHistory);
              console.log('💾 Updated local filter history, now has', updatedHistory.length, 'entries');
            });
          } catch (error) {
            console.error('Failed to save filter to history:', error);
          }
        },
        
        applyFilterFromHistory: async (historyId) => {
          const state = get();
          const { currentConnectionId, currentNamespaceId } = state;
          
          if (!currentConnectionId || !currentNamespaceId) return;
          
          const namespaceHistory = state.filterHistory.get(currentNamespaceId) || [];
          const historyEntry = namespaceHistory.find(entry => entry.id === historyId);
          
          if (!historyEntry) return;
          
          set((state) => {
            // Apply the saved filters and search text
            state.searchText = historyEntry.searchText;
            state.activeFilters = historyEntry.filters.map(f => ({ ...f })); // Deep copy filters
            state.isQueryMode = historyEntry.searchText.length > 0 || historyEntry.filters.length > 0;
            
            // Update the applied count locally
            const namespaceHistory = state.filterHistory.get(currentNamespaceId) || [];
            const updatedHistory = namespaceHistory.map(entry => 
              entry.id === historyId 
                ? { ...entry, appliedCount: entry.appliedCount + 1 }
                : entry
            );
            state.filterHistory.set(currentNamespaceId, updatedHistory);
          });
          
          // Update count on disk
          try {
            await window.electronAPI.updateFilterCount(
              currentConnectionId,
              currentNamespaceId,
              historyId
            );
          } catch (error) {
            console.error('Failed to update filter count:', error);
          }
          
          // Load documents with the applied filters
          setTimeout(() => get().loadDocuments(true, false, 1000), 0);
        },
        
        deleteFilterFromHistory: async (historyId) => {
          const state = get();
          const { currentConnectionId, currentNamespaceId } = state;
          
          if (!currentConnectionId || !currentNamespaceId) return;
          
          try {
            // Delete from disk
            await window.electronAPI.deleteSavedFilter(
              currentConnectionId,
              currentNamespaceId,
              historyId
            );
            
            // Update local state
            set((state) => {
              const namespaceHistory = state.filterHistory.get(currentNamespaceId) || [];
              const updatedHistory = namespaceHistory.filter(entry => entry.id !== historyId);
              state.filterHistory.set(currentNamespaceId, updatedHistory);
            });
          } catch (error) {
            console.error('Failed to delete filter from history:', error);
          }
        },
        
        getNamespaceFilterHistory: () => {
          const state = get();
          const { currentNamespaceId } = state;
          
          if (!currentNamespaceId) return [];
          
          return state.filterHistory.get(currentNamespaceId) || [];
        },
        
        getNamespaceRecentHistory: () => {
          const state = get();
          const { currentNamespaceId } = state;
          
          console.log('📖 getNamespaceRecentHistory called:', {
            currentNamespaceId,
            hasNamespaceId: !!currentNamespaceId,
            mapSize: state.recentFilterHistory.size,
            allKeys: Array.from(state.recentFilterHistory.keys())
          });
          
          if (!currentNamespaceId) return [];
          
          const history = state.recentFilterHistory.get(currentNamespaceId) || [];
          console.log('📖 Returning recent history:', {
            namespaceId: currentNamespaceId,
            count: history.length
          });
          
          return history;
        },
        
        applyRecentFilter: (historyId) => {
          const state = get();
          const { currentNamespaceId } = state;
          
          if (!currentNamespaceId) return;
          
          const recentHistory = state.recentFilterHistory.get(currentNamespaceId) || [];
          const historyEntry = recentHistory.find(entry => entry.id === historyId);
          
          if (!historyEntry) return;
          
          set((state) => {
            // Apply the saved filters and search text
            state.searchText = historyEntry.searchText;
            state.activeFilters = historyEntry.filters.map(f => ({ ...f })); // Deep copy filters
            state.isQueryMode = historyEntry.searchText.length > 0 || historyEntry.filters.length > 0;
          });
          
          // Load documents with the applied filters
          setTimeout(() => get().loadDocuments(true, false, 1000), 0);
        },
        
        logFilterChange: async () => {
          const state = get();
          const { currentConnectionId, currentNamespaceId, searchText, activeFilters } = state;
          
          console.log('📝 logFilterChange called:', {
            currentConnectionId,
            currentNamespaceId,
            searchText,
            activeFilters: activeFilters.length
          });
          
          if (!currentConnectionId || !currentNamespaceId) {
            console.log('📝 Skipping logFilterChange - missing connection or namespace');
            return;
          }
          
          // Don't log if no filters or search
          if (searchText.length === 0 && activeFilters.length === 0) {
            console.log('📝 Skipping logFilterChange - no filters or search');
            return;
          }
          
          const newEntry: RecentFilterEntry = {
            id: `${Date.now()}-${Math.random()}`,
            searchText,
            filters: activeFilters.map(f => ({ ...f })), // Deep copy filters
            timestamp: Date.now(),
            description: generateFilterDescription(activeFilters, searchText)
          };
          
          console.log('📝 Creating filter history entry:', newEntry);
          
          try {
            // Save to disk
            await window.electronAPI.addRecentFilter(
              currentConnectionId,
              currentNamespaceId,
              newEntry
            );
            console.log('📝 Saved filter to disk successfully');
            
            // Update local state
            set((state) => {
              const recentHistory = state.recentFilterHistory.get(currentNamespaceId) || [];
              
              // Check if this exact filter combination already exists in recent history
              const isDuplicate = recentHistory.some(entry => 
                entry.searchText === newEntry.searchText &&
                entry.filters.length === newEntry.filters.length &&
                entry.filters.every((f, i) => 
                  f.attribute === newEntry.filters[i]?.attribute &&
                  f.operator === newEntry.filters[i]?.operator &&
                  JSON.stringify(f.value) === JSON.stringify(newEntry.filters[i]?.value)
                )
              );
              
              if (!isDuplicate) {
                // Keep only the last 30 entries per namespace
                const updatedHistory = [newEntry, ...recentHistory].slice(0, 30);
                state.recentFilterHistory.set(currentNamespaceId, updatedHistory);
                console.log('📝 Updated recent filter history:', {
                  namespaceId: currentNamespaceId,
                  newEntryCount: updatedHistory.length,
                  firstEntry: updatedHistory[0]
                });
              } else {
                console.log('📝 Skipping duplicate filter entry');
              }
            });
          } catch (error) {
            console.error('Failed to log filter change:', error);
          }
        },

        // Async Actions
        initializeClient: async (connectionId, region) => {
          const state = get();
          
          // Check if already initialized
          if (state.isClientInitialized && documentService.getClient()) {
            return true;
          }
          
          // Check retry limit
          if (state.initializationAttempts >= state.maxInitAttempts) {
            set((state) => {
              state.error = `Failed to initialize after ${state.maxInitAttempts} attempts. Please check your connection.`;
            });
            return false;
          }
          
          // Increment attempt counter
          set((state) => {
            state.initializationAttempts++;
          });
          
          try {
            const connectionWithKey =
              await window.electronAPI.getConnectionForUse(connectionId);
            await turbopufferService.initializeClient(
              connectionWithKey.apiKey,
              region
            );
            documentService.setClient(turbopufferService.getClient()!);
            
            // Mark as initialized on success
            set((state) => {
              state.isClientInitialized = true;
              state.initializationAttempts = 0; // Reset attempts on success
              state.error = null;
            });
            
            return true;
          } catch (error) {
            console.error("Failed to initialize client:", error);
            set((state) => {
              state.error = state.initializationAttempts >= state.maxInitAttempts
                ? `Failed to connect after ${state.maxInitAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
                : "Failed to connect to database. Retrying...";
              state.isClientInitialized = false;
            });
            return false;
          }
        },

        loadDocuments: async (
          force = false,
          loadMore = false,
          limit = 1000
        ) => {
          const state = get();
          console.log("📊 loadDocuments called:", {
            force,
            loadMore,
            limit,
            currentNamespaceId: state.currentNamespaceId,
            isLoading: state.isLoading,
            searchText: state.searchText,
            activeFilters: state.activeFilters,
            activeFiltersLength: state.activeFilters.length,
            isQueryMode: state.isQueryMode,
          });

          if (!state.currentNamespaceId || state.isLoading) return;

          // Check if client is initialized
          if (!state.isClientInitialized || !documentService.getClient()) {
            console.warn("Turbopuffer client not initialized, skipping load");
            set((state) => {
              if (!state.error) {
                state.error = "Client not initialized. Please wait...";
              }
            });
            return;
          }

          const cacheKey = `${state.currentNamespaceId}-${
            state.searchText
          }-${JSON.stringify(state.activeFilters)}`;
          console.log("🔑 Cache key:", cacheKey);

          // Check cache first (only for non-forced and non-loadMore loads)
          if (!force && !loadMore) {
            const cached = state.documentsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              console.log(
                "📂 Using cached documents:",
                cached.documents.length
              );
              set((state) => {
                state.documents = cached.documents;
                state.totalCount = cached.totalCount;
                state.lastQueryResult = null;
              });
              // Auto-discover attributes from cached documents
              get().discoverAttributesFromDocuments(cached.documents);
              return;
            }
          }

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            let documents: Document[] = [];
            let totalCount: number | null = null;
            let queryResult: any = null;

            // Force query mode if there are any filters or search text
            const shouldUseQueryMode =
              state.activeFilters.length > 0 ||
              state.searchText.trim().length > 0;
            console.log("🔍 Query mode check:", {
              isQueryMode: state.isQueryMode,
              shouldUseQueryMode,
              hasFilters: state.activeFilters.length > 0,
              hasSearchText: state.searchText.trim().length > 0,
            });

            if (shouldUseQueryMode) {
              console.log("🔍 CHECKPOINT 4: Filter Processing & Conversion");
              console.log("Query mode activated - processing filters...");

              // Build query filters
              const filters: TurbopufferFilter[] = [];

              // Add text search filter across multiple fields
              if (state.searchText.trim()) {
                // For now, search in ID field with glob pattern
                // TODO: Implement full-text search across all fields
                filters.push(["id", "Glob", `*${state.searchText.trim()}*`]);
              }

              // Add attribute filters
              console.log(
                "🔍 Building filters from activeFilters:",
                state.activeFilters
              );
              state.activeFilters.forEach((filter) => {
                console.log("🔍 Processing filter:", filter);
                
                // Debug: Check field info for this attribute
                const fieldInfo = state.attributes.find(attr => attr.name === filter.attribute);
                console.log("🔍 Field info for", filter.attribute, ":", fieldInfo);
                
                switch (filter.operator) {
                  case "equals": {
                    // Check if this is an array field
                    const fieldInfo = state.attributes.find(attr => attr.name === filter.attribute);
                    const isArrayField = fieldInfo?.type && typeof fieldInfo.type === 'string' && (fieldInfo.type.startsWith('[]') || fieldInfo.type === 'array');
                    
                    if (isArrayField) {
                      // For arrays, use "Contains" to check if array contains the value
                      // If value is an array, use the first element (for single-value contains)
                      const containsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
                      const arrayFilter = [filter.attribute, "Contains", containsValue];
                      console.log("🔍 Adding ARRAY filter (Contains):", arrayFilter);
                      filters.push(arrayFilter);
                    } else {
                      // For non-arrays, use standard equality
                      const nonArrayFilter = [filter.attribute, "Eq", filter.value];
                      console.log("🔍 Adding NON-ARRAY filter (Eq):", nonArrayFilter);
                      filters.push(nonArrayFilter);
                    }
                    break;
                  }
                  case "not_equals": {
                    // Check if this is an array field
                    const fieldInfo = state.attributes.find(attr => attr.name === filter.attribute);
                    const isArrayField = fieldInfo?.type && typeof fieldInfo.type === 'string' && (fieldInfo.type.startsWith('[]') || fieldInfo.type === 'array');
                    
                    if (isArrayField) {
                      // For arrays, use "NotContains" to check if array does not contain the value
                      // If value is an array, use the first element
                      const notContainsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
                      filters.push([
                        filter.attribute,
                        "NotContains",
                        notContainsValue
                      ]);
                    } else {
                      // For non-arrays, use standard not equality
                      filters.push([filter.attribute, "NotEq", filter.value]);
                    }
                    break;
                  }
                  case "contains": {
                    // For array fields, we use the "In" operator to check if arrays intersect
                    // For string fields, use Glob pattern matching
                    const fieldInfo = state.attributes.find(attr => attr.name === filter.attribute);
                    const isArrayField = fieldInfo?.type && typeof fieldInfo.type === 'string' && (fieldInfo.type.startsWith('[]') || fieldInfo.type === 'array');
                    
                    if (isArrayField) {
                      // For arrays, use "Contains" operator for containment checking
                      // If value is an array, use the first element
                      const containsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
                      filters.push([
                        filter.attribute,
                        "Contains",
                        containsValue
                      ]);
                    } else {
                      // For strings, use glob pattern
                      filters.push([
                        filter.attribute,
                        "Glob",
                        `*${filter.value}*`,
                      ]);
                    }
                    break;
                  }
                  case "greater":
                    filters.push([filter.attribute, "Gt", filter.value]);
                    break;
                  case "greater_or_equal":
                    filters.push([filter.attribute, "Gte", filter.value]);
                    break;
                  case "less":
                    filters.push([filter.attribute, "Lt", filter.value]);
                    break;
                  case "less_or_equal":
                    filters.push([filter.attribute, "Lte", filter.value]);
                    break;
                  case "in":
                    filters.push([
                      filter.attribute,
                      "In",
                      Array.isArray(filter.value)
                        ? filter.value
                        : [filter.value],
                    ]);
                    break;
                  case "not_in":
                    filters.push([
                      filter.attribute,
                      "NotIn",
                      Array.isArray(filter.value)
                        ? filter.value
                        : [filter.value],
                    ]);
                    break;
                  case "matches":
                    filters.push([filter.attribute, "Glob", filter.value]);
                    break;
                  case "not_matches":
                    filters.push([filter.attribute, "NotGlob", filter.value]);
                    break;
                  case "imatches":
                    filters.push([filter.attribute, "IGlob", filter.value]);
                    break;
                  case "not_imatches":
                    filters.push([filter.attribute, "NotIGlob", filter.value]);
                    break;
                }
              });

              // Combine filters with AND
              const combinedFilter: TurbopufferFilter | undefined =
                filters.length === 0
                  ? undefined
                  : filters.length === 1
                  ? filters[0]
                  : ["And", filters];

              console.log("🔍 Executing query with filters:", combinedFilter);

              // Execute query
              const includeAttributes = state.visibleColumns.size > 0 
                ? Array.from(state.visibleColumns).filter(col => col !== 'id' && col !== 'vector' && col !== '$dist')
                : true;
              
              const result = await documentService.queryDocuments(
                state.currentNamespaceId,
                {
                  filters: combinedFilter,
                  top_k: 1000,
                  include_attributes: includeAttributes,
                  rank_by: ["id", "asc"],
                }
              );

              documents = result.rows || [];
              queryResult = result;
              // Preserve unfiltered count, set filtered count to doc length
              totalCount = documents.length;
              
              // Clear nextCursor in query mode since we're not paginating
              set((state) => {
                state.nextCursor = null;
              });
              
              console.log("📄 Query results:", {
                documentsCount: documents.length,
                result,
              });
            } else {
              // Browse mode - get total count first, then documents
              if (force || state.totalCount === null || state.unfilteredTotalCount === null) {
                console.log("📊 Getting total count...");
                const countResult = await documentService.queryDocuments(
                  state.currentNamespaceId,
                  {
                    aggregate_by: { count: ["Count", "id"] },
                  }
                );
                totalCount = countResult.aggregations?.count || 0;
                console.log("📊 Total count:", totalCount);
              } else {
                totalCount = state.totalCount;
              }

              // Get documents with simple listing
              console.log("📄 Listing documents...");

              const includeAttributes = state.visibleColumns.size > 0 
                ? Array.from(state.visibleColumns).filter(col => col !== 'id' && col !== 'vector' && col !== '$dist')
                : true;

              const { documents: listDocs, nextCursor } =
                await documentService.listDocuments(state.currentNamespaceId, {
                  limit,
                  cursor: loadMore ? state.nextCursor : undefined,
                  includeAttributes: includeAttributes,
                });

              if (loadMore) {
                // Append to existing documents
                documents = [...state.documents, ...listDocs];
              } else {
                documents = listDocs;
              }

              queryResult = null;
              console.log("📄 Listed documents:", {
                documentsCount: documents.length,
                newDocsCount: listDocs.length,
                nextCursor,
              });

              // Store next cursor for pagination
              set((state) => {
                state.nextCursor = nextCursor || null;
              });
            }

            console.log("📄 Final documents data:", {
              count: documents.length,
              sampleDocuments: documents.slice(0, 2).map((d) => ({
                id: d.id,
                hasAttributes: !!d.attributes,
                attributeKeys: d.attributes ? Object.keys(d.attributes) : [],
                attributes: d.attributes,
              })),
            });

            set((state) => {
              state.documents = documents;
              state.totalCount = totalCount;
              state.lastQueryResult = queryResult;

              // Set unfilteredTotalCount only in browse mode
              if (!shouldUseQueryMode && totalCount !== null) {
                state.unfilteredTotalCount = totalCount;
              }

              // Cache the results INSIDE the set function to avoid mutation error
              state.documentsCache.set(cacheKey, {
                documents,
                totalCount,
                timestamp: Date.now(),
              });
            });

            // Auto-discover attributes from loaded documents
            console.log("🔍 Starting attribute discovery from documents...");
            get().discoverAttributesFromDocuments(documents);
          } catch (error) {
            console.error("💥 Failed to load documents:", error);
            set((state) => {
              state.error =
                error instanceof Error
                  ? error.message
                  : "Failed to load documents";
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        discoverAttributes: async (force = false) => {
          const state = get();
          if (!state.currentNamespaceId || state.isDiscoveringAttributes)
            return;

          // Check cache first
          if (!force) {
            const cached = state.attributesCache.get(state.currentNamespaceId);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              set((state) => {
                state.attributes = cached.attributes;
              });
              return;
            }
          }

          set((state) => {
            state.isDiscoveringAttributes = true;
          });

          try {
            const result = await attributeDiscoveryService.discoverAttributes(
              state.currentNamespaceId,
              {
                sampleSize: 200,
                detectPatterns: false,
              }
            );

            set((state) => {
              state.attributes = result.attributes;
            });

            // Cache the results
            state.attributesCache.set(state.currentNamespaceId, {
              attributes: result.attributes,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.warn("Failed to discover attributes:", error);
            // Don't set error for attribute discovery failure
          } finally {
            set((state) => {
              state.isDiscoveringAttributes = false;
            });
          }
        },

        loadSchemaAndInitColumns: async () => {
          const state = get();
          if (!state.currentNamespaceId || !state.isClientInitialized) return;

          try {
            // Set the namespace service client
            namespaceService.setClient(turbopufferService.getClient()!);
            
            // Get schema from API
            const schema = await namespaceService.getNamespaceSchema(state.currentNamespaceId);
            
            // Initialize visible columns from schema
            const defaultColumns = new Set<string>();
            
            // Always include id
            defaultColumns.add('id');
            
            // Add all non-vector attributes from schema
            Object.entries(schema).forEach(([attrName, attrSchema]) => {
              // Skip vector columns and potentially large text fields
              if (!attrName.includes('vector') && 
                  !attrName.includes('embedding') &&
                  attrName !== 'long_text' && // Example of field to exclude
                  typeof attrSchema.type === 'string' && 
                  !attrSchema.type.startsWith('[') // Skip vector types like "[512]f32"
              ) {
                defaultColumns.add(attrName);
              }
            });

            set((state) => {
              // Only set if visibleColumns is empty (first time)
              if (state.visibleColumns.size === 0) {
                state.visibleColumns = defaultColumns;
              }
            });
          } catch (error) {
            console.warn('Failed to load schema for column initialization:', error);
            // Fall back to discovering from documents
          }
        },

        discoverAttributesFromDocuments: (documents) => {
          console.log("🔍 discoverAttributesFromDocuments called with:", {
            documentsCount: documents?.length,
            hasDocuments: !!documents,
            sampleDocument: documents?.[0],
          });

          if (!documents || documents.length === 0) {
            console.log("❌ No documents to analyze for attributes");
            return;
          }

          const attributeMap = new Map<
            string,
            { type: string; values: Set<any>; count: number; arrayElements?: Set<any> }
          >();

          // Analyze all documents to discover attributes
          documents.forEach((doc, index) => {
            // Handle both cases: attributes property and root-level attributes
            const attributesToAnalyze = doc.attributes || {};

            // If no explicit attributes property, extract non-standard Document properties
            if (!doc.attributes || Object.keys(doc.attributes).length === 0) {
              // Get all properties except standard Document fields
              const standardFields = ["id", "vector", "$dist", "attributes"];
              Object.entries(doc).forEach(([key, value]) => {
                if (!standardFields.includes(key)) {
                  attributesToAnalyze[key] = value;
                }
              });
            }

            if (Object.keys(attributesToAnalyze).length > 0) {
              Object.entries(attributesToAnalyze).forEach(([key, value]) => {
                if (!attributeMap.has(key)) {
                  attributeMap.set(key, {
                    type: typeof value,
                    values: new Set(),
                    count: 0,
                  });
                }

                const attr = attributeMap.get(key)!;
                attr.values.add(value);
                attr.count++;

                // Refine type detection
                if (typeof value === "string") {
                  // Check if it's a date string
                  if (
                    /^\d{4}-\d{2}-\d{2}/.test(value) ||
                    !isNaN(Date.parse(value))
                  ) {
                    attr.type = "date";
                  } else {
                    attr.type = "string";
                  }
                } else if (typeof value === "number") {
                  attr.type = "number";
                } else if (typeof value === "boolean") {
                  attr.type = "boolean";
                } else if (Array.isArray(value)) {
                  attr.type = "array";
                  // Initialize arrayElements set if not exists
                  if (!attr.arrayElements) {
                    attr.arrayElements = new Set();
                  }
                  // Collect individual elements from the array
                  value.forEach(element => {
                    if (element !== null && element !== undefined && element !== '') {
                      attr.arrayElements!.add(element);
                    }
                  });
                } else if (typeof value === "object" && value !== null) {
                  attr.type = "object";
                } else {
                  attr.type = "string";
                }
              });
            }
          });

          console.log(
            "🗺️ Discovered attribute map:",
            Array.from(attributeMap.entries()).map(([name, info]) => ({
              name,
              type: info.type,
              count: info.count,
              uniqueValues: info.values.size,
              sampleValues: Array.from(info.values).slice(0, 3),
            }))
          );

          // Convert to DiscoveredAttribute format
          const discoveredAttributes: DiscoveredAttribute[] = Array.from(
            attributeMap.entries()
          ).map(([name, info]) => {
            const uniqueValues = Array.from(info.values);
            let sampleValues: any[] = [];
            
            // For array fields, use individual elements as sample values
            if (info.type === "array" && info.arrayElements) {
              const elements = Array.from(info.arrayElements);
              // Limit to 1000 elements max for performance
              const limitedElements = elements.slice(0, 1000);
              // Sort numeric arrays
              if (limitedElements.length > 0 && typeof limitedElements[0] === 'number') {
                limitedElements.sort((a, b) => a - b);
              } else {
                limitedElements.sort();
              }
              sampleValues = limitedElements;
              console.log(`🔍 Array Attribute "${name}":`, {
                type: info.type,
                count: info.count,
                uniqueArraysCount: uniqueValues.length,
                uniqueElementsCount: elements.length,
                sampleElements: sampleValues.slice(0, 10),
              });
            } else {
              sampleValues = uniqueValues.slice(0, 20);
              console.log(`🔍 Attribute "${name}":`, {
                type: info.type,
                count: info.count,
                uniqueValuesCount: uniqueValues.length,
                sampleValues: sampleValues.slice(0, 5),
              });
            }

            return {
              name,
              type: info.type as any,
              uniqueValues: uniqueValues.slice(0, 100),
              totalDocuments: documents.length,
              frequency: info.count,
              sampleValues,
              isNullable: false,
              arrayElementType: undefined,
              commonPatterns: [],
              range:
                info.type === "number"
                  ? {
                      min: Math.min(
                        ...uniqueValues.filter((v) => typeof v === "number")
                      ),
                      max: Math.max(
                        ...uniqueValues.filter((v) => typeof v === "number")
                      ),
                    }
                  : undefined,
            };
          });

          console.log("✅ Final discovered attributes:", discoveredAttributes);

          set((state) => {
            console.log(
              "💾 Setting attributes in store:",
              discoveredAttributes.length
            );
            state.attributes = discoveredAttributes;

            // Initialize visible columns if not set
            if (state.visibleColumns.size === 0 && discoveredAttributes.length > 0) {
              const defaultColumns = new Set<string>();
              
              // Always include id
              defaultColumns.add('id');
              
              // Add non-vector, non-special attributes
              discoveredAttributes.forEach(attr => {
                if (!attr.name.includes('vector') && 
                    !attr.name.includes('embedding') &&
                    attr.name !== '$dist' &&
                    attr.name !== 'attributes' &&
                    attr.name !== 'long_text' // Example of field to exclude
                ) {
                  defaultColumns.add(attr.name);
                }
              });
              
              state.visibleColumns = defaultColumns;
            }

            // Cache the results within the same set call
            if (state.currentNamespaceId) {
              state.attributesCache.set(state.currentNamespaceId, {
                attributes: discoveredAttributes,
                timestamp: Date.now(),
              });
              console.log(
                "💾 Cached attributes for namespace:",
                state.currentNamespaceId
              );
            }
          });
        },

        deleteDocuments: async (ids) => {
          const state = get();
          if (!state.currentNamespaceId) return;

          try {
            await documentService.deleteDocuments(
              state.currentNamespaceId,
              ids
            );

            // Remove from local state
            set((state) => {
              state.documents = state.documents.filter(
                (doc) => !ids.includes(doc.id)
              );
              state.selectedDocuments = new Set();
              if (state.totalCount !== null) {
                state.totalCount = Math.max(0, state.totalCount - ids.length);
              }
            });

            // Clear cache to force refresh
            state.documentsCache.clear();
          } catch (error) {
            console.error("Failed to delete documents:", error);
            set((state) => {
              state.error =
                error instanceof Error
                  ? error.message
                  : "Failed to delete documents";
            });
            throw error;
          }
        },

        updateDocument: async (id, attributes) => {
          const state = get();
          if (!state.currentNamespaceId) return;

          try {
            await documentService.updateDocument(
              state.currentNamespaceId,
              id,
              attributes
            );

            // Update local state
            set((state) => {
              const docIndex = state.documents.findIndex(
                (doc) => doc.id === id
              );
              if (docIndex !== -1) {
                state.documents[docIndex] = {
                  ...state.documents[docIndex],
                  attributes: {
                    ...state.documents[docIndex].attributes,
                    ...attributes,
                  },
                };
              }
            });

            // Clear cache to ensure consistency
            state.documentsCache.clear();
          } catch (error) {
            console.error("Failed to update document:", error);
            set((state) => {
              state.error =
                error instanceof Error
                  ? error.message
                  : "Failed to update document";
            });
            throw error;
          }
        },

        uploadDocuments: async (documents) => {
          const state = get();
          if (!state.currentNamespaceId) return;

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const result = await documentService.upsertDocuments(
              state.currentNamespaceId,
              documents
            );

            // Clear cache to force reload
            state.documentsCache.clear();
            state.attributesCache.clear();

            // Optionally, reload documents immediately
            await state.loadDocuments(true, false, 1000);

            set((state) => {
              state.isLoading = false;
            });
          } catch (error) {
            console.error("Failed to upload documents:", error);
            set((state) => {
              state.isLoading = false;
              state.error =
                error instanceof Error
                  ? error.message
                  : "Failed to upload documents";
            });
            throw error;
          }
        },

        refresh: async () => {
          const state = get();
          set((state) => {
            state.isRefreshing = true;
          });

          // Clear all caches
          state.documentsCache.clear();
          state.attributesCache.clear();
          attributeDiscoveryService.clearCache(state.currentNamespaceId);

          try {
            await Promise.all([
              state.loadDocuments(true, false, 1000),
              state.discoverAttributes(true),
            ]);
          } finally {
            set((state) => {
              state.isRefreshing = false;
            });
          }
        },

        exportDocuments: async (
          format: "json" | "csv",
          documentIds?: string[]
        ) => {
          const state = get();
          const documentsToExport = documentIds
            ? state.documents.filter((doc) =>
                documentIds.includes(String(doc.id))
              )
            : state.documents;

          if (documentsToExport.length === 0) {
            throw new Error("No documents to export");
          }

          if (format === "json") {
            const jsonData = JSON.stringify(documentsToExport, null, 2);
            const blob = new Blob([jsonData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_${
              state.currentNamespaceId
            }_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else if (format === "csv") {
            // Import Papa dynamically for CSV export
            const Papa = await import("papaparse");

            // Flatten documents for CSV export
            const flattenedDocs = documentsToExport.map((doc) => {
              const { vector, attributes, ...rest } = doc;
              return {
                ...rest,
                ...attributes,
                vector_dimensions: vector ? vector.length : null,
              };
            });

            const csv = Papa.unparse(flattenedDocs);
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_${state.currentNamespaceId}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        },

        // Raw Query Actions
        setRawQueryResults: (documents: Document[], queryResponse?: any) =>
          set((state) => {
            state.documents = documents;
            state.totalCount = documents.length;
            state.isLoading = false;
            state.error = null;
            state.lastQueryResult = queryResponse || null;
            state.nextCursor = null; // Raw queries don't use pagination cursors
            // Clear active filters since this is a raw query
            state.activeFilters = [];
            state.searchText = "";
          }),

        clearDocuments: () =>
          set((state) => {
            state.documents = [];
            state.totalCount = null;
            state.error = null;
            state.isLoading = false;
          }),

        clearCache: () =>
          set((state) => {
            state.documentsCache.clear();
            state.attributesCache.clear();
          }),

        reset: () =>
          set((state) => {
            state.documents = [];
            state.totalCount = null;
            state.unfilteredTotalCount = null;
            state.attributes = [];
            state.lastQueryResult = null;
            state.nextCursor = null;
            state.isLoading = false;
            state.isRefreshing = false;
            state.isDiscoveringAttributes = false;
            state.error = null;
            state.selectedDocuments = new Set();
            state.visibleColumns = new Set();
            state.currentNamespaceId = null;
            state.searchText = "";
            state.activeFilters = [];
            state.isQueryMode = false;
            state.isClientInitialized = false;
            state.initializationAttempts = 0;
            state.documentsCache.clear();
            state.attributesCache.clear();
          }),

        resetInitialization: () =>
          set((state) => {
            state.initializationAttempts = 0;
            state.error = null;
          }),
      }))
    ),
    { name: "documents-store" }
  )
);

// Cleanup function to clear debounce timer
export const cleanupDocumentsStore = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
};
