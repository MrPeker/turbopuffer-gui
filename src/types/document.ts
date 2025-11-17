export interface Document {
  id: string | number;
  vector?: number[];
  $dist?: number;
  attributes?: Record<string, any>;
}

export interface DocumentsQueryParams {
  rank_by?: RankBy;
  top_k?: number;
  filters?: Filter;
  include_attributes?: string[] | boolean;
  aggregate_by?: Record<string, AggregateFunction>;
  vector_encoding?: 'float' | 'base64';
  consistency?: {
    level: 'strong' | 'eventual';
  };
  offset?: number;
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
  | [string, FilterOp, any];

export type FilterOp = 
  | 'Eq' | 'NotEq' 
  | 'In' | 'NotIn'
  | 'Lt' | 'Lte' | 'Gt' | 'Gte'
  | 'Glob' | 'NotGlob' | 'IGlob' | 'NotIGlob'
  | 'ContainsAllTokens'
  | 'Contains' | 'ContainsAny'
  | 'Regex';

export type AggregateFunction = ['Count', string];

export interface DocumentsQueryResponse {
  rows?: Document[];
  aggregations?: Record<string, number>;
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