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
// Query Builder Helpers — removed
// ============================================================================
//
// The previous createEmptyQuery / createPatternQuery / createBM25Query /
// createVectorQuery / createHybridQuery and validateQuery helpers were never
// imported anywhere in the codebase (verified with grep). They duplicated
// state-construction logic that documentsStore handles directly.
//
// Hybrid search is now implemented end-to-end:
//   - reciprocalRankFusion (utils/rankFusion.ts) — pure function
//   - documentService.multiQuery — SDK wrapper
//   - documentsStore.loadDocuments — branches on queryMode === 'hybrid'
//   - FilterBar — "hybrid" button shows both Vector and BM25 panels
//
// Validation of constructed queries is done at the call site (e.g.,
// "Hybrid search needs a vector query" error in the store).
