import { describe, it, expect } from 'vitest';
import { convertFiltersToQuery, convertFiltersToRawQuery } from '../filterConversion';
import type { SimpleFilter } from '@/renderer/stores/documentsStore';
import type { DiscoveredAttribute } from '@/types/attributeDiscovery';

const createFilter = (
  attribute: string,
  operator: SimpleFilter['operator'],
  value: any
): SimpleFilter => ({
  id: `filter-${Date.now()}`,
  attribute,
  operator,
  value,
  displayValue: String(value),
});

const createAttribute = (
  name: string,
  type: string
): DiscoveredAttribute => ({
  name,
  type: type as any,
  uniqueValues: [],
  totalDocuments: 0,
  frequency: 0,
  sampleValues: [],
  isNullable: false,
  commonPatterns: [],
});

describe('convertFiltersToQuery', () => {
  describe('empty filters', () => {
    it('returns undefined filters when no filters or search text', () => {
      const result = convertFiltersToQuery([], '', []);
      expect(result.filters).toBeUndefined();
    });

    it('includes default rank_by and top_k', () => {
      const result = convertFiltersToQuery([], '', []);
      expect(result.rank_by).toEqual(['id', 'asc']);
      expect(result.top_k).toBe(1000);
      expect(result.include_attributes).toBe(true);
    });
  });

  describe('search text', () => {
    it('adds Glob filter for search text', () => {
      const result = convertFiltersToQuery([], 'test', []);
      expect(result.filters).toEqual(['id', 'Glob', '*test*']);
    });

    it('trims search text whitespace', () => {
      const result = convertFiltersToQuery([], '  test  ', []);
      expect(result.filters).toEqual(['id', 'Glob', '*test*']);
    });

    it('ignores empty search text after trimming', () => {
      const result = convertFiltersToQuery([], '   ', []);
      expect(result.filters).toBeUndefined();
    });
  });

  describe('single filter conversion', () => {
    it('converts equals operator to Eq', () => {
      const filter = createFilter('name', 'equals', 'John');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['name', 'Eq', 'John']);
    });

    it('converts not_equals operator to NotEq', () => {
      const filter = createFilter('status', 'not_equals', 'active');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['status', 'NotEq', 'active']);
    });

    it('converts greater operator to Gt', () => {
      const filter = createFilter('age', 'greater', 18);
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['age', 'Gt', 18]);
    });

    it('converts greater_or_equal operator to Gte', () => {
      const filter = createFilter('age', 'greater_or_equal', 21);
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['age', 'Gte', 21]);
    });

    it('converts less operator to Lt', () => {
      const filter = createFilter('price', 'less', 100);
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['price', 'Lt', 100]);
    });

    it('converts less_or_equal operator to Lte', () => {
      const filter = createFilter('quantity', 'less_or_equal', 50);
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['quantity', 'Lte', 50]);
    });

    it('converts in operator to In with array', () => {
      const filter = createFilter('category', 'in', ['A', 'B', 'C']);
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['category', 'In', ['A', 'B', 'C']]);
    });

    it('converts in operator with single value to array', () => {
      const filter = createFilter('category', 'in', 'A');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['category', 'In', ['A']]);
    });

    it('converts not_in operator to NotIn', () => {
      const filter = createFilter('status', 'not_in', ['deleted', 'archived']);
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['status', 'NotIn', ['deleted', 'archived']]);
    });

    it('converts matches operator to Glob', () => {
      const filter = createFilter('email', 'matches', '*@gmail.com');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['email', 'Glob', '*@gmail.com']);
    });

    it('converts not_matches operator to NotGlob', () => {
      const filter = createFilter('email', 'not_matches', '*@spam.com');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['email', 'NotGlob', '*@spam.com']);
    });

    it('converts imatches operator to IGlob', () => {
      const filter = createFilter('name', 'imatches', '*john*');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['name', 'IGlob', '*john*']);
    });

    it('converts not_imatches operator to NotIGlob', () => {
      const filter = createFilter('name', 'not_imatches', '*test*');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['name', 'NotIGlob', '*test*']);
    });

    it('converts regex operator to Regex', () => {
      const filter = createFilter('code', 'regex', '^[A-Z]{3}$');
      const result = convertFiltersToQuery([filter], '', []);
      expect(result.filters).toEqual(['code', 'Regex', '^[A-Z]{3}$']);
    });
  });

  describe('contains operator', () => {
    it('uses Glob pattern for string fields', () => {
      const filter = createFilter('description', 'contains', 'keyword');
      const attributes = [createAttribute('description', 'string')];
      const result = convertFiltersToQuery([filter], '', attributes);
      expect(result.filters).toEqual(['description', 'Glob', '*keyword*']);
    });

    it('uses ContainsAny for array fields', () => {
      const filter = createFilter('tags', 'contains', 'important');
      const attributes = [createAttribute('tags', '[]string')];
      const result = convertFiltersToQuery([filter], '', attributes);
      expect(result.filters).toEqual(['tags', 'ContainsAny', 'important']);
    });
  });

  describe('array field handling', () => {
    it('uses ContainsAny for equals on array field', () => {
      const filter = createFilter('categories', 'equals', 'tech');
      const attributes = [createAttribute('categories', '[]string')];
      const result = convertFiltersToQuery([filter], '', attributes);
      expect(result.filters).toEqual(['categories', 'ContainsAny', 'tech']);
    });

    it('extracts first element from array value for equals on array field', () => {
      const filter = createFilter('categories', 'equals', ['tech', 'news']);
      const attributes = [createAttribute('categories', '[]string')];
      const result = convertFiltersToQuery([filter], '', attributes);
      expect(result.filters).toEqual(['categories', 'ContainsAny', 'tech']);
    });

    it('uses Not ContainsAny for not_equals on array field', () => {
      const filter = createFilter('tags', 'not_equals', 'spam');
      const attributes = [createAttribute('tags', 'array')];
      const result = convertFiltersToQuery([filter], '', attributes);
      expect(result.filters).toEqual(['Not', ['tags', 'ContainsAny', 'spam']]);
    });
  });

  describe('multiple filters', () => {
    it('combines two filters with And', () => {
      const filters = [
        createFilter('name', 'equals', 'John'),
        createFilter('age', 'greater', 18),
      ];
      const result = convertFiltersToQuery(filters, '', []);
      expect(result.filters).toEqual([
        'And',
        [
          ['name', 'Eq', 'John'],
          ['age', 'Gt', 18],
        ],
      ]);
    });

    it('combines filters with search text', () => {
      const filters = [createFilter('status', 'equals', 'active')];
      const result = convertFiltersToQuery(filters, 'test', []);
      expect(result.filters).toEqual([
        'And',
        [
          ['id', 'Glob', '*test*'],
          ['status', 'Eq', 'active'],
        ],
      ]);
    });

    it('combines three filters with And', () => {
      const filters = [
        createFilter('a', 'equals', 1),
        createFilter('b', 'equals', 2),
        createFilter('c', 'equals', 3),
      ];
      const result = convertFiltersToQuery(filters, '', []);
      expect(result.filters).toEqual([
        'And',
        [
          ['a', 'Eq', 1],
          ['b', 'Eq', 2],
          ['c', 'Eq', 3],
        ],
      ]);
    });
  });
});

describe('convertFiltersToRawQuery', () => {
  it('returns formatted JSON string', () => {
    const filter = createFilter('name', 'equals', 'John');
    const result = convertFiltersToRawQuery([filter], '', []);
    const parsed = JSON.parse(result);
    expect(parsed.filters).toEqual(['name', 'Eq', 'John']);
  });

  it('includes all query parameters', () => {
    const result = convertFiltersToRawQuery([], '', []);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('rank_by');
    expect(parsed).toHaveProperty('top_k');
    expect(parsed).toHaveProperty('include_attributes');
  });
});
