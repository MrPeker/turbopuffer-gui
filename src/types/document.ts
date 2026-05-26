export interface Document {
  id: string | number;
  vector?: number[];
  $dist?: number;
  attributes?: Record<string, any>;
}

export interface DocumentsQueryParams {
  rank_by?: RankBy;
  top_k?: number;
  // Cursor-based diversification cap. `total` is the global ceiling,
  // `per` returns at most N rows per group_by group. Use either top_k OR limit
  // (top_k is the legacy alias for limit.total).
  limit?: {
    total?: number;
    per?: {
      attributes: string[];
      limit: number;
    };
  };
  filters?: Filter;
  include_attributes?: string[] | boolean;
  // Inverse of include_attributes: return everything except these. Useful for
  // omitting large vector columns from list views.
  exclude_attributes?: string[];
  aggregate_by?: Record<string, AggregateFunction>;
  group_by?: string[]; // NEW: Optional group-by attributes for grouped aggregations
  vector_encoding?: 'float' | 'base64';
  consistency?: {
    level: 'strong' | 'eventual';
  };
}

export type RankBy = 
  | ['vector', 'ANN', number[]]
  | [string, 'BM25', string]
  | [string, 'asc' | 'desc']
  | ['Sum', RankBy[]]
  | ['Max', RankBy[]]
  | ['Product', [number, RankBy]];

export type Filter =
  | ['And', Filter[]]
  | ['Or', Filter[]]
  | ['Not', Filter]
  | [string, FilterOp, any]
  // 4-tuple form carries operator-specific options:
  //   Fuzzy: { max_edit_distance: [{ min_query_chars, distance }] }
  //   ContainsAllTokens / ContainsAnyToken: { last_as_prefix: boolean }
  | [string, FilterOp, any, Record<string, any>];

export type FilterOp =
  // Equality
  | 'Eq' | 'NotEq'
  // List membership
  | 'In' | 'NotIn'
  // Scalar comparisons
  | 'Lt' | 'Lte' | 'Gt' | 'Gte'
  // Array element comparisons
  | 'AnyLt' | 'AnyLte' | 'AnyGt' | 'AnyGte'
  // Array containment
  | 'Contains' | 'NotContains'
  | 'ContainsAny' | 'NotContainsAny'
  // Pattern matching
  | 'Glob' | 'NotGlob' | 'IGlob' | 'NotIGlob'
  | 'Regex'
  // Fuzzy (requires `fuzzy` schema flag)
  | 'Fuzzy'
  // Full-text search (requires `full_text_search` schema flag)
  | 'ContainsAllTokens' | 'ContainsTokenSequence' | 'ContainsAnyToken';

export type AggregateFunction =
  | ['Count']
  | ['Sum', string];

// NEW: Type for grouped aggregation results
export interface AggregationGroup {
  [key: string]: any; // Group keys (e.g., color: "blue", size: "large") + aggregation values
}

export interface DocumentsQueryResponse {
  rows?: Document[];
  aggregations?: Record<string, number>;
  aggregation_groups?: AggregationGroup[]; // NEW: Optional grouped aggregation results
  billing?: {
    billable_logical_bytes_queried: number;
    billable_logical_bytes_returned: number;
  };
  performance?: {
    cache_hit_ratio: number;
    cache_temperature: 'hot' | 'warm' | 'cold';
    server_total_ms: number;
    query_execution_ms: number;
    exhaustive_search_count: number;
    approx_namespace_size: number;
  };
}

export interface DocumentWriteParams {
  upsert_columns?: Record<string, any[]>;
  upsert_rows?: Record<string, any>[];
  patch_columns?: Record<string, any[]>;
  patch_rows?: Record<string, any>[];
  deletes?: (string | number)[];
  delete_by_filter?: Filter;
  distance_metric?: 'cosine_distance' | 'euclidean_squared';
  copy_from_namespace?: string;
  schema?: Record<string, any>;
  encryption?: {
    cmek: {
      key_name: string;
    };
  };
}

export interface DocumentWriteResponse {
  rows_affected?: number;
}

export interface ExportFormat {
  format: 'json' | 'csv';
  includeVectors?: boolean;
  attributes?: string[];
}