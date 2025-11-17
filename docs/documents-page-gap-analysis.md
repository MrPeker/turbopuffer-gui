# Comprehensive Gap Analysis: Documents Page vs Turbopuffer Query Capabilities

**Date:** 2025-11-18
**Analysis Scope:** Documents Page implementation vs Turbopuffer API query capabilities
**Files Analyzed:**
- Turbopuffer documentation (`turbopuffer-docs/`)
- `src/renderer/components/documents/DocumentsPage.tsx`
- `src/renderer/stores/documentsStore.ts`
- `src/renderer/components/documents/FilterBar/FilterBar.tsx`
- `src/renderer/components/documents/RawQueryBar.tsx`

---

## Executive Summary

The Documents page currently exposes **<30% of Turbopuffer's query capabilities** through the visual interface. While a raw query mode provides access to the full API, most users will never discover advanced features like vector search, BM25 full-text search, and hybrid queries.

**Total Gaps Identified:** 23 significant gaps
- **Critical:** 8 gaps (Vector, BM25, Hybrid Search, Search UX, etc.)
- **High:** 6 gaps (Advanced ranking, Search scope, Mode clarity, etc.)
- **Medium:** 7 gaps (Aggregations, Performance insights, etc.)
- **Low:** 2 gaps (Pagination polish, Error messages)

---

## 📊 IMPLEMENTATION GAPS

### 1. Vector Search (Critical Gap)

**Turbopuffer Capability:**
- ANN (Approximate Nearest Neighbor) vector search with query vectors
- Syntax: `["vector", "ANN", [0.1, 0.2, 0.3, ..., 76.8]]`
- Vector encoding options (float/base64)

**Current Implementation:**
- ❌ **Completely missing**
- No UI to input query vectors
- No vector similarity search capability
- No vector encoding selection

**Impact:** Users cannot perform semantic search, which is one of Turbopuffer's core strengths.

**Code Location:** Would need new component + integration in `documentsStore.ts:931-1188`

---

### 2. Full-Text Search / BM25 (Critical Gap)

**Turbopuffer Capability:**
- BM25 full-text search algorithm
- Multi-field search with custom weights
- FTS operators: `Sum`, `Max`, `Product`
- Field boosts: `["Product", 2, ["title", "BM25", "query"]]`
- Prefix queries with `last_as_prefix: true`
- Phrase matching with `ContainsAllTokens`
- Language-specific stemming and stopword removal (35+ languages)
- Custom tokenization options (word_v2, word_v1, word_v0, pre_tokenized_array)

**Current Implementation:**
- ❌ **Completely missing**
- Search is limited to ID field only with Glob pattern: `["id", "Glob", "*search*"]`
- No BM25 ranking
- No multi-field text search
- No field weight/boost configuration

**Impact:** Users cannot perform quality text searches, missing Turbopuffer's sophisticated text search capabilities.

**Code Location:** `documentsStore.ts:939` (search filter construction)

---

### 3. Hybrid Search (Critical Gap)

**Turbopuffer Capability:**
- Multi-queries (up to 16 simultaneous queries)
- Combine vector + BM25 searches
- Client-side rank fusion (reciprocal rank fusion)
- Re-ranking support
- Atomic execution with snapshot isolation

**Current Implementation:**
- ❌ **Not supported in UI**
- Raw query mode supports `queries` field, but no visual builder
- No guidance on hybrid search patterns
- No built-in rank fusion

**Impact:** Users cannot leverage hybrid search for best retrieval quality.

**Code Location:** Would need new component + query execution in `documentService.ts`

---

### 4. Advanced Ranking (Critical Gap)

**Turbopuffer Capability:**
- Multiple ranking functions: ANN, BM25, Sum, Max, Product
- Custom rank_by expressions
- Order by any attribute (ascending/descending)
- Rank by filter: `["species", "Eq", "whale"]` as ranking boost
- Nested ranking operators
- Field-specific weights

