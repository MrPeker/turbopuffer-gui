/**
 * Unified Query Converter
 *
 * Converts between UnifiedQuery model and Turbopuffer API query format
 */

import type {
  UnifiedQuery,
  SearchConfig,
  FilterNode,
  RankingConfig,
  AggregationConfig,
} from '@/types/unifiedQuery';
import type { Filter as TurbopufferFilter } from '@/types/document';

// ============================================================================
// UnifiedQuery -> Turbopuffer API
// ============================================================================

/**
 * Convert UnifiedQuery to Turbopuffer API query parameters
 */
export function convertToTurbopufferQuery(query: UnifiedQuery): any {
  const result: any = {
    top_k: query.results.topK,
  };

  // Include attributes
  if (query.results.includeAttributes.length > 0) {
    result.include_attributes = query.results.includeAttributes;
  }

  // Include vectors
  if (query.results.includeVectors) {
    result.include_vectors = true;
  }

  // Filters
  if (query.filters.length > 0) {
    result.filters = convertFiltersToTurbopuffer(query.filters);
  }

  // Ranking/Search
  if (query.search) {
    const rankBy = convertSearchToRankBy(query.search);
    if (rankBy) {
      result.rank_by = rankBy;
    }
  } else if (query.ranking) {
    result.rank_by = convertRankingToTurbopuffer(query.ranking);
  }

  // Aggregations
  if (query.aggregations.length > 0) {
    result.aggregate_by = query.aggregations.map(convertAggregationToTurbopuffer);
  }

  // Consistency
  if (query.consistency) {
    result.consistency = { level: query.consistency.level };
  }

  // Multi-queries (hybrid search)
  if (query.multiQueries && query.multiQueries.length > 0) {
    result.queries = query.multiQueries.map(convertToTurbopufferQuery);
  }

  return result;
}

/**
 * Convert search configuration to Turbopuffer rank_by format
 */
function convertSearchToRankBy(search: SearchConfig): any {
  switch (search.mode) {
    case 'pattern':
      // Pattern search uses filters, not rank_by
      return null;

    case 'bm25':
      if (!search.bm25) return null;
      const { fields, query, operator, lastAsPrefix, language } = search.bm25;

      // Single field BM25
      if (fields.length === 1) {
        const field = fields[0].field;
        return [field, 'BM25', query];
      }

      // Multi-field BM25 with operator
      const fieldRanks = fields.map(f => {
        const rank: any[] = [f.field, 'BM25', query];
        return f.weight ? [f.weight, rank] : rank;
      });

      if (operator === 'sum') {
        return ['Sum', ...fieldRanks];
      } else if (operator === 'max') {
        return ['Max', ...fieldRanks];
      } else if (operator === 'product') {
        return ['Product', ...fieldRanks];
      }
      return fieldRanks[0];

    case 'vector':
      if (!search.vector) return null;
      return [search.vector.field, 'ANN', search.vector.queryVector];

    default:
      return null;
  }
}

/**
 * Convert ranking configuration to Turbopuffer rank_by format
 */
function convertRankingToTurbopuffer(ranking: RankingConfig): any {
  if (ranking.type === 'simple' && ranking.attribute) {
    return [ranking.attribute, ranking.direction || 'asc'];
  }

  if (ranking.type === 'expression' && ranking.expression) {
    return convertRankingExpression(ranking.expression);
  }

  return ['id', 'asc']; // Default
}

/**
 * Convert ranking expression to Turbopuffer format
 */
function convertRankingExpression(expr: any): any {
  if (typeof expr === 'string' || typeof expr === 'number') {
    return expr;
  }

  const { operator, operands } = expr;
  return [operator, ...operands.map(convertRankingExpression)];
}

/**
 * Convert filter nodes to Turbopuffer filter format
 */
function convertFiltersToTurbopuffer(filters: FilterNode[]): TurbopufferFilter {
  if (filters.length === 0) {
    return undefined as any;
  }

  if (filters.length === 1) {
    return convertFilterNode(filters[0]);
  }

  // Multiple filters - combine with AND
  return ['And', filters.map(convertFilterNode)] as TurbopufferFilter;
}

/**
 * Convert a single filter node to Turbopuffer format
 */
function convertFilterNode(node: FilterNode): TurbopufferFilter {
  if (node.type === 'simple' && node.attribute && node.operator) {
    return convertSimpleFilter(node);
  }

  if (node.type === 'and' && node.children) {
    return ['And', node.children.map(convertFilterNode)] as TurbopufferFilter;
  }

  if (node.type === 'or' && node.children) {
    return ['Or', node.children.map(convertFilterNode)] as TurbopufferFilter;
  }

  if (node.type === 'not' && node.children && node.children.length > 0) {
    return ['Not', convertFilterNode(node.children[0])] as TurbopufferFilter;
  }

  return ['id', 'Eq', 'invalid'] as TurbopufferFilter;
}

