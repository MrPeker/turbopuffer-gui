import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentsStore } from '../documentsStore';

vi.mock('../../services/documentService', () => ({
  documentService: {
    getClient: vi.fn(() => null),
    setClient: vi.fn(),
    queryDocuments: vi.fn(),
  },
}));

vi.mock('../../services/turbopufferService', () => ({
  turbopufferService: {
    getClient: vi.fn(() => null),
    initializeClient: vi.fn(),
  },
}));

vi.mock('../../services/attributeDiscoveryService', () => ({
  attributeDiscoveryService: {
    discoverAttributes: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock('../../services/namespaceService', () => ({
  namespaceService: {
    setClient: vi.fn(),
    getNamespaceSchema: vi.fn().mockResolvedValue({}),
  },
}));

const getInitialState = () => ({
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
  currentConnectionId: null,
  isLoading: false,
  isRefreshing: false,
  isDiscoveringAttributes: false,
  error: null,
  selectedDocuments: new Set<string | number>(),
  visibleColumns: new Set<string>(),
  isClientInitialized: false,
  initializationAttempts: 0,
  maxInitAttempts: 3,
  currentNamespaceId: null,
  searchText: '',
  activeFilters: [],
  isQueryMode: false,
  sortAttribute: null,
  sortDirection: 'asc' as const,
  queryMode: 'browse' as const,
  searchField: null,
  vectorQuery: null,
  vectorField: null,
  bm25Fields: [],
  bm25Operator: 'sum' as const,
  rankingMode: 'simple' as const,
  rankingExpression: null,
  aggregations: [],
  aggregationResults: null,
  groupByAttributes: [],
  aggregationGroups: null,
  isGroupedQuery: false,
  attributesCache: new Map(),
  documentsCache: new Map(),
  filterHistory: new Map(),
  recentFilterHistory: new Map(),
});

describe('documentsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDocumentsStore.setState(getInitialState());
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useDocumentsStore.getState();
      expect(state.documents).toEqual([]);
      expect(state.totalCount).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.searchText).toBe('');
      expect(state.activeFilters).toEqual([]);
      expect(state.queryMode).toBe('browse');
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(100);
    });
  });

  describe('setConnectionId', () => {
    it('updates connection ID', () => {
      useDocumentsStore.getState().setConnectionId('conn-123');
      expect(useDocumentsStore.getState().currentConnectionId).toBe('conn-123');
    });

    it('sets connection ID to null', () => {
      useDocumentsStore.setState({ currentConnectionId: 'conn-123' });
      useDocumentsStore.getState().setConnectionId(null);
      expect(useDocumentsStore.getState().currentConnectionId).toBeNull();
    });
  });

  describe('setSearchText', () => {
    it('updates search text', () => {
      useDocumentsStore.getState().setSearchText('test query');
      expect(useDocumentsStore.getState().searchText).toBe('test query');
    });

    it('sets isQueryMode to true when search text is not empty', () => {
      useDocumentsStore.getState().setSearchText('search');
      expect(useDocumentsStore.getState().isQueryMode).toBe(true);
    });

    it('resets pagination when search text changes', () => {
      useDocumentsStore.setState({
        currentPage: 5,
        previousCursors: ['a', 'b', 'c'],
        nextCursor: 'd',
      });
      useDocumentsStore.getState().setSearchText('new search');
      const state = useDocumentsStore.getState();
      expect(state.currentPage).toBe(1);
      expect(state.previousCursors).toEqual([]);
      expect(state.nextCursor).toBeNull();
    });
  });

  describe('addFilter', () => {
    it('adds a new filter', () => {
      useDocumentsStore.getState().addFilter('name', 'equals', 'John');
      const state = useDocumentsStore.getState();
      expect(state.activeFilters).toHaveLength(1);
      expect(state.activeFilters[0].attribute).toBe('name');
      expect(state.activeFilters[0].operator).toBe('equals');
      expect(state.activeFilters[0].value).toBe('John');
    });

    it('sets isQueryMode to true', () => {
      useDocumentsStore.getState().addFilter('status', 'equals', 'active');
      expect(useDocumentsStore.getState().isQueryMode).toBe(true);
    });

    it('generates unique filter IDs', () => {
      useDocumentsStore.getState().addFilter('a', 'equals', '1');
      useDocumentsStore.getState().addFilter('b', 'equals', '2');
      const state = useDocumentsStore.getState();
      expect(state.activeFilters[0].id).not.toBe(state.activeFilters[1].id);
    });

    it('resets pagination when filter is added', () => {
      useDocumentsStore.setState({
        currentPage: 3,
        previousCursors: ['x', 'y'],
        nextCursor: 'z',
      });
      useDocumentsStore.getState().addFilter('name', 'equals', 'test');
      const state = useDocumentsStore.getState();
      expect(state.currentPage).toBe(1);
      expect(state.previousCursors).toEqual([]);
      expect(state.nextCursor).toBeNull();
    });

    it('converts string to number for integer field types', () => {
      useDocumentsStore.setState({
        attributes: [
          { name: 'count', type: 'int32', uniqueValues: [], totalDocuments: 0, frequency: 0, sampleValues: [], isNullable: false, commonPatterns: [] },
        ],
      });
      useDocumentsStore.getState().addFilter('count', 'equals', '42');
      const state = useDocumentsStore.getState();
      expect(state.activeFilters[0].value).toBe(42);
    });

    it('handles "null" string value', () => {
      useDocumentsStore.getState().addFilter('name', 'equals', 'null');
      expect(useDocumentsStore.getState().activeFilters[0].value).toBeNull();
    });

    it('creates proper display value for arrays', () => {
      useDocumentsStore.getState().addFilter('tags', 'in', ['a', 'b', 'c']);
      expect(useDocumentsStore.getState().activeFilters[0].displayValue).toBe('[a, b, c]');
    });

    it('truncates display value for long arrays', () => {
      useDocumentsStore.getState().addFilter('ids', 'in', ['a', 'b', 'c', 'd', 'e']);
      expect(useDocumentsStore.getState().activeFilters[0].displayValue).toBe('[a, b, c, ...]');
    });
  });

  describe('updateFilter', () => {
    it('updates existing filter', () => {
      useDocumentsStore.getState().addFilter('name', 'equals', 'John');
      const filterId = useDocumentsStore.getState().activeFilters[0].id;

      useDocumentsStore.getState().updateFilter(filterId, 'name', 'equals', 'Jane');
      const state = useDocumentsStore.getState();
      expect(state.activeFilters[0].value).toBe('Jane');
    });

    it('can change operator', () => {
      useDocumentsStore.getState().addFilter('age', 'equals', 25);
      const filterId = useDocumentsStore.getState().activeFilters[0].id;

      useDocumentsStore.getState().updateFilter(filterId, 'age', 'greater', 25);
      expect(useDocumentsStore.getState().activeFilters[0].operator).toBe('greater');
    });

    it('resets pagination when filter is updated', () => {
      useDocumentsStore.setState({ currentPage: 5 });
      useDocumentsStore.getState().addFilter('name', 'equals', 'John');
      const filterId = useDocumentsStore.getState().activeFilters[0].id;

      useDocumentsStore.getState().updateFilter(filterId, 'name', 'equals', 'Jane');
      expect(useDocumentsStore.getState().currentPage).toBe(1);
    });
  });

  describe('removeFilter', () => {
    it('removes filter by ID', () => {
      useDocumentsStore.getState().addFilter('name', 'equals', 'John');
      useDocumentsStore.getState().addFilter('age', 'greater', 18);
      const filterId = useDocumentsStore.getState().activeFilters[0].id;

      useDocumentsStore.getState().removeFilter(filterId);
      const state = useDocumentsStore.getState();
      expect(state.activeFilters).toHaveLength(1);
      expect(state.activeFilters[0].attribute).toBe('age');
    });

    it('sets isQueryMode to false when all filters removed', () => {
      useDocumentsStore.getState().addFilter('name', 'equals', 'John');
      const filterId = useDocumentsStore.getState().activeFilters[0].id;

      useDocumentsStore.getState().removeFilter(filterId);
      expect(useDocumentsStore.getState().isQueryMode).toBe(false);
    });

    it('keeps isQueryMode true when search text exists', () => {
      useDocumentsStore.setState({ searchText: 'search query' });
      useDocumentsStore.getState().addFilter('name', 'equals', 'John');
      const filterId = useDocumentsStore.getState().activeFilters[0].id;

      useDocumentsStore.getState().removeFilter(filterId);
      expect(useDocumentsStore.getState().isQueryMode).toBe(true);
    });
  });

  describe('clearFilters', () => {
    it('clears all filters and search text', () => {
      useDocumentsStore.setState({
        searchText: 'query',
        activeFilters: [
          { id: '1', attribute: 'a', operator: 'equals', value: '1', displayValue: '1' },
        ],
        isQueryMode: true,
      });

      useDocumentsStore.getState().clearFilters();
      const state = useDocumentsStore.getState();
      expect(state.searchText).toBe('');
      expect(state.activeFilters).toEqual([]);
      expect(state.isQueryMode).toBe(false);
    });

    it('resets pagination', () => {
      useDocumentsStore.setState({
        currentPage: 5,
        previousCursors: ['a', 'b'],
        nextCursor: 'c',
      });

      useDocumentsStore.getState().clearFilters();
      const state = useDocumentsStore.getState();
      expect(state.currentPage).toBe(1);
      expect(state.nextCursor).toBeNull();
      expect(state.previousCursors).toEqual([]);
    });
  });

  describe('setQueryMode', () => {
    it('updates query mode', () => {
      useDocumentsStore.getState().setQueryMode('bm25');
      expect(useDocumentsStore.getState().queryMode).toBe('bm25');
    });

    it('resets pagination when mode changes', () => {
      useDocumentsStore.setState({ currentPage: 3 });
      useDocumentsStore.getState().setQueryMode('vector');
      expect(useDocumentsStore.getState().currentPage).toBe(1);
    });
  });

  describe('setSortAttribute', () => {
    it('sets sort attribute and direction', () => {
      useDocumentsStore.getState().setSortAttribute('created_at', 'desc');
      const state = useDocumentsStore.getState();
      expect(state.sortAttribute).toBe('created_at');
      expect(state.sortDirection).toBe('desc');
    });

    it('can set sort attribute to null', () => {
      useDocumentsStore.setState({ sortAttribute: 'name' });
      useDocumentsStore.getState().setSortAttribute(null, 'asc');
      expect(useDocumentsStore.getState().sortAttribute).toBeNull();
    });
  });

  describe('setVectorQuery', () => {
    it('sets vector query and field', () => {
      const vector = [0.1, 0.2, 0.3];
      useDocumentsStore.getState().setVectorQuery(vector, 'embedding');
      const state = useDocumentsStore.getState();
      expect(state.vectorQuery).toEqual(vector);
      expect(state.vectorField).toBe('embedding');
    });

    it('clears vector query with null', () => {
      useDocumentsStore.setState({ vectorQuery: [1, 2, 3], vectorField: 'vec' });
      useDocumentsStore.getState().setVectorQuery(null, '');
      expect(useDocumentsStore.getState().vectorQuery).toBeNull();
    });
  });

  describe('setBM25Config', () => {
    it('sets BM25 fields and operator', () => {
      const fields = [
        { field: 'title', weight: 2.0 },
        { field: 'body', weight: 1.0 },
      ];
      useDocumentsStore.getState().setBM25Config(fields, 'max');
      const state = useDocumentsStore.getState();
      expect(state.bm25Fields).toEqual(fields);
      expect(state.bm25Operator).toBe('max');
    });
  });

  describe('setSelectedDocuments', () => {
    it('updates selected documents set', () => {
      const selected = new Set(['doc1', 'doc2']);
      useDocumentsStore.getState().setSelectedDocuments(selected);
      expect(useDocumentsStore.getState().selectedDocuments).toEqual(selected);
    });
  });

  describe('setVisibleColumns', () => {
    it('updates visible columns', () => {
      const columns = new Set(['id', 'name', 'age']);
      useDocumentsStore.getState().setVisibleColumns(columns);
      expect(useDocumentsStore.getState().visibleColumns).toEqual(columns);
    });
  });

  describe('toggleColumn', () => {
    it('adds column when not present', () => {
      useDocumentsStore.setState({ visibleColumns: new Set(['id']) });
      useDocumentsStore.getState().toggleColumn('name');
      expect(useDocumentsStore.getState().visibleColumns.has('name')).toBe(true);
    });

    it('removes column when present', () => {
      useDocumentsStore.setState({ visibleColumns: new Set(['id', 'name']) });
      useDocumentsStore.getState().toggleColumn('name');
      expect(useDocumentsStore.getState().visibleColumns.has('name')).toBe(false);
    });
  });

  describe('setGroupByAttributes', () => {
    it('sets group by attributes', () => {
      useDocumentsStore.getState().setGroupByAttributes(['category', 'status']);
      const state = useDocumentsStore.getState();
      expect(state.groupByAttributes).toEqual(['category', 'status']);
      expect(state.isGroupedQuery).toBe(true);
    });

    it('sets isGroupedQuery to false when empty', () => {
      useDocumentsStore.setState({ isGroupedQuery: true });
      useDocumentsStore.getState().setGroupByAttributes([]);
      expect(useDocumentsStore.getState().isGroupedQuery).toBe(false);
    });

    it('clears aggregationGroups when attributes cleared', () => {
      useDocumentsStore.setState({ aggregationGroups: [{ key: 'test', count: 1 }] });
      useDocumentsStore.getState().setGroupByAttributes([]);
      expect(useDocumentsStore.getState().aggregationGroups).toBeNull();
    });
  });

  describe('setRawQueryResults', () => {
    it('sets documents from raw query', () => {
      const docs = [{ id: '1', attributes: { name: 'Test' } }];
      useDocumentsStore.getState().setRawQueryResults(docs);
      const state = useDocumentsStore.getState();
      expect(state.documents).toEqual(docs);
      expect(state.totalCount).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it('clears filters and search text', () => {
      useDocumentsStore.setState({
        activeFilters: [{ id: '1', attribute: 'a', operator: 'equals', value: 'b', displayValue: 'b' }],
        searchText: 'query',
      });
      useDocumentsStore.getState().setRawQueryResults([]);
      const state = useDocumentsStore.getState();
      expect(state.activeFilters).toEqual([]);
      expect(state.searchText).toBe('');
    });
  });

  describe('clearDocuments', () => {
    it('clears documents and related state', () => {
      useDocumentsStore.setState({
        documents: [{ id: '1' }],
        totalCount: 10,
        error: 'some error',
        isLoading: true,
      });
      useDocumentsStore.getState().clearDocuments();
      const state = useDocumentsStore.getState();
      expect(state.documents).toEqual([]);
      expect(state.totalCount).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('clears documents and attributes caches', () => {
      useDocumentsStore.setState({
        documentsCache: new Map([['key1', { documents: [], totalCount: 0, timestamp: 0 }]]),
        attributesCache: new Map([['key2', { attributes: [], timestamp: 0 }]]),
      });
      useDocumentsStore.getState().clearCache();
      const state = useDocumentsStore.getState();
      expect(state.documentsCache.size).toBe(0);
      expect(state.attributesCache.size).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useDocumentsStore.setState({
        documents: [{ id: '1' }],
        totalCount: 100,
        searchText: 'query',
        activeFilters: [{ id: '1', attribute: 'a', operator: 'equals', value: 'b', displayValue: 'b' }],
        currentNamespaceId: 'ns-1',
        isClientInitialized: true,
      });
      useDocumentsStore.getState().reset();
      const state = useDocumentsStore.getState();
      expect(state.documents).toEqual([]);
      expect(state.totalCount).toBeNull();
      expect(state.searchText).toBe('');
      expect(state.activeFilters).toEqual([]);
      expect(state.currentNamespaceId).toBeNull();
      expect(state.isClientInitialized).toBe(false);
    });
  });

  describe('resetInitialization', () => {
    it('resets initialization attempts and error', () => {
      useDocumentsStore.setState({
        initializationAttempts: 3,
        error: 'Connection failed',
      });
      useDocumentsStore.getState().resetInitialization();
      const state = useDocumentsStore.getState();
      expect(state.initializationAttempts).toBe(0);
      expect(state.error).toBeNull();
    });
  });

  describe('discoverAttributesFromDocuments', () => {
    it('discovers attributes from documents', () => {
      const docs = [
        { id: '1', attributes: { name: 'John', age: 30, active: true } },
        { id: '2', attributes: { name: 'Jane', age: 25, active: false } },
      ];
      useDocumentsStore.getState().discoverAttributesFromDocuments(docs);
      const state = useDocumentsStore.getState();
      expect(state.attributes.length).toBeGreaterThan(0);
      const nameAttr = state.attributes.find(a => a.name === 'name');
      expect(nameAttr).toBeDefined();
      expect(nameAttr?.type).toBe('string');
    });

    it('handles empty documents array', () => {
      useDocumentsStore.getState().discoverAttributesFromDocuments([]);
      expect(useDocumentsStore.getState().attributes).toEqual([]);
    });

    it('detects array types', () => {
      const docs = [
        { id: '1', attributes: { tags: ['a', 'b', 'c'] } },
      ];
      useDocumentsStore.getState().discoverAttributesFromDocuments(docs);
      const tagsAttr = useDocumentsStore.getState().attributes.find(a => a.name === 'tags');
      expect(tagsAttr?.type).toBe('[]string');
    });

    it('detects number types', () => {
      const docs = [
        { id: '1', attributes: { count: 42 } },
      ];
      useDocumentsStore.getState().discoverAttributesFromDocuments(docs);
      const countAttr = useDocumentsStore.getState().attributes.find(a => a.name === 'count');
      expect(countAttr?.type).toBe('number');
    });

    it('initializes visible columns when empty', () => {
      useDocumentsStore.setState({ visibleColumns: new Set() });
      const docs = [
        { id: '1', attributes: { name: 'Test', value: 123 } },
      ];
      useDocumentsStore.getState().discoverAttributesFromDocuments(docs);
      const state = useDocumentsStore.getState();
      expect(state.visibleColumns.has('id')).toBe(true);
      expect(state.visibleColumns.has('name')).toBe(true);
    });
  });
});