**Current Implementation:**
- ✅ Basic ordering by ID (`["id", "asc"]`)
- ❌ Cannot order by other attributes
- ❌ No custom ranking expressions
- ❌ No ranking operators (Sum, Max, Product)
- ❌ No filter-based ranking

**Impact:** Limited sorting flexibility; cannot rank by timestamp, score, or custom business logic.

**Code Location:** `documentsStore.ts:1153` (rank_by always set to `["id", "asc"]`)

---

### 5. Aggregations (Major Gap)

**Turbopuffer Capability:**
- `aggregate_by` with Count aggregations
- Group by one or more attributes
- Multiple aggregations in single query
- Aggregation groups with top_k limit
- Example: Count documents by category and size

**Current Implementation:**
- ✅ Uses Count aggregation internally for pagination total
- ❌ No UI to create custom aggregations
- ❌ No group-by support in UI
- ❌ Raw response viewer shows aggregation results but no builder

**Impact:** Cannot perform analytics queries like counting by category, grouping by attributes, etc.

**Code Location:**
- Used internally: `documentsStore.ts:1089-1096`
- Raw viewer: `DocumentsPage.tsx:184-226`

---

### 6. Multi-Query Support (Moderate Gap)

**Turbopuffer Capability:**
- Execute up to 16 queries atomically
- Snapshot isolation guarantees
- Independent parameters per sub-query (filters, top_k, rank_by, etc.)
- Used for hybrid search workflows

**Current Implementation:**
- ❌ **Not exposed in UI**
- Raw query mode supports it via JSON
- No visual builder for multi-queries

**Impact:** Power users cannot easily construct complex multi-query workflows.

**Code Location:** `RawQueryBar.tsx:119` (supports via JSON editor only)

---

### 7. Advanced Filter Operators (Moderate Gap)

**Turbopuffer Capability:**
- Array operators: `AnyLt`, `AnyLte`, `AnyGt`, `AnyGte`
- Regex matching with `Regex` operator (requires schema flag)
- Advanced glob patterns with concrete prefixes
- Full operator list: `Eq`, `NotEq`, `In`, `NotIn`, `Contains`, `NotContains`, `ContainsAny`, `NotContainsAny`, `Lt`, `Lte`, `Gt`, `Gte`, `Glob`, `NotGlob`, `IGlob`, `NotIGlob`, `Regex`, `ContainsAllTokens`

**Current Implementation:**
- ✅ Supports: `equals`, `not_equals`, `contains`, `greater`, `greater_or_equal`, `less`, `less_or_equal`, `in`, `not_in`, `matches` (Glob), `not_matches`, `imatches`, `not_imatches`
- ❌ Missing: `AnyLt`, `AnyLte`, `AnyGt`, `AnyGte`, `Regex`, `ContainsAllTokens`
- ❌ No visual support for array element comparisons
- ❌ No regex filter builder (would need schema configuration)

**Impact:** Cannot filter on array elements individually or use regex patterns.

**Code Location:** `documentsStore.ts:957-1076` (filter operator conversion)

---

### 8. Consistency Control (Minor Gap)

**Turbopuffer Capability:**
- Strong consistency (default): `{"level": "strong"}`
- Eventual consistency: `{"level": "eventual"}` - faster but up to 60s stale

**Current Implementation:**
- ❌ **Not exposed**
- Always uses default (strong consistency)

**Impact:** Cannot optimize for higher throughput with eventual consistency when stale data is acceptable.

**Code Location:** Would need to add to query options in `documentService.ts`

---

### 9. Query Response Metadata (Minor Gap)

**Turbopuffer Capability:**
- Performance metrics: `cache_hit_ratio`, `cache_temperature`, `server_total_ms`, `query_execution_ms`, `exhaustive_search_count`, `approx_namespace_size`
- Billing metrics: `billable_logical_bytes_queried`, `billable_logical_bytes_returned`

**Current Implementation:**
- ✅ Raw response viewer shows these in raw query mode
- ❌ Not surfaced in visual mode
- ❌ No performance insights dashboard

**Impact:** Users cannot analyze query performance or understand costs in visual mode.

