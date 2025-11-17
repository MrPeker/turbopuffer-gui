# Unified Query Architecture - Implementation Plan

**Date:** 2025-11-18
**Status:** In Progress
**Approach:** Ground-up redesign for long-term maintainability

## Vision

Replace the current SimpleFilter/documentsStore architecture with a unified query system that:
- Supports all Turbopuffer query capabilities (filters, BM25, vector, aggregations, hybrid)
- Provides type-safe query construction
- Enables visual and code-based query editing
- Scales to future features without architectural rewrites

## Core Architecture

### 1. Unified Query Model

```typescript
interface UnifiedQuery {
  id: string;
  version: string;

  // Search
  search: SearchConfig | null;
  filters: FilterNode[];
  ranking: RankingConfig | null;

  // Results
  top_k: number;
  include_attributes: string[];
  include_vectors: boolean;

  // Advanced
  aggregations: AggregationConfig[];
  multi_queries: UnifiedQuery[];
  consistency: 'strong' | 'eventual';
}
```

### 2. New Store Architecture

**queryStore.ts** - Query building and state
- Query construction and modification
- Template management
- Undo/redo support
- Query validation

**queryExecutionStore.ts** - Query execution and results
- Execute queries
- Manage results and pagination
- Performance metrics
- Error handling

**queryTemplatesStore.ts** - Saved queries and templates
- Save/load queries
- Quick win templates
- Recent query history
- Shared templates

### 3. Component Architecture

**Query Builder Components:**
- `QueryBuilder.tsx` - Main orchestrator
- `SearchModeSelector.tsx` - Pattern/BM25/Vector/Hybrid switcher
- `PatternSearchBuilder.tsx` - Glob/regex search
- `BM25SearchBuilder.tsx` - Full-text search with field weights
- `VectorSearchBuilder.tsx` - Vector input and ANN config
- `FilterBuilder.tsx` - Visual filter construction (redesigned)
- `RankingBuilder.tsx` - Custom ranking expressions
- `AggregationBuilder.tsx` - Aggregation configuration

**Display Components:**
- `QueryPreview.tsx` - Show final query JSON
- `QueryPerformanceMetrics.tsx` - Cache, timing, cost
- `ResultsTable.tsx` - Sortable, filterable results
- `ResultsAggregations.tsx` - Aggregation visualizations

## Implementation Phases

### Quick Wins (8 hours)
1. Multi-field search - extend current search to all string fields
2. Order by attribute - sortable columns
3. Basic BM25 mode - single field full-text search
4. Performance metrics - display query timing and cache stats

### Phase 1: Core Search (5-9 days)
1. Unified query model types and builders
2. BM25 search with multi-field and weights
3. Vector search input and execution
4. Search mode UI with switcher
5. Query store with validation

### Phase 2: Advanced Features (6-11 days)
1. Advanced ranking builder
2. Aggregation support with visualizations
3. Hybrid search (multi-query) wizard
4. Query templates and history
5. Filter improvements (array operators, regex)

### Phase 3: Polish (3-5 days)
1. Performance dashboard
2. Schema-aware UI (FTS indicators, type hints)
3. Query optimization suggestions
4. Enhanced error messages
5. Keyboard shortcuts

## Migration Strategy

**Incremental commits:**
1. Build new architecture alongside old
2. Feature flag to toggle between old/new UI
3. Migrate data and queries automatically
4. Remove old code once validated

**Backward compatibility:**
- Old saved filters convert to new query format
- API remains unchanged
- URL parameters map to new query structure

## Testing Strategy

- Unit tests for query builders and converters
- Integration tests for query execution
- E2E tests for UI flows
- Performance regression tests

## Success Metrics

- All 23 gaps from analysis addressed
- Query construction time < 30s for complex queries
- Zero data loss during migration
- Performance metrics visible for all queries
