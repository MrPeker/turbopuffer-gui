import type { Filter } from './document';

export type AttributeType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'mixed' | 'date';

export interface DiscoveredAttribute {
  name: string;
  type: AttributeType;
  uniqueValues?: any[];
  range?: { min: number; max: number };
  sampleValues: any[];
  frequency: number; // Number of documents with this attribute
  totalDocuments: number; // Total documents sampled
  isNullable: boolean;
  arrayElementType?: AttributeType; // For array attributes
  commonPatterns?: string[]; // For string attributes (email, url, etc.)
}

export interface AttributeFilter {
  id: string;
  attribute: string;
  type: AttributeType;
  operator: 'eq' | 'neq' | 'in' | 'notin' | 'lt' | 'lte' | 'gt' | 'gte' | 'glob' | 'contains' | 'exists';
  value: any;
  label: string; // Human readable description
}

export interface FilterUIConfig {
  component: 'text-input' | 'number-input' | 'select-dropdown' | 'multi-select' | 'combobox' | 'date-picker' | 'boolean-toggle' | 'range-slider' | 'checkbox-group';
  props?: Record<string, any>;
}

export interface AttributeDiscoveryOptions {
  sampleSize?: number;
  maxUniqueValues?: number;
  detectPatterns?: boolean;
  includeVector?: boolean;
}

export interface AttributeDiscoveryResult {
  attributes: DiscoveredAttribute[];
  totalDocuments: number;
  sampleSize: number;
  discoveredAt: Date;
}

export interface SavedFilterSet {
  id: string;
  name: string;
  description?: string;
  namespaceId: string;
  filters: AttributeFilter[];
  createdAt: Date;
  lastUsed?: Date;
}

// Helper types for filter building
export interface ActiveFilter extends AttributeFilter {
  isValid: boolean;
  error?: string;
}

export interface FilterSuggestion {
  attribute: string;
  operator: string;
  value: any;
  label: string;
  frequency: number; // How often this filter is used
}