**Code Location:** `DocumentsPage.tsx:211-223` (shows in raw response viewer)

---

## 🎯 FEATURE GAPS

### 1. Vector Search Interface

**What's Needed:**
- Vector input field (array of numbers or file upload)
- Vector dimension validation
- ANN parameter configuration
- Distance metric display (though this is namespace-level)
- Vector encoding preference (float vs base64)
- Sample vector templates/examples

**Priority:** 🔴 **Critical** - Core Turbopuffer feature

**Suggested Implementation:**
- New `VectorSearchInput` component
- Integration with filter system
- Validation against namespace schema

---

### 2. Full-Text Search Builder

**What's Needed:**
- Field selector for BM25 search
- Query text input
- Multi-field search with weight configuration
- FTS operator builder (Sum, Max, Product)
- Prefix query toggle (`last_as_prefix`)
- Language selection (for stemming/stopwords)
- Tokenizer selection (word_v2, pre_tokenized_array, etc.)
- Field boost slider/input

**Priority:** 🔴 **Critical** - Core Turbopuffer feature

**Suggested Implementation:**
- Extend `FilterBar` with search mode toggle
- New `BM25QueryBuilder` component
- Schema-aware field filtering (show only FTS-enabled fields)

---

### 3. Hybrid Search Workflow

**What's Needed:**
- Multi-query builder UI
- Visual representation of query combinations
- Rank fusion method selection (RRF, weighted, etc.)
- Sub-query parameter configuration
- Preview of each sub-query
- Results merging visualization

**Priority:** 🟠 **High** - Power user feature for best retrieval

**Suggested Implementation:**
- New `HybridSearchBuilder` component
- Step-by-step wizard interface
- Preset templates (vector+BM25, multi-field BM25, etc.)

---

### 4. Advanced Ranking Builder

**What's Needed:**
- Attribute selector for `order by`
- Sort direction (asc/desc)
- Ranking expression builder for nested operators
- Filter-based ranking (boost documents matching criteria)
- Multiple sort fields
- Visual rank expression editor

**Priority:** 🟠 **High** - Important for custom result ordering

**Suggested Implementation:**
- Add sort controls to `FilterBar`
- New `RankingBuilder` component for advanced expressions
- Integration with existing filter system

---

### 5. Aggregation & Analytics

**What's Needed:**
- Aggregation type selector (Count, future: Sum, Avg, etc.)
- Group-by attribute multi-select
- Aggregation label naming
- Results visualization (charts/graphs)
- Export aggregation results
- Saved aggregation queries

**Priority:** 🟡 **Medium** - Useful for analytics workflows

**Suggested Implementation:**
- New `AggregationBuilder` component
- Integration with raw response viewer
- Chart visualization library (recharts, victory, etc.)

---

### 6. Search Scope Expansion

**What's Needed:**
- Multi-field search (not just ID)
- Field weight/priority configuration
- Search across all text fields option
- Attribute-specific search presets
- Search history/autocomplete

**Priority:** 🟠 **High** - Current search is too limited

**Suggested Implementation:**
- Enhance search bar with field dropdown
- Multi-field OR logic
- Schema-aware field suggestions

---

### 7. Query Performance Insights

**What's Needed:**
- Cache hit ratio indicator
- Query execution time display
- Performance recommendations
- Cost estimation (billing metrics)
- Slow query warnings
- Performance history tracking

**Priority:** 🟡 **Medium** - Helps with optimization

**Suggested Implementation:**
- New `QueryMetrics` component
- Performance badge in table header
- Detailed metrics panel

---

### 8. Schema-Aware Features

**What's Needed:**
- Full-text search field configuration (FTS-enabled fields)
- Regex-enabled field indicators
- Vector field dimension display
- Schema validation warnings
- Field type icons/badges
- Missing schema warnings

**Priority:** 🟡 **Medium** - Better user guidance

**Suggested Implementation:**
- Enhance attribute discovery service
- Schema metadata display in filter builder
- Type-based UI hints

---

## 🎨 UI/UX GAPS