/**
 * Convert simple filter to Turbopuffer operator format
 */
function convertSimpleFilter(node: FilterNode): TurbopufferFilter {
  const { attribute, operator, value } = node;

  if (!attribute || !operator) {
    return ['id', 'Eq', 'invalid'] as TurbopufferFilter;
  }

  switch (operator) {
    case 'equals':
      return [attribute, 'Eq', value];
    case 'not_equals':
      return [attribute, 'NotEq', value];
    case 'contains':
      return [attribute, 'Glob', `*${value}*`];
    case 'not_contains':
      return [attribute, 'NotGlob', `*${value}*`];
    case 'contains_any':
      return [attribute, 'ContainsAny', value];
    case 'not_contains_any':
      return [attribute, 'NotContainsAny', value];
    case 'greater':
      return [attribute, 'Gt', value];
    case 'greater_or_equal':
      return [attribute, 'Gte', value];
    case 'less':
      return [attribute, 'Lt', value];
    case 'less_or_equal':
      return [attribute, 'Lte', value];
    case 'in':
      return [attribute, 'In', value];
    case 'not_in':
      return [attribute, 'NotIn', value];
    case 'matches':
      return [attribute, 'Glob', value];
    case 'not_matches':
      return [attribute, 'NotGlob', value];
    case 'imatches':
      return [attribute, 'IGlob', value];
    case 'not_imatches':
      return [attribute, 'NotIGlob', value];
    case 'any_lt':
      return [attribute, 'AnyLt', value];
    case 'any_lte':
      return [attribute, 'AnyLte', value];
    case 'any_gt':
      return [attribute, 'AnyGt', value];
    case 'any_gte':
      return [attribute, 'AnyGte', value];
    case 'regex':
      return [attribute, 'Regex', value];
    case 'contains_all_tokens':
      return [attribute, 'ContainsAllTokens', value];
    default:
      return [attribute, 'Eq', value];
  }
}

/**
 * Convert aggregation configuration to Turbopuffer format
 */
function convertAggregationToTurbopuffer(agg: AggregationConfig): any {
  const result: any = {
    label: agg.name,
  };

  if (agg.type === 'count') {
    result.aggregation = {
      Count: agg.groupBy,
    };
  }

  if (agg.topK) {
    result.top_k = agg.topK;
  }

  return result;
}

// ============================================================================
// Turbopuffer API -> UnifiedQuery (for loading saved queries)
// ============================================================================

/**
 * Convert Turbopuffer query to UnifiedQuery format
 */
export function convertFromTurbopufferQuery(turbopufferQuery: any): UnifiedQuery {
  const query: UnifiedQuery = {
    id: `query-${Date.now()}`,
    version: '1.0',
    search: null,
    filters: [],
    ranking: null,
    results: {
      topK: turbopufferQuery.top_k || 100,
      includeAttributes: turbopufferQuery.include_attributes || [],
      includeVectors: turbopufferQuery.include_vectors || false,
      includeDist: false,
    },
    aggregations: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Parse rank_by
  if (turbopufferQuery.rank_by) {
    const rankBy = turbopufferQuery.rank_by;

    // Check if it's a search operation
    if (Array.isArray(rankBy) && rankBy[1] === 'BM25') {
      query.search = {
        mode: 'bm25',
        bm25: {
          fields: [{ field: rankBy[0] }],
          query: rankBy[2],
          operator: 'sum',
        },
      };
      query.results.includeDist = true;
    } else if (Array.isArray(rankBy) && rankBy[1] === 'ANN') {
      query.search = {
        mode: 'vector',
        vector: {
          field: rankBy[0],
          queryVector: rankBy[2],
          encoding: 'float',
        },
      };
      query.results.includeDist = true;
    } else if (Array.isArray(rankBy) && rankBy.length === 2) {
      // Simple sort
      query.ranking = {
        type: 'simple',
        attribute: rankBy[0],
        direction: rankBy[1],
      };
    }
  }

  // Parse filters
  if (turbopufferQuery.filters) {
    // For now, convert to simple filters (lossy conversion)
    // Full implementation would parse the nested filter structure
    query.filters = [];
  }

  // Parse aggregations
  if (turbopufferQuery.aggregate_by) {
    query.aggregations = turbopufferQuery.aggregate_by.map((agg: any, idx: number) => ({
      id: `agg-${idx}`,
      name: agg.label || `Aggregation ${idx + 1}`,
      type: 'count' as const,
      groupBy: agg.aggregation?.Count || [],
      topK: agg.top_k,
    }));
  }

  return query;
}
