# Turbopuffer Feature Gaps & Implementation Roadmap

**Date:** 2025-01-18
**Status:** Planning
**Priority:** High

## Executive Summary

This document provides a comprehensive analysis of Turbopuffer API features and their implementation status in the turbopuffer-gui app. After comparing the official Turbopuffer documentation against the current codebase, we identified a **~75% feature coverage** rate with strategic gaps in advanced operations and analytics.

**Key Findings:**
- ✅ Excellent coverage of core query, write, and namespace operations
- ❌ Missing: Grouped aggregations, conditional writes, advanced metadata
- 🎯 Recommended approach: Incremental implementation starting with grouped aggregations

---

## Current Feature Coverage

### ✅ Fully Implemented Features

#### Query & Search
- Vector search (ANN)
- Full-text search (BM25)
- Filtering (visual builder + raw query mode)
- Ordering by attributes
- Basic aggregations (Count)
- Multi-queries (hybrid search support)
- Include/exclude attributes
- Cursor-based pagination
- Query performance metrics display

#### Write Operations
- Upsert documents (row/column format)
- Patch documents (update attributes)
- Delete documents by ID
- Delete by filter

#### Namespace Operations
- List namespaces (with pagination)
- Delete namespace
- Get namespace schema/metadata
- Update namespace schema
- Full-text search configuration

#### Other Features
- Export documents (JSON/CSV)
- Import documents (JSON/CSV)
- Multi-connection management
- Multi-region support
- Read-only connection mode
- Encrypted credential storage

---

## Missing Features (Detailed Analysis)

### 1. Advanced Write Operations

#### A. Conditional Writes ⭐ HIGH PRIORITY
**API Support:**
- `upsert_condition` - Conditional upsert based on document state
- `patch_condition` - Conditional patch operations
- `delete_condition` - Conditional delete operations

**Use Cases:**
- Optimistic locking for concurrent updates
- Version control (only update if newer timestamp)
- Prevent data races in multi-writer scenarios
- ETL pipelines with idempotency guarantees

**API Example:**
```json
{
  "upsert_rows": [...],
  "upsert_condition": [
    "Or", [
      ["updated_at", "Lt", {"$ref_new": "updated_at"}],
      ["updated_at", "Eq", null]
    ]
  ]
}
```

**UI Integration Strategy:**
- Add "Advanced Options" section to DocumentUploadDialog
- Add "Conditional Update" toggle to DocumentDetailsPanel
- Visual condition builder (similar to FilterBuilder)
- Pre-built templates: "Only if newer", "Only if missing", "Custom"

---

#### B. Patch by Filter ⭐ MEDIUM PRIORITY
**API Support:**
- `patch_by_filter` - Update multiple documents matching a filter
- `patch_by_filter_allow_partial` - Handle large batch updates (>500k docs)

**Use Cases:**
- Bulk attribute updates across matching documents
- Data normalization (e.g., fix typos across all docs)
- Status updates (e.g., mark all old records as "archived")

**API Example:**
```json
{
  "patch_by_filter": {
    "filters": ["status", "Eq", "pending"],
    "patch": { "status": "processed" }
  }
}
```

**UI Integration Strategy:**
- Add "Bulk Update" action to FilterBar
- Shows preview: "X documents match this filter"
- Confirmation dialog with attribute editor
- Progress indicator for large operations

---

#### C. Copy from Namespace ⭐ LOW PRIORITY
**API Support:**
- `copy_from_namespace` - Server-side namespace copying
- Cross-organization copying (with source API key)
- CMEK encryption configuration during copy

**Use Cases:**
- Namespace backups
- Environment promotion (dev → staging → prod)
- Data migration between organizations

**UI Integration Strategy:**
- Add "Duplicate Namespace" action to NamespacesPage
- Dialog with source/destination selection
- Optional: Cross-org copy with API key input
- Progress tracking for large namespaces

---

### 2. Query Features