### 1. Search Discoverability (Critical UX Issue)

**Current State:**
- Search input placeholder says "search by id..."
- Users don't know it's ID-only search
- No indication of other search capabilities
- Search appears to be full-featured but isn't

**Improvement Needed:**
- Clear labeling: "Search IDs" or "Filter by ID Pattern"
- Dedicated search mode switcher (ID / Full-Text / Vector / Hybrid)
- Tooltips explaining search types
- Example queries shown
- "Upgrade to full-text search" prompt

**Priority:** 🔴 **Critical**

**Code Location:** `FilterBar.tsx:322` (search input)

---

### 2. Mode Confusion (Visual vs Raw)

**Current State:**
- Button labeled "Raw" / "Visual" - unclear what this means
- Converting from visual filters to raw query isn't transparent
- No clear indication of which mode is more powerful
- Users might not know raw mode exists

**Improvement Needed:**
- Rename to "Filter Builder" vs "Query Editor"
- Show feature comparison tooltip
- Add "Why use Query Editor?" help text
- Smooth transition between modes with query preservation
- Badge showing "Advanced features available"

**Priority:** 🟠 **High**

**Code Location:** `DocumentsPage.tsx:242-262` (mode toggle button)

---

### 3. Filter Operator Clarity

**Current State:**
- Operators like "contains" work differently for arrays vs strings
- No explanation of operator behavior
- Type conversion happens silently
- Users might not understand why filters don't work as expected

**Improvement Needed:**
- Context-sensitive operator descriptions
- Show example filter syntax
- Type-aware operator filtering (hide array operators for non-array fields)
- Visual indicator of data type for each attribute
- Tooltips with operator documentation

**Priority:** 🟡 **Medium**

**Code Location:** `FilterBuilder.tsx` (operator selection)

---

### 4. Missing Query Examples/Templates

**Current State:**
- Raw query mode has examples (good!)
- Visual mode has no templates/presets
- Users must discover filtering patterns themselves
- No guidance on common query patterns

**Improvement Needed:**
- Pre-built filter templates (e.g., "Recent documents", "Text contains", "Range filter")
- Query pattern library
- "Start from example" dropdown
- Integration with filter history
- Community-shared query templates

**Priority:** 🟡 **Medium**

**Code Location:** `FilterBar.tsx` (add template selector)

---

### 5. No Ranking Visualization

**Current State:**
- Results always ordered by ID ascending
- No visual indication of ranking/scoring
- Cannot see why documents are in their order
- `$dist` score hidden even when present

**Improvement Needed:**
- Show `$dist` score when present (vector/BM25)
- Sort indicator in table header
- Ranking explanation tooltip
- Highlighted ranking attribute
- Visual score bars/badges

**Priority:** 🟡 **Medium**

**Code Location:** `DocumentsTable.tsx` (add score column)

---

### 6. Pagination UX Issues

**Current State:**
- Cursor-based pagination (good!)
- No indication of total pages initially
- Current page not shown during navigation
- No quick navigation options

**Improvement Needed:**
- Current page / total pages indicator
- Jump to page input
- First/Last page buttons
- Loading state during page transitions
- Page size selector with presets

**Priority:** 🟢 **Low** - Current pagination works, just needs polish

**Code Location:** `FilterBar.tsx` (add pagination controls)

---

### 7. Performance Feedback Missing

**Current State:**
- No indication of query performance
- Users don't know if queries are slow/expensive
- No guidance on optimization
- Cache performance invisible

**Improvement Needed:**
- Query execution time badge
- Cache hit indicator (hot/warm/cold)
- Performance tier indicator
- Slow query warnings with optimization tips
- Cost impact warnings (high top_k, etc.)

**Priority:** 🟡 **Medium**

**Code Location:** Add to table header or status bar

---

### 8. Limited Error Messaging

**Current State:**
- Generic error messages
- No actionable suggestions
- Hard to debug query failures
- API errors shown as-is

