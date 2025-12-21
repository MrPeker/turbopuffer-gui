# Turbopuffer GUI - Feature Gap Analysis Report

> Generated: 2025-01-20
> Based on: Turbopuffer documentation vs codebase implementation

## Summary

The GUI implements core browsing and basic CRUD operations but lacks many advanced Turbopuffer features that power users would expect.

---

## 1. QUERY API (`/docs/query`)

### ✅ Fully Implemented

| Feature | Implementation | Location |
|---------|---------------|----------|
| Basic querying | `ns.query()` with rank_by, top_k, filters | `documentService.ts:80-89` |
| Attribute filtering (Eq, NotEq, Lt, Gt, etc.) | Full filter operator support | `types/document.ts:36-43` |
| Logical operators (And, Or, Not) | Compound filter building | `types/document.ts:30-34` |
| BM25 full-text search | rank_by with BM25 operator | `types/document.ts:24` |
| Vector search (ANN) | rank_by with ANN operator | `types/document.ts:23` |
| include_attributes | Supported in query params | `documentService.ts:84` |
| Aggregations (Count) | aggregate_by parameter | `documentService.ts:85` |
| Group-by aggregations | group_by parameter (recently added) | `documentService.ts:86` |
| Consistency levels | strong/eventual consistency | `types/document.ts:16-18` |

### ⚠️ Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-query support | **Not exposed in UI** | Types exist but no UI to execute multiple queries in one call |
| Ranking expressions (Sum, Product, Max) | **Types only** | `types/document.ts:26-28` - No UI builder |
| include_vectors toggle | **Limited** | Export only, not in main query UI |

### ❌ Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| Cursor-based pagination | High | Uses offset-based, not native cursor |
| limit.total / limit.start | Medium | Advanced pagination not supported |
| Output expressions (exclude_vectors_if, exclude_attributes_if) | Low | Advanced output control missing |
| Regex filter operator | Medium | Type exists but no UI support |

---

## 2. WRITE API (`/docs/write`)

### ✅ Fully Implemented

| Feature | Implementation | Location |
|---------|---------------|----------|
| Upsert (columns format) | `ns.write({ upsert_columns })` | `documentService.ts:230-236` |
| Patch (columns format) | `ns.write({ patch_columns })` | `documentService.ts:272-274` |
| Delete by ID | `ns.write({ deletes })` | `documentService.ts:297-299` |
| Delete by filter | `ns.write({ delete_by_filter })` | `documentService.ts:322-324` |
| distance_metric | cosine_distance, euclidean_squared | `documentService.ts:237` |

### ⚠️ Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Row-based writes | **Types only** | `types/document.ts:73` - Not used in UI |
| Schema specification | **Types exist** | `types/document.ts:79` - No UI for schema config during writes |

### ❌ Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Conditional writes** (upsert_condition) | High | No support for optimistic locking / version checks |
| **Patch by filter** | High | Bulk update matching documents |
| patch_condition | Medium | Conditional patches |
| delete_condition | Medium | Conditional deletes |
| copy_from_namespace | Medium | Cross-namespace/region copy |
| CMEK encryption | Low | Enterprise feature, types exist but no UI |
| disable_backpressure | Low | Advanced bulk loading option |
| f16 vector support | Low | Half-precision vectors |

---

## 3. NAMESPACE API (`/docs/namespaces`, `/docs/metadata`, `/docs/delete-namespace`)

### ✅ Fully Implemented

| Feature | Implementation | Location |
|---------|---------------|----------|
| List namespaces | Pagination with prefix filter | `namespaceService.ts:17-56` |
| Delete namespace | `ns.delete()` | `namespaceService.ts:113-128` |
| Get schema | `ns.schema()` | `namespaceService.ts:130-144` |
| Update schema | `ns.updateSchema()` | `namespaceService.ts:146-167` |

### ❌ Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Namespace metadata** | High | approx_row_count, approx_logical_bytes, created_at, updated_at |
| **Index status** | High | unindexed_bytes, index status (updating/up-to-date) |
| Encryption status display | Low | Show SSE vs CMEK |

---

## 4. FULL-TEXT SEARCH (`/docs/fts`)

### ✅ Fully Implemented

| Feature | Implementation | Location |
|---------|---------------|----------|
| BM25 ranking | rank_by with BM25 operator | Types and query support |
| ContainsAllTokens filter | Filter operator | `types/document.ts:41` |
| Schema FTS configuration | UI for full_text_search settings | `FullTextSearchConfig.tsx` |

