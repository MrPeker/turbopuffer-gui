# Documents Page UX Redesign

**Date:** 2025-01-18
**Status:** Approved
**Goal:** Comprehensive UX redesign addressing visual hierarchy, mode clarity, and terminology alignment with Turbopuffer API

## Problem Statement

Current UI issues identified:
1. Visual hierarchy - everything looks the same weight
2. Confusing "Pattern" mode that doesn't exist in Turbopuffer API
3. Unclear relationship between search modes and inputs
4. Redundant pagination information
5. Domain-heavy terminology without helpful context
6. Query utilities mixed with settings

## Design Overview

### 1. Query Mode Selector (Top Tier)

Replace Pattern/BM25/Vector with modes that match actual Turbopuffer API:

**Mode Tabs:**
- **Browse** - Default mode, no ranking, uses filters + sorting
- **Full-text (BM25)** - Text search with BM25 ranking
- **Vector (ANN)** - Semantic similarity search

**Mode-Specific Interfaces:**

**Browse Mode:**
```
📋 Browse all documents
Use Filters to narrow results • Use Sort to order
```

**BM25 Mode:**
```
🔍 Search text...                                            [×]
Fields: [title] [content] [+ Add field]
Operator: (●) Any field  (○) All fields
Full-text search (BM25) • Ranks by text relevance
```

**Vector Mode:**
```
Enter vector: [1.2, 3.4, 5.6, ...]                          [×]
Vector field: [embedding ▼]
Semantic similarity search using embeddings
```

**Quick Actions (Right Side):**
- `[🔍 Filters (2)]` - Shows count, opens filter panel
- `Sort: [ID ▼]` - Simple sort dropdown
- `[</>]` - Visual/Raw toggle

### 2. Expandable Panels (Second Tier)

**Filters Panel:**
```
BUILD FILTERS                                    [+ Add Filter]
┌───────────────────────────────────────────────────────────┐
│ [id ▼] [equals ▼] [doc-123]                          [×] │
│ [status ▼] [in ▼] [active, pending]                  [×] │
└───────────────────────────────────────────────────────────┘

Active: [id = "doc-123"] [×]  [status in (active, pending)] [×]
        [Clear all]
```

**Custom Ranking Expression** (advanced):
```
CUSTOM RANKING EXPRESSION                          [Switch to simple sort]
┌───────────────────────────────────────────────────────────┐
│ score * 0.8 + recency * 0.2                               │
└───────────────────────────────────────────────────────────┘
Available: id, score, [all attributes...]
```

### 3. Toolbar Organization

**Top Toolbar** (document actions):
```
Documents • namespace-name            [↻ Refresh][↑ Upload][↓ Export][</>]
```

**Query Utilities Row** (integrated with query builder):
```
[Filters (2)] [Sort ▼] │ [History] [Columns (6/6)] [Aggregations]
```

**Grouping Logic:**
- **Left**: Primary query controls (Filters, Sort)
- **Right**: Query utilities (History, Columns, Aggregations)
- **Top**: Document operations (Upload, Export, Refresh)

### 4. Results Summary & Pagination

**Clean, single-line format:**
```
4,179 documents • Page 1 of 42 • [100 ▼] per page  [‹][›]
```

**With filters active:**
```
342 matching • 4,179 total • Page 1 of 4 • [100 ▼] per page [‹][›]
```

**Loading state:**
```
⟳ Loading documents...
```

### 5. Visual Hierarchy System

**Tier 1: Primary Actions** (most prominent)
- Mode tabs, Search inputs, Active filters button
- **Style**: h-8 (32px), bold labels, primary color when active

**Tier 2: Secondary Controls** (visible but less emphasis)
- Sort, History, Columns, Aggregations
- **Style**: h-7 (28px), regular weight, outline/ghost variants

**Tier 3: Tertiary/Utility** (subtle)
- Upload, Export, Refresh, Visual/Raw toggle
- **Style**: h-6 (24px), muted colors, minimal borders

**Color System:**
- Active primary: `bg-primary` (brand color)
- Secondary: `bg-secondary/border-secondary` (muted)
- Backgrounds: Subtle elevation differences
- Text: `text-foreground` → `text-muted-foreground` → `text-faint`

**Typography:**
- Mode labels: 13-14px, medium weight
- Controls: 12px, regular
- Helper text: 11px, muted
- Counts/badges: 10px, mono

## State Management Changes

### documentsStore.ts

**Change:**
```typescript
// OLD:
searchMode: 'pattern' | 'bm25' | 'vector'

// NEW:
queryMode: 'browse' | 'bm25' | 'vector'
```

**Keep existing:**
- `searchText` (for BM25)
- `vectorQuery` (for Vector)
- `activeFilters` (for all modes)
- `sortAttribute`, `sortDirection` (for Browse + BM25)
- `rankingMode`, `rankingExpression` (for custom ranking)

## Component Structure

```
DocumentsPage
├── Toolbar (document actions)
├── QueryBuilder
│   ├── ModeTabs (Browse, BM25, Vector)
│   ├── ModeInterface
│   │   ├── BrowseMode
│   │   ├── BM25Mode
│   │   └── VectorMode
│   └── QueryUtilities
│       ├── Filters → FilterPanel
│       ├── Sort → CustomRankingPanel (when advanced)
│       ├── History dropdown
│       ├── Columns dropdown
│       └── Aggregations → AggregationsPanel
├── ResultsTable
└── ResultsFooter
```

## Migration Strategy

1. **'pattern' → 'browse'**: Default mode becomes Browse (no ranking)
2. **Existing filters**: Unchanged, continue to work as-is
3. **BM25/Vector**: Behavior unchanged, improved UI/labels
4. **Visual updates**: Apply hierarchy system across all components

## Success Criteria

- [ ] Clear visual distinction between primary, secondary, tertiary actions
- [ ] Mode selector matches actual Turbopuffer API concepts
- [ ] ID lookups work via Filters (id = "value") in Browse mode
- [ ] No redundant information in pagination
- [ ] Query utilities grouped separately from document actions
- [ ] Helper text explains technical terms (BM25, ANN, etc.)