#### A. Grouped Aggregations ⭐ HIGH PRIORITY
**API Support:**
- `group_by` parameter with `aggregate_by`
- Up to `top_k` groups returned
- Groups ordered by group key

**Use Cases:**
- Analytics dashboards (count by category, status, date)
- Faceted search results
- Data exploration and discovery

**API Example:**
```json
{
  "aggregate_by": { "count": ["Count"] },
  "group_by": ["color", "size"],
  "top_k": 100
}
```

**Response:**
```json
{
  "aggregation_groups": [
    { "color": "blue", "size": "small", "count": 42 },
    { "color": "blue", "size": "large", "count": 18 },
    { "color": "red", "size": "medium", "count": 9 }
  ]
}
```

**UI Integration Strategy:**
- Extend existing AggregationsPanel component
- Add "Group By" multi-select dropdown
- Display results as:
  - Table view (grouped rows)
  - Chart view (bar/pie charts using recharts)
  - Tree view (hierarchical for multi-level grouping)
- Export grouped results to CSV

---

#### B. Consistency Levels ⭐ MEDIUM PRIORITY
**API Support:**
- `consistency: { level: 'strong' }` (default)
- `consistency: { level: 'eventual' }`

**Trade-offs:**
- Strong: All data included, may wait for indexing
- Eventual: Faster, may be up to 60s stale, ~99.99% consistent in practice

**UI Integration Strategy:**
- Add to Settings → Performance section
- Global default + per-query override
- Tooltip explaining trade-offs
- Performance metrics show cache hit ratio impact

---

#### C. Advanced FTS Features ⭐ MEDIUM PRIORITY
**API Support:**
- Custom BM25 parameters (`k1`, `b`)
- Pre-tokenized array for custom tokenization
- Multi-field BM25 with Sum/Product operators

**API Example:**
```json
{
  "rank_by": [
    "Sum", [
      ["Product", 3, ["title", "BM25", "query"]],
      ["Product", 2, ["tags", "BM25", "query"]],
      ["content", "BM25", "query"]
    ]
  ]
}
```

**UI Integration Strategy:**
- Extend RawQueryBar with BM25 expression builder
- Advanced FTS settings in schema configuration
- Pre-built templates for common patterns

---

### 3. Namespace Operations

#### A. Namespace Metadata Display ⭐ HIGH PRIORITY
**Missing Fields:**
- `approx_logical_bytes` - Namespace size
- `approx_row_count` - Document count
- `created_at` - Creation timestamp
- `updated_at` - Last modification
- `encryption` - CMEK configuration
- `index.status` - Index building status (updating vs up-to-date)
- `index.unindexed_bytes` - WAL size

**UI Integration Strategy:**
- Add "Namespace Info" panel to DocumentsPage header
- Display as expandable card:
  ```
  📊 my-namespace
  ├─ 1.2M documents
  ├─ 3.4 GB
  ├─ Index: ✅ Up to date
  ├─ Created: 2024-03-15
  └─ Updated: 2 hours ago
  ```
- Show index building progress when `status: 'updating'`
- Color-coded indicators (green=ready, yellow=building, red=error)

---

#### B. Warm Cache Hint ⭐ MEDIUM PRIORITY
**API Support:**
- `GET /v1/namespaces/:namespace/hint_cache_warm`
- Prepares namespace for low-latency queries
- Free if already warm or warming

**Use Cases:**
- Pre-warm before user sessions
- Scheduled warm-up for predictable traffic patterns
- Reduce first-query latency

**UI Integration Strategy:**
- Add "Warm Cache" button to namespace actions
- Auto-warm option in Settings (warm on namespace switch)
- Visual indicator: 🔥 (warm) vs ❄️ (cold)
- Show cache temperature from query performance metrics

---

