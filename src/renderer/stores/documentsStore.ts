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
import { isArrayType, parseValueForFieldType } from "../utils/filterTypeConversion";

export interface SimpleFilter {
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
  previousCursors: (string | number)[];  // Stack of previous cursors for backward navigation
  currentPage: number;
  pageSize: number;
  totalPages: number | null;

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
  updateFilter: (
    filterId: string,
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
          limit?: number,
          page?: number
        ) => Promise<void>;  discoverAttributes: (force?: boolean) => Promise<void>;
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
        previousCursors: [],
        currentPage: 1,
        pageSize: 100,
        totalPages: null,
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
              state.previousCursors = [];
              state.currentPage = 1;
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

            // Load query history from disk if we have connection ID (non-blocking)
            if (state.currentConnectionId && namespaceId) {
              console.log('📚 Loading query history for:', {
                connectionId: state.currentConnectionId,
                namespaceId
              });
              // Don't await - load in background to avoid blocking page navigation
              window.electronAPI.loadQueryHistory(
                state.currentConnectionId,
                namespaceId
              ).then((history) => {
                console.log('📚 Loaded query history:', {
                  saved: history.saved?.length || 0,
                  recent: history.recent?.length || 0
                });
                const historyKey = `${state.currentConnectionId}:${namespaceId}`;
                set((state) => {
                  state.filterHistory.set(historyKey, history.saved || []);
                  state.recentFilterHistory.set(historyKey, history.recent || []);
                });
              }).catch((error) => {
                console.error('Failed to load query history:', error);
              });
            }
          }
        },

        setSearchText: (text) =>
          set((state) => {
            state.searchText = text;
            state.isQueryMode =
              text.length > 0 || state.activeFilters.length > 0;
            // Reset pagination when search text changes
            state.currentPage = 1;
            state.previousCursors = [];
            state.nextCursor = null;

            // Clear previous timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Debounce the search
            searchDebounceTimer = setTimeout(() => {
              get().logFilterChange();
              get().loadDocuments(true, false, 1000, 1); // Force page 1
            }, DEBOUNCE_DELAY);
          }),

        addFilter: (attribute, operator, rawValue) => {
          console.log("🔍 CHECKPOINT 2: Filter Storage");
          console.log("addFilter called with raw value:", {
            attribute,
            operator,
            rawValue,
            rawValueType: typeof rawValue,
            isArray: Array.isArray(rawValue),
          });

          // Get the field type from attributes
          const state = get();
          const attributeInfo = state.attributes.find(a => a.name === attribute);
          const fieldType = attributeInfo?.type;
          
          console.log("🔍 Field type lookup:", {
            attribute,
            fieldType,
            attributeInfo
          });
          
          // Convert the raw value to the correct type
          let typedValue: any = rawValue;
          
          // Handle different input formats
          if (operator === "in" || operator === "not_in") {
            // For in/not_in operators, ensure we have an array
            if (!Array.isArray(rawValue)) {
              // Parse comma-separated string into array
              const values = String(rawValue).split(",").map(v => v.trim()).filter(v => v);
              typedValue = values.map(v => parseValueForFieldType(v, fieldType));
            } else {
              // Convert each element in the array
              typedValue = rawValue.map((v: any) => 
                typeof v === 'string' ? parseValueForFieldType(v, fieldType) : v
              );
            }
          } else if (rawValue === "null" || (typeof rawValue === 'string' && rawValue.toLowerCase() === "null")) {
            typedValue = null;
          } else {
            // Single value - convert to appropriate type
            typedValue = typeof rawValue === 'string' 
              ? parseValueForFieldType(rawValue, fieldType)
              : rawValue;
          }
          
          console.log("🔍 Type conversion result:", {
            fieldType,
            rawValue,
            typedValue,
            typedValueType: typeof typedValue,
            isArray: Array.isArray(typedValue)
          });

          // Create human-readable display value
          let displayValue: string;
          if (typedValue === null) {
            displayValue = "null";
          } else if (Array.isArray(typedValue)) {
            if (typedValue.length > 3) {
              displayValue = `[${typedValue.slice(0, 3).join(', ')}, ...]`;
            } else {
              displayValue = `[${typedValue.join(', ')}]`;
            }
          } else if (typeof typedValue === "object") {
            displayValue = JSON.stringify(typedValue);
          } else {
            displayValue = String(typedValue);
          }
          
          const newFilter: SimpleFilter = {
            id: `${Date.now()}-${Math.random()}`,
            attribute,
            operator,
            value: typedValue,  // Store the correctly typed value
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
            // Reset pagination when filters change
            state.currentPage = 1;
            state.previousCursors = [];
            state.nextCursor = null;
            console.log(
              "After adding filter - activeFilters:",
              state.activeFilters.length
            );
            console.log("Current activeFilters:", state.activeFilters);
            console.log("Query mode set to:", state.isQueryMode);
          });

          // Log the filter change
          setTimeout(() => get().logFilterChange(), 100);
          
          // Automatically load documents when filter is added - force page 1
          setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
        },

        updateFilter: (filterId, attribute, operator, rawValue) => {
          console.log("updateFilter called:", {
            filterId,
            attribute,
            operator,
            rawValue,
            rawValueType: typeof rawValue
          });

          // Get the field type from attributes
          const state = get();
          const attributeInfo = state.attributes.find(a => a.name === attribute);
          const fieldType = attributeInfo?.type;
          
          // Convert the raw value to the correct type (same logic as addFilter)
          let typedValue: any = rawValue;
          
          if (operator === "in" || operator === "not_in") {
            if (!Array.isArray(rawValue)) {
              const values = String(rawValue).split(",").map(v => v.trim()).filter(v => v);
              typedValue = values.map(v => parseValueForFieldType(v, fieldType));
            } else {
              typedValue = rawValue.map((v: any) => 
                typeof v === 'string' ? parseValueForFieldType(v, fieldType) : v
              );
            }
          } else if (rawValue === "null" || (typeof rawValue === 'string' && rawValue.toLowerCase() === "null")) {
            typedValue = null;
          } else {
            typedValue = typeof rawValue === 'string' 
              ? parseValueForFieldType(rawValue, fieldType)
              : rawValue;
          }

          // Create display value
          let displayValue: string;
          if (typedValue === null) {
            displayValue = "null";
          } else if (Array.isArray(typedValue)) {
            if (typedValue.length > 3) {
              displayValue = `[${typedValue.slice(0, 3).join(', ')}, ...]`;
            } else {
              displayValue = `[${typedValue.join(', ')}]`;
            }
          } else if (typeof typedValue === "object") {
            displayValue = JSON.stringify(typedValue);
          } else {
            displayValue = String(typedValue);
          }

          set((state) => {
            const filterIndex = state.activeFilters.findIndex(f => f.id === filterId);
            if (filterIndex !== -1) {
              state.activeFilters[filterIndex] = {
                ...state.activeFilters[filterIndex],
                attribute,
                operator,
                value: typedValue,
                displayValue,
              };
            }
            // Reset pagination when filters change
            state.currentPage = 1;
            state.previousCursors = [];
            state.nextCursor = null;
          });

          // Log the filter change
          setTimeout(() => get().logFilterChange(), 100);
          
          // Automatically load documents when filter is updated - force page 1
          setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
        },

        removeFilter: (filterId) =>
          set((state) => {
            state.activeFilters = state.activeFilters.filter(
              (f) => f.id !== filterId
            );
            state.isQueryMode =
              state.searchText.length > 0 || state.activeFilters.length > 0;
            // Reset pagination when filters change
            state.currentPage = 1;
            state.previousCursors = [];
            state.nextCursor = null;

            // Log the filter change
            setTimeout(() => get().logFilterChange(), 100);
            
            // Automatically load documents when filter is removed - force page 1
            setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
          }),

        clearFilters: () =>
          set((state) => {
            state.searchText = "";
            state.activeFilters = [];
            state.isQueryMode = false;
            state.nextCursor = null; // Reset pagination when clearing filters
            state.previousCursors = [];
            state.currentPage = 1;

            // Clear debounce timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Log the filter change (empty filters)
            setTimeout(() => get().logFilterChange(), 100);
            
            // Trigger immediate load - force page 1
            setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
          }),

        clearAllFilters: () =>
          set((state) => {
            state.searchText = "";
            state.activeFilters = [];
            state.isQueryMode = false;
            state.nextCursor = null; // Reset pagination when clearing filters
            state.previousCursors = [];
            state.currentPage = 1;

            // Clear debounce timer
            if (searchDebounceTimer) {
              clearTimeout(searchDebounceTimer);
            }

            // Automatically load documents when all filters are cleared - force page 1
            setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
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
            const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
            set((state) => {
              const namespaceHistory = state.filterHistory.get(historyKey) || [];
              const updatedHistory = [newEntry, ...namespaceHistory].slice(0, 20);
              state.filterHistory.set(historyKey, updatedHistory);
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

          const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
          const namespaceHistory = state.filterHistory.get(historyKey) || [];
          const historyEntry = namespaceHistory.find(entry => entry.id === historyId);

          if (!historyEntry) return;

          set((state) => {
            // Apply the saved filters and search text
            state.searchText = historyEntry.searchText;
            state.activeFilters = historyEntry.filters.map(f => ({ ...f })); // Deep copy filters
            state.isQueryMode = historyEntry.searchText.length > 0 || historyEntry.filters.length > 0;

            // Update the applied count locally
            const namespaceHistory = state.filterHistory.get(historyKey) || [];
            const updatedHistory = namespaceHistory.map(entry =>
              entry.id === historyId
                ? { ...entry, appliedCount: entry.appliedCount + 1 }
                : entry
            );
            state.filterHistory.set(historyKey, updatedHistory);
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
          
          // Load documents with the applied filters - force page 1
          setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
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
            const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
            set((state) => {
              const namespaceHistory = state.filterHistory.get(historyKey) || [];
              const updatedHistory = namespaceHistory.filter(entry => entry.id !== historyId);
              state.filterHistory.set(historyKey, updatedHistory);
            });
          } catch (error) {
            console.error('Failed to delete filter from history:', error);
          }
        },
        
        getNamespaceFilterHistory: () => {
          const state = get();
          const { currentConnectionId, currentNamespaceId } = state;

          if (!currentConnectionId || !currentNamespaceId) return [];

          const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
          return state.filterHistory.get(historyKey) || [];
        },

        getNamespaceRecentHistory: () => {
          const state = get();
          const { currentConnectionId, currentNamespaceId } = state;

          console.log('📖 getNamespaceRecentHistory called:', {
            currentConnectionId,
            currentNamespaceId,
            hasConnectionId: !!currentConnectionId,
            hasNamespaceId: !!currentNamespaceId,
            mapSize: state.recentFilterHistory.size,
            allKeys: Array.from(state.recentFilterHistory.keys())
          });

          if (!currentConnectionId || !currentNamespaceId) return [];

          const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
          const history = state.recentFilterHistory.get(historyKey) || [];
          console.log('📖 Returning recent history:', {
            historyKey,
            count: history.length
          });

          return history;
        },
        
        applyRecentFilter: (historyId) => {
          const state = get();
          const { currentConnectionId, currentNamespaceId } = state;

          if (!currentConnectionId || !currentNamespaceId) return;

          const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
          const recentHistory = state.recentFilterHistory.get(historyKey) || [];
          const historyEntry = recentHistory.find(entry => entry.id === historyId);

          if (!historyEntry) return;

          set((state) => {
            // Apply the saved filters and search text
            state.searchText = historyEntry.searchText;
            state.activeFilters = historyEntry.filters.map(f => ({ ...f })); // Deep copy filters
            state.isQueryMode = historyEntry.searchText.length > 0 || historyEntry.filters.length > 0;
          });

          // Load documents with the applied filters - force page 1
          setTimeout(() => get().loadDocuments(true, false, 1000, 1), 0);
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
            const historyKey = `${currentConnectionId}:${currentNamespaceId}`;
            set((state) => {
              const recentHistory = state.recentFilterHistory.get(historyKey) || [];

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
                state.recentFilterHistory.set(historyKey, updatedHistory);
                console.log('📝 Updated recent filter history:', {
                  historyKey,
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
          limit = 100,
          page = 1
        ) => {
          const state = get();
          console.log("📊 loadDocuments called:", {
            force,
            loadMore,
            limit,
            page,
            currentPage: state.currentPage,
            previousCursors: state.previousCursors.length,
            nextCursor: state.nextCursor,
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

          const cacheKey = `${state.currentConnectionId}:${state.currentNamespaceId}-${
            state.searchText
          }-${JSON.stringify(state.activeFilters)}-${page}-${limit}`;
          console.log("🔑 Cache key:", cacheKey);

          // Check cache first (only for non-forced loads)
          if (!force) {
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
                state.currentPage = page;
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
            let totalPages: number | null = null;

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
                    const fieldType = fieldInfo?.type;
                    const isArrayField = isArrayType(fieldType);
                    
                    if (isArrayField) {
                      // For arrays, use "Contains" to check if array contains the value
                      // Value is already correctly typed from addFilter
                      const containsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
                      const arrayFilter = [filter.attribute, "ContainsAny", containsValue];
                      console.log("🔍 Adding ARRAY filter (ContainsAny):", arrayFilter);
                      filters.push(arrayFilter as TurbopufferFilter);
                    } else {
                      // For non-arrays, use standard equality
                      // Value is already correctly typed
                      const nonArrayFilter = [filter.attribute, "Eq", filter.value];
                      console.log("🔍 Adding NON-ARRAY filter (Eq):", nonArrayFilter);
                      filters.push(nonArrayFilter as TurbopufferFilter);
                    }
                    break;
                  }
                  case "not_equals": {
                    // Check if this is an array field
                    const fieldInfo = state.attributes.find(attr => attr.name === filter.attribute);
                    const fieldType = fieldInfo?.type;
                    const isArrayField = isArrayType(fieldType);
                    
                    if (isArrayField) {
                      // For arrays, use "Not" with ContainsAny
                      // Value is already correctly typed
                      const notContainsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
                      filters.push(["Not", [filter.attribute, "ContainsAny", notContainsValue]] as TurbopufferFilter);
                    } else {
                      // For non-arrays, use standard not equality
                      filters.push([filter.attribute, "NotEq", filter.value]);
                    }
                    break;
                  }
                  case "contains": {
                    // For array fields, we use ContainsAny to check if array contains value
                    // For string fields, use Glob pattern matching
                    const fieldInfo = state.attributes.find(attr => attr.name === filter.attribute);
                    const fieldType = fieldInfo?.type;
                    const isArrayField = isArrayType(fieldType);
                    
                    if (isArrayField) {
                      // For arrays, use "ContainsAny" operator
                      // Value is already correctly typed from addFilter
                      const containsValue = Array.isArray(filter.value) ? filter.value[0] : filter.value;
                      filters.push([
                        filter.attribute,
                        "ContainsAny",
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
                  case "greater": {
                    // Value is already correctly typed
                    filters.push([filter.attribute, "Gt", filter.value]);
                    break;
                  }
                  case "greater_or_equal": {
                    // Value is already correctly typed
                    filters.push([filter.attribute, "Gte", filter.value]);
                    break;
                  }
                  case "less": {
                    // Value is already correctly typed
                    filters.push([filter.attribute, "Lt", filter.value]);
                    break;
                  }
                  case "less_or_equal": {
                    // Value is already correctly typed
                    filters.push([filter.attribute, "Lte", filter.value]);
                    break;
                  }
                  case "in": {
                    // Value is already correctly typed as an array from addFilter
                    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
                    filters.push([
                      filter.attribute,
                      "In",
                      values,
                    ]);
                    break;
                  }
                  case "not_in": {
                    // Value is already correctly typed as an array from addFilter
                    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
                    filters.push([
                      filter.attribute,
                      "NotIn",
                      values,
                    ]);
                    break;
                  }
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

              // First get the total count for filtered results
              const countResult = await documentService.queryDocuments(
                state.currentNamespaceId,
                {
                  filters: combinedFilter,
                  aggregate_by: { count: ["Count", "id"] },
                }
              );
              totalCount = countResult.aggregations?.count || 0;
              totalPages = Math.ceil(totalCount / limit);

              // Execute query for documents with cursor pagination
              // When filtering, ALWAYS fetch ALL attributes (filters select documents, not columns)
              // This is like MongoDB - query filters determine WHICH docs, but you get ALL fields
              const includeAttributes = true;
              
              // Add cursor filter for pagination
              let finalFilter = combinedFilter;
              let cursor: string | number | null = null;
              
              if (page > state.currentPage && state.documents.length > 0) {
                // Going forward - use the last document ID from current page
                cursor = state.documents[state.documents.length - 1].id;
                const cursorFilter: TurbopufferFilter = ["id", "Gt", cursor];
                finalFilter = combinedFilter 
                  ? ["And", [combinedFilter, cursorFilter]]
                  : cursorFilter;
                console.log("🔍 Forward pagination with cursor in filtered mode:", cursor);
              } else if (page < state.currentPage && state.previousCursors.length > 0) {
                // Going backward - use cursor from stack
                const cursorIndex = page - 2; // page-2 because we want the cursor before the target page
                if (cursorIndex >= 0 && cursorIndex < state.previousCursors.length) {
                  cursor = state.previousCursors[cursorIndex];
                  const cursorFilter: TurbopufferFilter = ["id", "Gt", cursor];
                  finalFilter = combinedFilter 
                    ? ["And", [combinedFilter, cursorFilter]]
                    : cursorFilter;
                  console.log("🔍 Backward pagination with cursor in filtered mode:", cursor);
                } else if (page === 1) {
                  // Going back to first page - use original filter only
                  finalFilter = combinedFilter;
                }
              } else if (page === 1 || state.currentPage === 0) {
                // First page or initial load - use original filter only
                finalFilter = combinedFilter;
                console.log("🔍 First page in filtered mode - no cursor");
              }
              
              console.log("🔍 Sending filtered pagination query:", {
                filters: finalFilter,
                rank_by: ["id", "asc"],
                top_k: limit,
                currentPage: state.currentPage,
                targetPage: page,
                hasDocuments: state.documents.length > 0,
                lastDocId: state.documents.length > 0 ? state.documents[state.documents.length - 1].id : null,
                cursor: cursor,
              });
              
              const result = await documentService.queryDocuments(
                state.currentNamespaceId,
                {
                  filters: finalFilter,
                  top_k: limit,
                  include_attributes: includeAttributes,
                  rank_by: ["id", "asc"],
                }
              );

              documents = result.rows || [];
              queryResult = result;
              
              // Get the last document ID as next cursor
              const newNextCursor = documents.length > 0 ? documents[documents.length - 1].id : null;
              
              // Update page state in query mode
              set((state) => {
                // Update cursor stack for backward navigation
                if (page > state.currentPage) {
                  // Going forward - save the first document ID of current page for going back
                  if (state.documents.length > 0) {
                    const firstIdOfCurrentPage = state.documents[0].id;
                    // Ensure the stack has the right size
                    const newCursors = [...state.previousCursors];
                    newCursors[state.currentPage - 1] = firstIdOfCurrentPage;
                    state.previousCursors = newCursors;
                  }
                } else if (page === 1) {
                  // Reset cursors when going to first page
                  state.previousCursors = [];
                }
                
                state.nextCursor = newNextCursor;
                state.currentPage = page;
                state.totalPages = totalPages;
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
                totalPages = Math.ceil(totalCount / limit);
                console.log("📊 Total count:", totalCount);
              } else {
                totalCount = state.totalCount;
                totalPages = Math.ceil(totalCount / limit);
              }

              // Get documents using ID-based cursor pagination
              console.log("📄 Listing documents with cursor pagination...");

              // For list mode (no filters), fetch ALL attributes to ensure complete document data
              // Users expect to see all fields when clicking a document, regardless of table columns
              const includeAttributes = true;

              // Build filters for cursor-based pagination
              let paginationFilter: TurbopufferFilter | undefined = undefined;
              let cursor: string | number | null = null;
              
              if (page > state.currentPage && state.documents.length > 0) {
                // Going forward - use the last document ID from current page
                cursor = state.documents[state.documents.length - 1].id;
                paginationFilter = ["id", "Gt", cursor];
                console.log("📄 Forward pagination with cursor:", cursor);
              } else if (page < state.currentPage && state.previousCursors.length > 0) {
                // Going backward - use cursor from stack
                const cursorIndex = page - 2; // page-2 because we want the cursor before the target page
                if (cursorIndex >= 0 && cursorIndex < state.previousCursors.length) {
                  cursor = state.previousCursors[cursorIndex];
                  paginationFilter = ["id", "Gt", cursor];
                  console.log("📄 Backward pagination with cursor:", cursor);
                } else if (page === 1) {
                  // Going back to first page - no cursor needed
                  cursor = null;
                  paginationFilter = undefined;
                }
              } else if (page === 1 || state.currentPage === 0) {
                // First page or initial load - no cursor needed
                cursor = null;
                paginationFilter = undefined;
                console.log("📄 First page - no cursor");
              }
              
              console.log("📄 Sending pagination query:", {
                filters: paginationFilter,
                rank_by: ["id", "asc"],
                top_k: limit,
                currentPage: state.currentPage,
                targetPage: page,
                hasDocuments: state.documents.length > 0,
                lastDocId: state.documents.length > 0 ? state.documents[state.documents.length - 1].id : null,
              });
              
              const response = await documentService.queryDocuments(
                state.currentNamespaceId,
                {
                  filters: paginationFilter,
                  rank_by: ["id", "asc"],
                  top_k: limit,
                  include_attributes: includeAttributes,
                }
              );

              documents = response.rows || [];
              queryResult = response;
              
              // Get the last document ID as next cursor
              const newNextCursor = documents.length > 0 ? documents[documents.length - 1].id : null;

              console.log("📄 Listed documents:", {
                documentsCount: documents.length,
                page,
                cursor,
                newNextCursor,
              });

              // Update pagination state
              set((state) => {
                // Update cursor stack for backward navigation
                if (page > state.currentPage) {
                  // Going forward - save the first document ID of current page for going back
                  if (state.documents.length > 0) {
                    const firstIdOfCurrentPage = state.documents[0].id;
                    // Ensure the stack has the right size
                    const newCursors = [...state.previousCursors];
                    newCursors[state.currentPage - 1] = firstIdOfCurrentPage;
                    state.previousCursors = newCursors;
                  }
                } else if (page === 1) {
                  // Reset cursors when going to first page
                  state.previousCursors = [];
                }
                
                state.nextCursor = newNextCursor;
                state.currentPage = page;
                state.totalPages = totalPages;
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

            console.log("📊 Setting documents state:", {
              documentsCount: documents.length,
              totalCount,
              currentPage: page,
              pageSize: state.pageSize,
              totalPages: totalCount !== null ? Math.ceil(totalCount / state.pageSize) : null,
            });
            
            set((state) => {
              state.documents = documents;
              state.totalCount = totalCount;
              state.totalPages = totalCount !== null ? Math.ceil(totalCount / state.pageSize) : null;
              state.lastQueryResult = queryResult;
              state.currentPage = page;

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
          if (!state.currentNamespaceId || !state.currentConnectionId || state.isDiscoveringAttributes)
            return;

          // Check cache first
          const attributesCacheKey = `${state.currentConnectionId}:${state.currentNamespaceId}`;
          if (!force) {
            const cached = state.attributesCache.get(attributesCacheKey);
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
            state.attributesCache.set(attributesCacheKey, {
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

            // Add all attributes from schema (including vectors)
            Object.entries(schema).forEach(([attrName, attrSchema]) => {
              // Only skip internal attributes
              if (attrName !== '$dist' && attrName !== 'attributes') {
                defaultColumns.add(attrName);
              }
            });

            // Ensure vector is included if it exists in schema
            if ('vector' in schema) {
              defaultColumns.add('vector');
            }

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
                  // Determine the specific array type based on elements
                  let determinedType = "array"; // Default fallback
                  
                  if (value.length > 0) {
                    // Find the first non-null element to determine the type
                    const firstElement = value.find(el => el !== null && el !== undefined);
                    if (firstElement !== undefined) {
                      const elementType = typeof firstElement;
                      if (elementType === 'number') {
                        // Check if all numbers are integers
                        const allIntegers = value.every(el => 
                          el === null || el === undefined || Number.isInteger(el)
                        );
                        determinedType = allIntegers ? "[]int32" : "[]float64";
                      } else if (elementType === 'string') {
                        determinedType = "[]string";
                      } else if (elementType === 'boolean') {
                        determinedType = "[]bool";
                      }
                    }
                  }
                  
                  attr.type = determinedType;
                  
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

              // Always include id and vector
              defaultColumns.add('id');

              // Add all attributes except special internal ones
              discoveredAttributes.forEach(attr => {
                if (attr.name !== '$dist' &&
                    attr.name !== 'attributes'
                ) {
                  defaultColumns.add(attr.name);
                }
              });

              // Ensure vector is included if it exists
              if (discoveredAttributes.some(attr => attr.name === 'vector')) {
                defaultColumns.add('vector');
              }

              state.visibleColumns = defaultColumns;
            }

            // Cache the results within the same set call
            if (state.currentNamespaceId && state.currentConnectionId) {
              const attributesCacheKey = `${state.currentConnectionId}:${state.currentNamespaceId}`;
              state.attributesCache.set(attributesCacheKey, {
                attributes: discoveredAttributes,
                timestamp: Date.now(),
              });
              console.log(
                "💾 Cached attributes for connection:namespace:",
                attributesCacheKey
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
            // Reset to first page on refresh
            state.currentPage = 1;
            state.previousCursors = [];
            state.nextCursor = null;
          });

          // Clear all caches
          state.documentsCache.clear();
          state.attributesCache.clear();
          attributeDiscoveryService.clearCache(state.currentNamespaceId);

          try {
            await Promise.all([
              state.loadDocuments(true, false, 1000, 1), // Force page 1
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