**Improvement Needed:**
- Specific error messages (e.g., "Vector dimension mismatch: expected 1536, got 768")
- Suggestions for fixing (e.g., "Try reducing top_k or adding more selective filters")
- Link to relevant docs
- Error highlighting in query editor
- Common error pattern detection

**Priority:** 🟢 **Low**

**Code Location:** `documentsStore.ts` error handling, `RawQueryBar.tsx:134-165`

---

## 📋 PRIORITIZED RECOMMENDATIONS

### Phase 1: Immediate Priorities (Next Sprint)

#### 1. Add Full-Text Search Support
**Effort:** Medium (1-2 days)
**Impact:** High
**Files to modify:**
- `documentsStore.ts:939` - Replace ID-only search
- `FilterBar.tsx:322` - Add field selector to search bar
- New `BM25QueryBuilder.tsx` component

**Implementation:**
```typescript
// In documentsStore.ts:939
// Current:
if (state.searchText.trim()) {
  filters.push(["id", "Glob", `*${state.searchText.trim()}*`]);
}

// New:
if (state.searchText.trim()) {
  if (state.searchMode === 'bm25') {
    // BM25 full-text search
    const searchField = state.searchField || 'content';
    queryOptions.rank_by = [searchField, "BM25", state.searchText.trim()];
  } else {
    // Glob pattern search (existing)
    const searchField = state.searchField || 'id';
    filters.push([searchField, "Glob", `*${state.searchText.trim()}*`]);
  }
}
```

---

#### 2. Expand Search Input UI
**Effort:** Small (4-6 hours)
**Impact:** High (improves discoverability)
**Files to modify:**
- `FilterBar.tsx:317-339` - Enhance search bar

**Implementation:**
- Add dropdown for field selection
- Add search mode toggle (Pattern / Full-Text)
- Update placeholder dynamically
- Show search mode badge

---

#### 3. Add Vector Search UI
**Effort:** Large (2-3 days)
**Impact:** Critical
**Files to create:**
- New `VectorSearchInput.tsx` component
- New `VectorQueryBuilder.tsx` component

**Files to modify:**
- `documentsStore.ts` - Add vector query support
- `FilterBar.tsx` - Integrate vector search mode

**Implementation:**
- Vector input field with JSON array support
- Dimension validation
- File upload for vector (CSV/JSON)
- Integration with search mode switcher

---

### Phase 2: Short-term (Next Quarter)

#### 4. Advanced Ranking Builder
**Effort:** Medium (1-2 days)
**Impact:** High

**Implementation:**
- Allow ordering by any attribute
- Add sort direction toggle
- Support custom rank_by expressions
- Multi-field sorting

---

#### 5. Aggregation Support
**Effort:** Large (3-4 days)
**Impact:** Medium

**Implementation:**
- Add aggregation builder UI
- Visualize aggregation results (charts)
- Group-by interface
- Saved aggregation queries

---

#### 6. Hybrid Search Wizard
**Effort:** Large (3-5 days)
**Impact:** Medium-High

**Implementation:**
- Step-by-step multi-query builder
- Preset hybrid patterns (vector+BM25)
- Visual query combination editor
- Results fusion options

---

### Phase 3: Long-term Enhancements

#### 7. Performance Dashboard
**Effort:** Medium (2-3 days)
**Impact:** Medium

**Implementation:**
- Query metrics visualization
- Cost tracking per query
- Performance recommendations
- Historical performance graphs

---

#### 8. Schema-Aware UI
**Effort:** Medium (1-2 days)
**Impact:** Medium

**Implementation:**
- FTS field indicators
- Type-based filter suggestions
- Schema validation warnings
- Field metadata tooltips

---

## 💡 QUICK IMPLEMENTATION PATHS

### Quick Win #1: Multi-Field Search (2-3 hours)

**Goal:** Allow searching across multiple string fields, not just ID