### ⚠️ Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Tokenizer selection | **In schema designer** | word_v3, pre_tokenized_array support |
| Language/stemming config | **In schema designer** | Available during schema edit |

### ❌ Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| BM25 k1/b tuning UI | Low | Advanced FTS tuning parameters |
| Pre-tokenized query input | Low | Array-based token input for custom tokenizers |

---

## 5. VECTOR SEARCH (`/docs/vector`)

### ✅ Fully Implemented

| Feature | Implementation | Location |
|---------|---------------|----------|
| ANN search | rank_by with ANN operator | Query support |
| Vector input | `VectorSearchInput.tsx` component | UI for entering vectors |
| Filter + vector search | Combined queries supported | Works in query builder |

### ❌ Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Vector visualization** | Medium | No display of vector values or similarity |
| Embedding generation | Low | No integration with embedding APIs |

---

## 6. HYBRID SEARCH (`/docs/hybrid`)

### ⚠️ Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Sum/Max/Product expressions | **Types only** | `types/document.ts:26-28` - No UI builder |
| Multi-query | **Types exist** | No UI to combine vector + BM25 queries |

### ❌ Not Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Hybrid search UI** | High | No combined vector + FTS interface |
| Field weighting/boosting | Medium | No UI for Product multipliers |
| Rank fusion preview | Low | Show how results are combined |

---

## 7. ADVANCED FEATURES

### ❌ Not Implemented - High Priority

| Feature | Doc Source | Notes |
|---------|------------|-------|
| **Recall evaluation** | `/docs/recall` | `ns.recall()` - Measure search accuracy |
| **Cache warming** | `/docs/warm-cache` | `ns.hint_cache_warm()` - Reduce cold start latency |
| **Multi-query** | `/docs/query#multi-queries` | Execute up to 16 queries in one call |

### ❌ Not Implemented - Medium Priority

| Feature | Doc Source | Notes |
|---------|------------|-------|
| **Export with pagination** | `/docs/export` | Client-side export exists but no server-side streaming |
| **Cross-region backup** | `/docs/backups` | copy_from_namespace with source_region |
| **Query history analysis** | - | Show billing, performance metrics over time |

### ❌ Not Implemented - Low Priority (Enterprise)

| Feature | Doc Source | Notes |
|---------|------------|-------|
| CMEK configuration | `/docs/cmek` | Types exist, no UI |
| Private networking | `/docs/private-networking` | N/A for GUI |

---

## 8. REGIONS (`/docs/regions`)

### ✅ Fully Implemented

| Feature | Implementation | Notes |
|---------|---------------|-------|
| Region selection | Connection configuration | All 15 public regions available |
| Custom endpoint | Settings support | For private clusters |

---

## 9. UI/UX GAPS

### Missing Features Users Would Expect

| Feature | Priority | Notes |
|---------|----------|-------|
| **Bulk actions toolbar** | High | Select multiple docs → delete/export |
| **Query templates/presets** | Medium | Save common query patterns |
| **Schema diff view** | Medium | Compare schema versions |
| **Real-time document count** | Medium | Disabled due to rate limits |
| **Import with schema inference** | Medium | Auto-detect types from data |
| **Keyboard shortcuts** | Low | Power user navigation |

---

## Priority Recommendations

### High Priority (Core Functionality Gaps)

1. **Namespace metadata display** - Show row count, size, timestamps
2. **Conditional writes UI** - Version-based updates are critical for many use cases
3. **Patch by filter** - Bulk updates without fetching all docs
4. **Multi-query support** - Hybrid search requires this
5. **Recall evaluation** - Debug vector search quality

### Medium Priority (Power User Features)

1. Cursor-based pagination
2. Ranking expression builder (Sum, Product, Max)
3. Cache warming action
4. Cross-region namespace copy

### Low Priority (Nice to Have)

1. CMEK configuration UI
2. Advanced BM25 tuning
3. Vector visualization

---

## Key Takeaways

- Core CRUD is solid, but **advanced write operations** (conditional, patch_by_filter) are missing
- **Namespace metadata** is a significant gap - users can't see basic stats like document count
- **Hybrid search** infrastructure exists in types but lacks UI
- The GUI is read-heavy; write-side features need work for production use cases