#### C. Recall Evaluation ⭐ LOW PRIORITY (Debug Tool)
**API Support:**
- `POST /v1/namespaces/:namespace/_debug/recall`
- Measures ANN index quality vs exhaustive search
- Returns `avg_recall`, `avg_ann_count`, `avg_exhaustive_count`

**UI Integration Strategy:**
- Add to Settings → Developer Tools section
- "Run Recall Test" button
- Display results as quality score + visualization
- Useful for validating index quality after schema changes

---

### 4. Advanced Schema Features

#### A. CMEK Encryption ⭐ LOW PRIORITY (Enterprise)
**API Support:**
- Customer-managed encryption keys (GCP/AWS KMS)
- Per-namespace encryption configuration

**UI Integration Strategy:**
- Add to "Create Namespace" dialog (enterprise tier)
- Display encryption status in metadata panel
- Warning when copying unencrypted → encrypted

---

### 5. Export Features

#### A. Optimized Export ⭐ LOW PRIORITY
**Current:** Client-side pagination with multiple queries
**Potential:** Streaming export with progress indicators

**UI Integration Strategy:**
- Add progress bar for large exports
- Background export with notification
- Export history/download manager

---

### 6. Developer/Testing Features

#### A. Disable Backpressure ⭐ LOW PRIORITY
**API Support:**
- `disable_backpressure: true` for bulk ingestion
- Allows writes even when WAL > 2GB

**UI Integration Strategy:**
- Add to Settings → Performance → Bulk Import
- Warning dialog explaining trade-offs
- Auto-disable for uploads > 10k documents

---

## Priority Recommendations

### Phase 1: High-Impact Analytics (Weeks 1-2)
1. **Grouped Aggregations** - Unlocks analytics workflows
2. **Namespace Metadata Display** - Operational visibility

### Phase 2: Advanced Operations (Weeks 3-4)
3. **Conditional Writes** - Data integrity for advanced users
4. **Patch by Filter** - Bulk update capabilities

### Phase 3: Performance & Polish (Weeks 5-6)
5. **Warm Cache Hint** - Latency optimization
6. **Consistency Levels** - Performance tuning
7. **Advanced FTS** - Multi-field search

### Phase 4: Optional/Enterprise (Future)
8. **Copy from Namespace** - Backup workflows
9. **CMEK Encryption** - Enterprise security
10. **Recall Evaluation** - Debug tooling

---

## Implementation Roadmap

### Approach: Incremental Integration
- Implement one feature at a time, fully complete
- Validate with real usage before moving to next
- Each feature gets its own design iteration
- Lower risk, easier to validate

### Feature #1: Grouped Aggregations (NEXT)

#### User Stories
1. As a data analyst, I want to see document counts grouped by category so I can understand data distribution
2. As a developer, I want to group search results by status to build dashboard widgets
3. As a product manager, I want to explore data by multiple dimensions to find insights

#### UI Components Needed
- **FilterBar Extension**
  - Add "Group By" section below aggregations
  - Multi-select dropdown for attributes
  - Limit: Up to 2-3 group-by attributes (UX constraint)

- **Results Display**
  - New `AggregationGroupsTable` component
  - Columns: Group keys + aggregation value
  - Sortable by any column
  - Export to CSV

- **Visualization Options**
  - Bar chart (using recharts)
  - Pie chart (for single group-by)
  - Tree view (for hierarchical grouping)

#### Data Flow
```
FilterBar (user selects group_by attributes)
  ↓
documentsStore.loadDocuments() with group_by param
  ↓
documentService.queryDocuments() with aggregate_by + group_by
  ↓
Turbopuffer API returns aggregation_groups
  ↓
Store updates aggregationGroups state
  ↓
AggregationGroupsTable renders results
```

#### Implementation Steps
1. Update types (`DocumentsQueryParams` add `group_by`)
2. Update `documentsStore` (add `aggregationGroups` state)
3. Update `documentService.queryDocuments()` (pass `group_by`)
4. Create `GroupBySelector` component (FilterBar)
5. Create `AggregationGroupsTable` component
6. Add chart visualization (optional)
7. Update `DocumentsPage` to render grouped results
8. Add tests

