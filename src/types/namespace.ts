export interface Namespace {
  id: string;
  /** @deprecated Document count queries can cause 429 rate limit errors. Avoid using this property. */
  documentCount?: number;
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
  | 'uuid' 
  | 'datetime' 
  | 'bool' 
  | '[]string' 
  | '[]int' 
  | '[]uint' 
  | '[]uuid' 
  | '[]datetime'
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
}

/** @deprecated NamespaceStats interface is deprecated to prevent 429 rate limit errors from document counting */
export interface NamespaceStats {
  id: string;
  /** @deprecated Document count queries can cause 429 rate limit errors */
  documentCount: number;
  sizeInBytes: number;
  lastUpdated: Date;
}