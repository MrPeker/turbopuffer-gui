import { describe, it, expect } from 'vitest';
import {
  convertToTurbopufferQuery,
  convertFromTurbopufferQuery,
} from '../unifiedQueryConverter';
import type { UnifiedQuery, FilterNode } from '@/types/unifiedQuery';

const createBaseQuery = (overrides: Partial<UnifiedQuery> = {}): UnifiedQuery => ({
  id: 'test-query',
  version: '1.0',
  search: null,
  filters: [],
  ranking: null,
  results: {
    topK: 100,
    includeAttributes: [],
    includeVectors: false,
    includeDist: false,
  },
  aggregations: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('convertToTurbopufferQuery', () => {
  describe('basic query structure', () => {
    it('includes top_k from results', () => {
      const query = createBaseQuery({ results: { topK: 50, includeAttributes: [], includeVectors: false, includeDist: false } });
      const result = convertToTurbopufferQuery(query);
      expect(result.top_k).toBe(50);
    });

    it('includes include_attributes when specified', () => {
      const query = createBaseQuery({
        results: { topK: 100, includeAttributes: ['name', 'age'], includeVectors: false, includeDist: false },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.include_attributes).toEqual(['name', 'age']);
    });

    it('excludes include_attributes when empty', () => {
      const query = createBaseQuery();
      const result = convertToTurbopufferQuery(query);
      expect(result.include_attributes).toBeUndefined();
    });

    it('includes include_vectors when true', () => {
      const query = createBaseQuery({
        results: { topK: 100, includeAttributes: [], includeVectors: true, includeDist: false },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.include_vectors).toBe(true);
    });
  });

  describe('filter conversion', () => {
    it('excludes filters when empty', () => {
      const query = createBaseQuery();
      const result = convertToTurbopufferQuery(query);
      expect(result.filters).toBeUndefined();
    });

    it('converts single simple filter', () => {
      const filter: FilterNode = {
        id: 'f1',
        type: 'simple',
        attribute: 'name',
        operator: 'equals',
        value: 'John',
      };
      const query = createBaseQuery({ filters: [filter] });
      const result = convertToTurbopufferQuery(query);
      expect(result.filters).toEqual(['name', 'Eq', 'John']);
    });

    it('combines multiple filters with And', () => {
      const filters: FilterNode[] = [
        { id: 'f1', type: 'simple', attribute: 'name', operator: 'equals', value: 'John' },
        { id: 'f2', type: 'simple', attribute: 'age', operator: 'greater', value: 18 },
      ];
      const query = createBaseQuery({ filters });
      const result = convertToTurbopufferQuery(query);
      expect(result.filters).toEqual([
        'And',
        [
          ['name', 'Eq', 'John'],
          ['age', 'Gt', 18],
        ],
      ]);
    });

    it('converts And node with children', () => {
      const filter: FilterNode = {
        id: 'and1',
        type: 'and',
        children: [
          { id: 'f1', type: 'simple', attribute: 'a', operator: 'equals', value: 1 },
          { id: 'f2', type: 'simple', attribute: 'b', operator: 'equals', value: 2 },
        ],
      };
      const query = createBaseQuery({ filters: [filter] });
      const result = convertToTurbopufferQuery(query);
      expect(result.filters).toEqual([
        'And',
        [
          ['a', 'Eq', 1],
          ['b', 'Eq', 2],
        ],
      ]);
    });

    it('converts Or node with children', () => {
      const filter: FilterNode = {
        id: 'or1',
        type: 'or',
        children: [
          { id: 'f1', type: 'simple', attribute: 'status', operator: 'equals', value: 'active' },
          { id: 'f2', type: 'simple', attribute: 'status', operator: 'equals', value: 'pending' },
        ],
      };
      const query = createBaseQuery({ filters: [filter] });
      const result = convertToTurbopufferQuery(query);
      expect(result.filters).toEqual([
        'Or',
        [
          ['status', 'Eq', 'active'],
          ['status', 'Eq', 'pending'],
        ],
      ]);
    });

    it('converts Not node', () => {
      const filter: FilterNode = {
        id: 'not1',
        type: 'not',
        children: [
          { id: 'f1', type: 'simple', attribute: 'deleted', operator: 'equals', value: true },
        ],
      };
      const query = createBaseQuery({ filters: [filter] });
      const result = convertToTurbopufferQuery(query);
      expect(result.filters).toEqual(['Not', ['deleted', 'Eq', true]]);
    });
  });

  describe('operator conversion', () => {
    const testOperator = (operator: string, expectedOp: string, value: any = 'test') => {
      const filter: FilterNode = {
        id: 'f1',
        type: 'simple',
        attribute: 'field',
        operator: operator as any,
        value,
      };
      const query = createBaseQuery({ filters: [filter] });
      return convertToTurbopufferQuery(query).filters;
    };

    it('converts equals to Eq', () => {
      expect(testOperator('equals', 'Eq')).toEqual(['field', 'Eq', 'test']);
    });

    it('converts not_equals to NotEq', () => {
      expect(testOperator('not_equals', 'NotEq')).toEqual(['field', 'NotEq', 'test']);
    });

    it('converts contains to Glob pattern', () => {
      expect(testOperator('contains', 'Glob')).toEqual(['field', 'Glob', '*test*']);
    });

    it('converts not_contains to NotGlob pattern', () => {
      expect(testOperator('not_contains', 'NotGlob')).toEqual(['field', 'NotGlob', '*test*']);
    });

    it('converts contains_any to ContainsAny', () => {
      expect(testOperator('contains_any', 'ContainsAny', ['a', 'b'])).toEqual(['field', 'ContainsAny', ['a', 'b']]);
    });

    it('converts greater to Gt', () => {
      expect(testOperator('greater', 'Gt', 10)).toEqual(['field', 'Gt', 10]);
    });

    it('converts greater_or_equal to Gte', () => {
      expect(testOperator('greater_or_equal', 'Gte', 10)).toEqual(['field', 'Gte', 10]);
    });

    it('converts less to Lt', () => {
      expect(testOperator('less', 'Lt', 10)).toEqual(['field', 'Lt', 10]);
    });

    it('converts less_or_equal to Lte', () => {
      expect(testOperator('less_or_equal', 'Lte', 10)).toEqual(['field', 'Lte', 10]);
    });

    it('converts in to In', () => {
      expect(testOperator('in', 'In', [1, 2, 3])).toEqual(['field', 'In', [1, 2, 3]]);
    });

    it('converts not_in to NotIn', () => {
      expect(testOperator('not_in', 'NotIn', [1, 2])).toEqual(['field', 'NotIn', [1, 2]]);
    });

    it('converts matches to Glob', () => {
      expect(testOperator('matches', 'Glob', '*.txt')).toEqual(['field', 'Glob', '*.txt']);
    });

    it('converts imatches to IGlob', () => {
      expect(testOperator('imatches', 'IGlob', '*test*')).toEqual(['field', 'IGlob', '*test*']);
    });

    it('converts regex to Regex', () => {
      expect(testOperator('regex', 'Regex', '^test$')).toEqual(['field', 'Regex', '^test$']);
    });

    it('converts any_lt to AnyLt', () => {
      expect(testOperator('any_lt', 'AnyLt', 5)).toEqual(['field', 'AnyLt', 5]);
    });

    it('converts any_gt to AnyGt', () => {
      expect(testOperator('any_gt', 'AnyGt', 5)).toEqual(['field', 'AnyGt', 5]);
    });
  });

  describe('BM25 search', () => {
    it('converts single field BM25 search', () => {
      const query = createBaseQuery({
        search: {
          mode: 'bm25',
          bm25: {
            fields: [{ field: 'content' }],
            query: 'search term',
            operator: 'sum',
          },
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by).toEqual(['content', 'BM25', 'search term']);
    });

    it('converts multi-field BM25 with sum operator', () => {
      const query = createBaseQuery({
        search: {
          mode: 'bm25',
          bm25: {
            fields: [
              { field: 'title', weight: 2.0 },
              { field: 'body' },
            ],
            query: 'search',
            operator: 'sum',
          },
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by).toEqual([
        'Sum',
        [2.0, ['title', 'BM25', 'search']],
        ['body', 'BM25', 'search'],
      ]);
    });

    it('converts multi-field BM25 with max operator', () => {
      const query = createBaseQuery({
        search: {
          mode: 'bm25',
          bm25: {
            fields: [{ field: 'a' }, { field: 'b' }],
            query: 'test',
            operator: 'max',
          },
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by[0]).toBe('Max');
    });

    it('converts multi-field BM25 with product operator', () => {
      const query = createBaseQuery({
        search: {
          mode: 'bm25',
          bm25: {
            fields: [{ field: 'a' }, { field: 'b' }],
            query: 'test',
            operator: 'product',
          },
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by[0]).toBe('Product');
    });
  });

  describe('vector search', () => {
    it('converts vector search to ANN', () => {
      const query = createBaseQuery({
        search: {
          mode: 'vector',
          vector: {
            field: 'embedding',
            queryVector: [0.1, 0.2, 0.3],
            encoding: 'float',
          },
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by).toEqual(['embedding', 'ANN', [0.1, 0.2, 0.3]]);
    });
  });

  describe('ranking', () => {
    it('converts simple ranking to sort order', () => {
      const query = createBaseQuery({
        ranking: {
          type: 'simple',
          attribute: 'created_at',
          direction: 'desc',
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by).toEqual(['created_at', 'desc']);
    });

    it('defaults to asc direction for simple ranking', () => {
      const query = createBaseQuery({
        ranking: {
          type: 'simple',
          attribute: 'id',
        },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by).toEqual(['id', 'asc']);
    });

    it('defaults to id asc when no ranking specified', () => {
      const query = createBaseQuery({
        ranking: { type: 'simple' },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.rank_by).toEqual(['id', 'asc']);
    });
  });

  describe('consistency', () => {
    it('includes consistency level when specified', () => {
      const query = createBaseQuery({
        consistency: { level: 'strong' },
      });
      const result = convertToTurbopufferQuery(query);
      expect(result.consistency).toEqual({ level: 'strong' });
    });

    it('excludes consistency when not specified', () => {
      const query = createBaseQuery();
      const result = convertToTurbopufferQuery(query);
      expect(result.consistency).toBeUndefined();
    });
  });
});

describe('convertFromTurbopufferQuery', () => {
  it('creates valid UnifiedQuery structure', () => {
    const turbopuffer = { top_k: 50 };
    const result = convertFromTurbopufferQuery(turbopuffer);
    expect(result.id).toBeDefined();
    expect(result.version).toBe('1.0');
    expect(result.results.topK).toBe(50);
  });

  it('defaults top_k to 100', () => {
    const result = convertFromTurbopufferQuery({});
    expect(result.results.topK).toBe(100);
  });

  it('parses simple sort rank_by', () => {
    const turbopuffer = { rank_by: ['name', 'asc'] };
    const result = convertFromTurbopufferQuery(turbopuffer);
    expect(result.ranking).toEqual({
      type: 'simple',
      attribute: 'name',
      direction: 'asc',
    });
  });

  it('parses BM25 rank_by', () => {
    const turbopuffer = { rank_by: ['content', 'BM25', 'search query'] };
    const result = convertFromTurbopufferQuery(turbopuffer);
    expect(result.search?.mode).toBe('bm25');
    expect(result.search?.bm25?.query).toBe('search query');
    expect(result.search?.bm25?.fields[0].field).toBe('content');
  });

  it('parses ANN rank_by', () => {
    const turbopuffer = { rank_by: ['vector', 'ANN', [0.1, 0.2]] };
    const result = convertFromTurbopufferQuery(turbopuffer);
    expect(result.search?.mode).toBe('vector');
    expect(result.search?.vector?.field).toBe('vector');
    expect(result.search?.vector?.queryVector).toEqual([0.1, 0.2]);
  });

  it('includes createdAt and updatedAt timestamps', () => {
    const result = convertFromTurbopufferQuery({});
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt).toBeLessThanOrEqual(Date.now());
  });
});
