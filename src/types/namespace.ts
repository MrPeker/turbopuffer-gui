export interface Namespace {
  id: string;
  /** Optional regionId for tracking which region this namespace belongs to */
  regionId?: string;
  /** @deprecated Document count queries can cause 429 rate limit errors. Avoid using this property. */
  documentCount?: number;
  // Metadata fields (populated when fetched via getNamespaceMetadata)
  approx_row_count?: number;
  approx_logical_bytes?: number;
  created_at?: string;
}

export interface NamespaceMetadata {
  approx_row_count: number;
  approx_logical_bytes: number;
  created_at: string;
  schema?: Record<string, unknown>;
}

export interface NamespacesResponse {
  namespaces: Namespace[];
  next_cursor?: string;
}

export interface NamespaceListParams {
  cursor?: string;
  prefix?: string;
  page_size?: number;
}

export interface NamespaceSchema {
  [attributeName: string]: AttributeSchema;
}

export interface AttributeSchema {
  type: AttributeType;
  filterable?: boolean;
  full_text_search?: boolean | FullTextSearchConfig;
}

export type AttributeType =
  | 'string'
  | 'int'
  | 'uint'
  | 'float'
  | 'uuid'
  | 'datetime'
  | 'bool'
  | '[]string'
  | '[]int'
  | '[]uint'
  | '[]float'
  | '[]uuid'
  | '[]datetime'
  | '[]bool'
  | VectorType;

export interface VectorType {
  type: string; // e.g., "[512]f32" or "[512]f16"
  ann: boolean;
}

export interface FullTextSearchConfig {
  language?: string;
  stemming?: boolean;
  remove_stopwords?: boolean;
  case_sensitive?: boolean;
  tokenizer?: string;
  k1?: number;
  b?: number;
  k3?: number;
  ascii_folding?: boolean;
  max_token_length?: number;
}

/** @deprecated NamespaceStats interface is deprecated to prevent 429 rate limit errors from document counting */
export interface NamespaceStats {
  id: string;
  /** @deprecated Document count queries can cause 429 rate limit errors */
  documentCount: number;
  sizeInBytes: number;
  lastUpdated: Date;
}