/**
 * Unified Query Model
 *
 * This module defines a comprehensive, type-safe query model that supports
 * all Turbopuffer query capabilities including filters, vector search, BM25,
 * aggregations, and hybrid multi-queries.
 */

// ============================================================================
// Search Configuration Types
// ============================================================================

export type SearchMode = 'pattern' | 'bm25' | 'vector' | 'hybrid';

/**
 * Pattern (Glob/Regex) search configuration
 */
export interface PatternSearchConfig {
  fields: string[];
  query: string;
  operator: 'glob' | 'iglob' | 'regex';
  caseInsensitive?: boolean;
}

/**
 * BM25 field configuration with optional weight
 */
export interface BM25FieldConfig {
  field: string;
  weight?: number;
}

/**
 * BM25 full-text search configuration
 */
export interface BM25SearchConfig {
  fields: BM25FieldConfig[];
  query: string;
  operator: 'sum' | 'max' | 'product';
  lastAsPrefix?: boolean;
  language?: string;
  tokenizer?: 'word_v2' | 'word_v1' | 'word_v0' | 'pre_tokenized_array';
}

/**
 * Vector search configuration
 */
export interface VectorSearchConfig {
  field: string;
  queryVector: number[];
  encoding?: 'float' | 'base64';
  metric?: 'cosine' | 'euclidean' | 'dotproduct'; // Namespace-level, just for documentation
}

/**
 * Unified search configuration supporting all search types
 */
export interface SearchConfig {
  mode: SearchMode;
  pattern?: PatternSearchConfig;
  bm25?: BM25SearchConfig;
  vector?: VectorSearchConfig;
}

// ============================================================================
// Filter Types (extending existing SimpleFilter)
// ============================================================================

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'contains_any'
  | 'not_contains_any'
  | 'greater'
  | 'greater_or_equal'
  | 'less'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'matches'
  | 'not_matches'
  | 'imatches'
  | 'not_imatches'
  | 'any_lt'
  | 'any_lte'
  | 'any_gt'
  | 'any_gte'
  | 'regex'
  | 'contains_all_tokens';

/**
 * Filter node supporting logical operators (And, Or, Not)
 */
export interface FilterNode {
  id: string;
  type: 'simple' | 'and' | 'or' | 'not';

  // Simple filter properties
  attribute?: string;
  operator?: FilterOperator;
  value?: any;
  displayValue?: string;

  // Logical operator properties
  children?: FilterNode[];
}

// ============================================================================
// Ranking Configuration
// ============================================================================

export type RankingOperator = 'sum' | 'max' | 'product' | 'ann' | 'bm25';

/**
 * Advanced ranking configuration
 */
export interface RankingConfig {
  type: 'simple' | 'expression';

  // Simple ranking (order by attribute)
  attribute?: string;
  direction?: 'asc' | 'desc';

  // Expression-based ranking
  expression?: RankingExpression;
}

export interface RankingExpression {
  operator: RankingOperator;
  operands: (RankingExpression | string | number)[];
}

// ============================================================================
// Aggregation Types
// ============================================================================

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface AggregationConfig {
  id: string;
  name: string;
  type: AggregationType;
  groupBy: string[];
  attribute?: string; // For sum, avg, min, max
  topK?: number; // Limit aggregation groups
}

// ============================================================================
// Query Result Configuration
// ============================================================================

export interface ResultConfig {
  topK: number;
  includeAttributes: string[];
  includeVectors: boolean;
  includeDist: boolean; // Include distance scores for vector/BM25 queries
}

// ============================================================================
// Consistency Level
// ============================================================================

export type ConsistencyLevel = 'strong' | 'eventual';

export interface ConsistencyConfig {
  level: ConsistencyLevel;
}

// ============================================================================
// Unified Query Model
// ============================================================================

/**
 * Complete query configuration supporting all Turbopuffer features
 */
export interface UnifiedQuery {
  // Identification
  id: string;
  version: string; // For future schema migrations
  name?: string; // Optional user-provided name
  description?: string;

  // Search
  search: SearchConfig | null;

  // Filtering
  filters: FilterNode[];

  // Ranking/Sorting
  ranking: RankingConfig | null;

  // Results
  results: ResultConfig;