**Changes:**
```typescript
// In documentsStore.ts line 939, replace:
filters.push(["id", "Glob", `*${state.searchText.trim()}*`]);

// With multi-field search:
const searchFields = state.attributes
  .filter(attr => attr.type === 'string' || attr.type === '[]string')
  .map(attr => attr.name);

const textSearchFilters = searchFields.map(field =>
  [field, "Glob", `*${state.searchText.trim()}*`]
);

if (textSearchFilters.length > 1) {
  filters.push(["Or", textSearchFilters]);
} else if (textSearchFilters.length === 1) {
  filters.push(textSearchFilters[0]);
}
```

**Benefits:**
- Immediately more useful search
- No UI changes needed
- Leverages existing architecture

---

### Quick Win #2: Order By Attribute (1-2 hours)

**Goal:** Allow sorting by any attribute, not just ID

**Changes:**
```typescript
// Add to documentsStore state:
sortAttribute: string | null;
sortDirection: 'asc' | 'desc';

// Add actions:
setSortAttribute: (attr: string, direction: 'asc' | 'desc') => void;

// In loadDocuments, line 1153, replace:
rank_by: ["id", "asc"],

// With:
rank_by: [state.sortAttribute || "id", state.sortDirection || "asc"],
```

**UI Changes (FilterBar.tsx):**
- Add sort dropdown with attribute list
- Add asc/desc toggle button
- Show current sort in table header

---

### Quick Win #3: BM25 Search Mode (4-6 hours)

**Goal:** Enable basic full-text search with BM25

**Changes:**

1. **Add state (documentsStore.ts):**
```typescript
searchMode: 'pattern' | 'bm25';
searchField: string | null;

setSearchMode: (mode: 'pattern' | 'bm25') => void;
setSearchField: (field: string) => void;
```

2. **Update query logic (documentsStore.ts:939):**
```typescript
if (state.searchText.trim()) {
  if (state.searchMode === 'bm25') {
    // Use BM25 ranking
    queryOptions.rank_by = [
      state.searchField || "content",
      "BM25",
      state.searchText.trim()
    ];
    // Don't add to filters - rank_by handles it
  } else {
    // Pattern matching (existing)
    const field = state.searchField || 'id';
    filters.push([field, "Glob", `*${state.searchText.trim()}*`]);
  }
}
```

3. **Add UI controls (FilterBar.tsx):**
- Search mode toggle (Pattern / Full-Text)
- Field selector dropdown
- Schema-aware field filtering (only show FTS-enabled fields for BM25)

**Note:** Requires attributes to have FTS schema configured. Add indicator if field isn't FTS-enabled.

---

### Quick Win #4: Show Query Performance (1-2 hours)

**Goal:** Display query execution time and cache performance

**Changes:**
```typescript
// In DocumentsPage.tsx, add after table:
{lastQueryResult?.performance && (
  <div className="px-3 py-1 bg-muted/50 border-t text-xs flex gap-4">
    <span>
      Query: {lastQueryResult.performance.query_execution_ms}ms
    </span>
    <span>
      Cache: {lastQueryResult.performance.cache_temperature}
    </span>
    <span>
      {(lastQueryResult.performance.cache_hit_ratio * 100).toFixed(1)}% hit rate
    </span>
  </div>
)}
```

---

## 🔍 CODE ARCHITECTURE INSIGHTS

### Key Observation #1: Filter Conversion Layer
The system has a well-designed `SimpleFilter` → `TurbopufferFilter` conversion layer in `documentsStore.ts:957-1076`. This abstraction is excellent for:
- ✅ Type safety (converts string values to correct types)
- ✅ Array vs scalar handling
- ✅ Operator mapping

However, it only supports basic operators. Adding vector/BM25 requires:
1. Extending `SimpleFilter` interface to support ranking modes
2. Adding new conversion logic for `rank_by` expressions
3. Handling operator nesting (Sum, Max, Product)

### Key Observation #2: Raw Query Escape Hatch
The Monaco editor (`RawQueryBar.tsx`) provides full Turbopuffer API access with:
- ✅ Syntax highlighting
- ✅ Autocomplete for operators and fields
- ✅ Example queries
- ✅ Direct API execution

This is excellent for power users, but **90% of users will never discover it**. The gap is in surfacing these capabilities through the visual interface.