#### Edge Cases
- Empty group keys (null values)
- Large number of groups (pagination needed?)
- Group-by without aggregations (show error)
- Multiple aggregations with grouping

---

## UI Integration Patterns

### Pattern 1: Extend Existing Components
- Grouped Aggregations → Extend FilterBar + AggregationsPanel
- Namespace Metadata → Extend SchemaPage header
- Conditional Writes → Extend DocumentUploadDialog

**Why:** Maintains UI consistency, leverages existing patterns

### Pattern 2: New Specialized Components
- Patch by Filter → New BulkUpdateDialog
- Copy Namespace → New NamespaceCopyDialog

**Why:** Complex workflows need dedicated UI

### Pattern 3: Settings Integration
- Consistency Levels → Settings → Performance
- Warm Cache Auto-trigger → Settings → Performance
- Backpressure Control → Settings → Advanced

**Why:** Power-user features, not everyday operations

---

## Design Principles

### 1. Progressive Disclosure
- Simple by default, advanced features hidden
- Example: Conditional writes behind "Advanced Options" toggle

### 2. Contextual Help
- Tooltips explaining trade-offs
- Example: Consistency level tooltip shows latency vs freshness trade-off

### 3. Visual Feedback
- Index building progress indicators
- Cache temperature indicators (🔥/❄️)
- Success/error states with clear messaging

### 4. Performance Awareness
- Show query performance impact
- Warn on expensive operations (large batch updates)
- Suggest optimizations (eventual consistency for analytics)

### 5. Data Safety
- Confirmation dialogs for destructive operations
- Preview before bulk updates
- Export before namespace copy

---

## Technical Considerations

### State Management
- Zustand stores for feature-specific state
- Context for cross-cutting concerns
- Keep stores namespaced (avoid global pollution)

### API Client
- Extend `documentService` and `namespaceService`
- Add new service methods with proper typing
- Handle new response formats (aggregation_groups)

### Type Safety
- Update TypeScript types in `src/types/`
- Ensure SDK types match API responses
- Add union types for new parameters

### Error Handling
- Graceful degradation (old API versions)
- Clear error messages for unsupported features
- Fallback UI when features unavailable

### Testing Strategy
- Unit tests for new service methods
- Component tests for new UI
- Integration tests for full workflows
- Manual testing with real Turbopuffer API

---

## Success Metrics

### Feature Adoption
- % of queries using grouped aggregations
- # of conditional writes per week
- Namespace metadata panel views

### Performance Impact
- Query latency with vs without new features
- Cache hit ratio improvements
- Index building time reduction

### User Feedback
- Feature request tickets closed
- User satisfaction surveys
- Support ticket volume changes

---

## Next Steps

1. ✅ Document feature gaps (this file)
2. 🎯 Design grouped aggregations UI (detailed mockups)
3. 🎯 Implement grouped aggregations (Phase 1)
4. 🎯 User testing & iteration
5. 🎯 Design namespace metadata display
6. 🎯 Implement namespace metadata
7. 🎯 Continue with Phase 2 features...

---

## Appendix: Turbopuffer API Reference

### Key Endpoints Used
- `POST /v2/namespaces/:namespace/query` - Query with group_by
- `POST /v2/namespaces/:namespace` - Write with conditions
- `GET /v1/namespaces/:namespace/metadata` - Full metadata
- `GET /v1/namespaces/:namespace/hint_cache_warm` - Cache warming

### Documentation Links
- Query API: https://turbopuffer.com/docs/query
- Write API: https://turbopuffer.com/docs/write
- Namespace Metadata: https://turbopuffer.com/docs/metadata
- Hybrid Search: https://turbopuffer.com/docs/hybrid
- Full-Text Search: https://turbopuffer.com/docs/fts

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Next Review:** After Phase 1 completion