  // Aggregations
  aggregations: AggregationConfig[];

  // Multi-query (for hybrid search)
  multiQueries?: UnifiedQuery[];
  rankFusion?: 'reciprocal_rank' | 'weighted';

  // Performance
  consistency?: ConsistencyConfig;

  // Metadata
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
}

// ============================================================================
// Query Builder Helpers
// ============================================================================

/**
 * Create an empty unified query with sensible defaults
 */
export function createEmptyQuery(): UnifiedQuery {
  return {
    id: `query-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
  };
}

/**
 * Create a simple pattern search query
 */
export function createPatternQuery(
  fields: string[],
  query: string,
  operator: 'glob' | 'iglob' | 'regex' = 'glob'
): UnifiedQuery {
  const baseQuery = createEmptyQuery();
  baseQuery.search = {
    mode: 'pattern',
    pattern: {
      fields,
      query,
      operator,
    },
  };
  return baseQuery;
}

/**
 * Create a BM25 full-text search query
 */
export function createBM25Query(
  fields: string[],
  query: string,
  operator: 'sum' | 'max' | 'product' = 'sum'
): UnifiedQuery {
  const baseQuery = createEmptyQuery();
  baseQuery.search = {
    mode: 'bm25',
    bm25: {
      fields: fields.map(f => ({ field: f })),
      query,
      operator,
    },
  };
  baseQuery.results.includeDist = true; // Show BM25 scores
  return baseQuery;
}

/**
 * Create a vector search query
 */
export function createVectorQuery(
  field: string,
  queryVector: number[],
  topK: number = 10
): UnifiedQuery {
  const baseQuery = createEmptyQuery();
  baseQuery.search = {
    mode: 'vector',
    vector: {
      field,
      queryVector,
      encoding: 'float',
    },
  };
  baseQuery.results.topK = topK;
  baseQuery.results.includeDist = true; // Show similarity scores
  return baseQuery;
}

/**
 * Create a hybrid search query combining vector and BM25
 */
export function createHybridQuery(
  vectorField: string,
  vectorQuery: number[],
  textFields: string[],
  textQuery: string
): UnifiedQuery {
  const baseQuery = createEmptyQuery();
  baseQuery.search = {
    mode: 'hybrid',
  };
  baseQuery.multiQueries = [
    createVectorQuery(vectorField, vectorQuery),
    createBM25Query(textFields, textQuery),
  ];
  baseQuery.rankFusion = 'reciprocal_rank';
  baseQuery.results.includeDist = true;
  return baseQuery;
}

// ============================================================================
// Query Validation
// ============================================================================

export interface QueryValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate a unified query
 */
export function validateQuery(query: UnifiedQuery): QueryValidationError[] {
  const errors: QueryValidationError[] = [];

  // Validate search configuration
  if (query.search) {
    const { mode, pattern, bm25, vector } = query.search;

    if (mode === 'pattern' && !pattern) {
      errors.push({
        field: 'search.pattern',
        message: 'Pattern search requires pattern configuration',
        severity: 'error',
      });
    }

    if (mode === 'bm25' && !bm25) {
      errors.push({
        field: 'search.bm25',
        message: 'BM25 search requires bm25 configuration',
        severity: 'error',
      });
    }

    if (mode === 'vector' && !vector) {
      errors.push({
        field: 'search.vector',
        message: 'Vector search requires vector configuration',
        severity: 'error',
      });
    }

    if (mode === 'hybrid' && (!query.multiQueries || query.multiQueries.length < 2)) {
      errors.push({
        field: 'multiQueries',
        message: 'Hybrid search requires at least 2 sub-queries',
        severity: 'error',
      });
    }
  }

  // Validate vector dimensions (warning only)
  if (query.search?.vector?.queryVector) {
    const dims = query.search.vector.queryVector.length;
    if (dims === 0) {
      errors.push({
        field: 'search.vector.queryVector',
        message: 'Query vector is empty',
        severity: 'error',
      });
    }
  }

  // Validate results configuration
  if (query.results.topK < 1 || query.results.topK > 10000) {
    errors.push({
      field: 'results.topK',
      message: 'top_k must be between 1 and 10000',
      severity: 'error',
    });
  }

  return errors;
}