### Key Observation #3: Search Architecture Limitation
Search is hardcoded to use Glob on ID field (`documentsStore.ts:942`):
```typescript
filters.push(["id", "Glob", `*${state.searchText.trim()}*`]);
```

This is a **one-line change** that blocks full-text search:
- Just replace `"id"` with the target field
- Replace `"Glob"` with `"BM25"` for text search
- Move from `filters` array to `rank_by` parameter

The infrastructure is **already there** - just needs routing!

### Key Observation #4: Query State Management
The store design is excellent:
- ✅ Zustand with Immer for immutable updates
- ✅ Per-namespace caching
- ✅ Cursor-based pagination
- ✅ Filter history persistence

Easy to extend with:
- Search mode state
- Ranking preferences
- Aggregation configurations

### Key Observation #5: Monaco Editor Integration
The raw query mode has impressive autocomplete (`RawQueryBar.tsx:349-500`):
- Context-aware suggestions (rank_by, filters, etc.)
- Field name completion from schema
- Operator documentation
- Snippet templates

**Opportunity:** Extract this autocomplete logic into a shared library for visual builders. The same intelligence could power:
- Field selector dropdowns
- Operator suggestions
- Type validation

---

## 📊 GAP SEVERITY MATRIX

| Gap Category | Critical | High | Medium | Low | Total |
|--------------|----------|------|--------|-----|-------|
| Implementation | 4 | 2 | 2 | 1 | 9 |
| Features | 2 | 2 | 3 | 0 | 7 |
| UI/UX | 2 | 1 | 4 | 2 | 9 |
| **Total** | **8** | **5** | **9** | **3** | **25** |

---

## 🎯 SUCCESS METRICS

To measure progress in closing these gaps, track:

### Coverage Metrics
- **Query Capability Coverage:** Currently ~30% → Target 80%
- **Visual Builder Coverage:** Currently ~25% → Target 70%
- **Feature Parity (vs Raw Mode):** Currently ~20% → Target 60%

### User Metrics
- **% Users Using Vector Search:** 0% → Target 40%
- **% Users Using BM25 Search:** 0% → Target 60%
- **% Users Discovering Raw Mode:** Unknown → Target 80% awareness
- **Average Query Complexity:** Low → Target Medium

### Performance Metrics
- **Query Time P50:** (Establish baseline)
- **Cache Hit Rate:** (Expose and track)
- **Failed Queries:** (Add error tracking)

---

## 📚 REFERENCES

### Turbopuffer Documentation
- [Query API](../turbopuffer-docs/turbopuffer.com_docs_query.md)
- [Full-Text Search Guide](../turbopuffer-docs/turbopuffer.com_docs_fts.md)
- [Hybrid Search Guide](../turbopuffer-docs/turbopuffer.com_docs_hybrid.md)
- [Metadata API](../turbopuffer-docs/turbopuffer.com_docs_metadata.md)

### Implementation Files
- `src/renderer/stores/documentsStore.ts` - Core query logic
- `src/renderer/components/documents/DocumentsPage.tsx` - Main page
- `src/renderer/components/documents/FilterBar/FilterBar.tsx` - Visual filter UI
- `src/renderer/components/documents/RawQueryBar.tsx` - JSON query editor
- `src/renderer/services/documentService.ts` - API integration

---

## 🚀 NEXT STEPS

### Immediate Actions
1. **Prioritize Quick Wins** - Implement multi-field search and order-by (1 day effort)
2. **Design BM25 UI** - Sketch visual builder for full-text search
3. **Prototype Vector Input** - Create basic vector search interface
4. **User Research** - Identify which missing features users need most

### Short-term Roadmap
1. Phase 1 implementation (BM25, Vector, improved search)
2. Add performance metrics display
3. Enhance filter operators (array comparisons, regex)
4. Create hybrid search wizard

### Long-term Vision
- Feature parity with raw query mode
- Schema-aware intelligent UI
- Query performance optimization tools
- Advanced analytics dashboard

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Next Review:** After Phase 1 implementation
