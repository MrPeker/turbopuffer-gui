# RFC 0001 — Turbopuffer GUI ↔ Docs alignment

**Status:** Draft · **Date:** 2026-05-26 · **Owner:** @MrPeker
**Inputs:** 12 parallel doc-vs-code audits across `turbopuffer-docs/*` (36 files, 8593 lines) and `src/renderer/{services,components,stores,utils}`

---

## 0 · Executive heat map

```
                       Coverage     Bugs    Priority    Effort
──────────────────────────────────────────────────────────────
Connections / Auth     ████████░    1       P1          S
Namespaces             ██████░░░    2       P1          M
Schema / Vectors       █████░░░░    0       P1          M
Writes                 ███░░░░░░    1       P1          L
Query / Filters        █████░░░░    2       P0          L
FTS                    ███████░░    0       P2          S
Hybrid search          █░░░░░░░░    0       P2          L
Branching              ░░░░░░░░░    0       P2          M
Export                 █████████    0       —           —
Backups                ░░░░░░░░░    0       P3          M
Pinning / Warm cache   ░░░░░░░░░    0       P1          S
Recall debug           ░░░░░░░░░    0       P3          S
Consistency control    █░░░░░░░░    0       P1          S
Limit guardrails       ░░░░░░░░░    0       P2          S
Regions                ███████░░    0       P0          XS
Enterprise (CMEK etc)  ░░░░░░░░░    0       P3          —

Legend: █ implemented · ░ missing   |   XS<1d · S=1-2d · M=3-5d · L=1-2w
```

---

## 1 · TL;DR — phased plan

```
┌─────────── PHASE 1 (this week) ───────────┐
│ P0 fixes only — bugs and silent data loss  │
│  ├─ Fix RankingExpressionBuilder ops      │
│  ├─ Remove `offset` from query params     │
│  ├─ Wire `next_cursor` in list namespaces │
│  ├─ Fix prefix lost on tree expansion     │
│  ├─ Stop fabricating `created_at`         │
│  └─ Add 5 missing regions                 │
└────────────────────────────────────────────┘
                       │
                       ▼
┌─────────── PHASE 2 (next sprint) ──────────┐
│ Surface high-value missing features        │
│  ├─ Consistency selector (strong|eventual)│
│  ├─ Namespace pinning + utilization badge │
│  ├─ Warm-cache action button              │
│  ├─ Inline limit validators               │
│  ├─ Reframe `isReadOnly` → "UI guard"     │
│  └─ `distance_metric` selector @ create   │
└────────────────────────────────────────────┘
                       │
                       ▼
┌─────────── PHASE 3 (1-2 sprints) ──────────┐
│ Power-user / new write & query modes       │
│  ├─ Branching (UI + API wiring)           │
│  ├─ Server-side `copy_from_namespace`     │
│  ├─ Aggregations: Sum/Min/Max/Avg/Quantile│
│  ├─ Fuzzy / ContainsAnyToken operators    │
│  ├─ kNN exact + SparseKNN                 │
│  ├─ Schema flags: regex/glob/fuzzy        │
│  └─ Multi-vector columns                  │
└────────────────────────────────────────────┘
                       │
                       ▼
┌─────────── PHASE 4 (backlog) ──────────────┐
│ Hybrid + Backups + advanced rank_by        │
│  ├─ Hybrid search (multi_query + RRF)     │
│  ├─ Re-ranker integration (optional)      │
│  ├─ Backup/restore workflow               │
│  └─ Saturate/Decay/Attribute/Dist ops     │
└────────────────────────────────────────────┘
```

---

## 2 · Critical bugs — fix before anything else

| # | Bug | Location | Symptom | Fix |
|---|-----|----------|---------|-----|
| B1 | `RankingExpressionBuilder` emits ops the API doesn't recognize (`Add/Sub/Mul/Div/Log/Exp/Abs/Min/Max/Pow/Sqrt`) | `components/documents/RankingExpressionBuilder.tsx:39-51` | API errors on advanced rank_by builds | Replace operator list with docs-valid ops only: `Sum`, `Product`, `Max`, plus `Saturate`/`Decay`/`Attribute`/`Dist` once added |
| B2 | `offset` param sent but Turbopuffer "has not exposed yet" (query.md:1232) | `services/documentService.ts:78,101` | Silent no-op; users think pagination is offset-based | Remove `offset`; rely on cursor + filter-by-id pagination |
| B3 | `listNamespacesFromAllRegions` hard-codes `page_size: 1000` with no `next_cursor` traversal | `services/namespaceService.ts:250` | >1000 namespaces per region silently dropped | Loop on `next_cursor` until empty |
| B4 | `loadMoreForPrefix` calls `listNamespacesFromAllRegions` WITHOUT prefix | `stores/namespacesStore.ts:500` | Tree expansion fetches the wrong page | Pass `prefix` through |
| B5 | `getNamespaceById` fabricates `created_at: new Date().toISOString()` | `services/namespaceService.ts:138-160` | Misleading "created today" on every namespace | Drop the fake field; show nothing or "—" |
| B6 | Mixed-vector batch rejected client-side; docs allow vector-optional namespaces | `services/documentService.ts:157-162` | Valid namespaces fail to upsert | Remove client check or relax to "if namespace has vector indexes" |

---

## 3 · Gap matrix — full picture

```
┌────────────────────────┬──────────────────────────────┬───────────────────────┬──────┐
│ Area                   │ API offers                   │ App exposes           │ Pri  │
├────────────────────────┼──────────────────────────────┼───────────────────────┼──────┤
│ Regions                │ 13 regions                   │ 8 regions             │ P0   │
│ Consistency            │ strong | eventual            │ raw mode only         │ P1   │
│ Pinning                │ PATCH metadata.pinning       │ —                     │ P1   │
│ Warm cache             │ GET /hint_cache_warm         │ —                     │ P1   │
│ Recall debug           │ POST /_debug/recall          │ —                     │ P3   │
│ Hard limits            │ documented                   │ no validators         │ P2   │
│                        │                              │                       │      │
│ Write: upsert          │ rows + columns + cond.       │ rows only             │ P1   │
│ Write: patch           │ patch_rows / patch_columns   │ patch_columns only    │ P2   │
│ Write: conditional     │ *_condition + $ref_new       │ —                     │ P2   │
│ Write: patch_by_filter │ + allow_partial              │ —                     │ P2   │
│ Write: copy_from_ns    │ same/cross region + org      │ typed, never called   │ P2   │
│ Write: branch_from_ns  │ COW clone                    │ —                     │ P2   │
│ Write: return_aff_ids  │ + rows_upserted etc          │ ignored               │ P2   │
│ Write: vector base64   │ encoded float32              │ raw number[][]        │ P3   │
│ Write: multi-vector    │ up to 2 named vectors        │ single "vector" field │ P2   │
│ Write: CMEK encryption │ encryption.cmek block        │ typed, never used     │ P3   │
│                        │                              │                       │      │
│ Query: kNN exact       │ ["v","kNN",vec]              │ —                     │ P2   │
│ Query: SparseKNN       │ sparse vector ranking        │ —                     │ P3   │
│ Query: limit.per       │ diversification              │ —                     │ P2   │
│ Query: exclude_attrs   │ list                         │ —                     │ P2   │
│ Query: multi_query     │ queries[]                    │ raw mode only         │ P2   │
│ Query: aggregations    │ Count/Sum/Min/Max/Avg/...    │ Count only            │ P2   │
│ Query: group_by ops    │ + ForEachUnique              │ plain attr only       │ P3   │
│ Query: top_k semantics │ alias for limit.total        │ uses legacy top_k     │ P3   │
│                        │                              │                       │      │
│ Filter: Fuzzy + edit   │ Fuzzy(value, edit, min_chrs)│ —                     │ P2   │
│ Filter: ContainsAnyTok │ + last_as_prefix             │ —                     │ P2   │
│ Filter: Contains/NotC. │ single-value array contains  │ collapsed to Cont.Any│ P3   │
│ Filter: null/missing   │ Eq null, NotEq null          │ no operator           │ P3   │
│                        │                              │                       │      │
│ Rank_by: Saturate      │ score saturation             │ —                     │ P3   │
│ Rank_by: Decay         │ time/distance decay          │ —                     │ P3   │
│ Rank_by: Attribute     │ literal attribute ref        │ —                     │ P3   │
│ Rank_by: Dist          │ raw distance access          │ —                     │ P3   │
│                        │                              │                       │      │
│ Schema: regex flag     │ index for Regex filter       │ —                     │ P2   │
│ Schema: glob flag      │ index for Glob filter        │ —                     │ P2   │
│ Schema: fuzzy flag     │ index for Fuzzy filter       │ —                     │ P2   │
│ Schema: sparse vector  │ {}f16 + sparse_knn block     │ —                     │ P3   │
│ Schema: distance_metric│ at namespace create          │ hard-coded cosine     │ P1   │
│                        │                              │                       │      │
│ FTS: Fuzzy in rank_by  │ docs L322-338                │ —                     │ P2   │
│ FTS: pre_tokenized in  │ []string query input         │ always sends string   │ P2   │
│ FTS: BM25 field weight │ Product boosting             │ tracked, not applied  │ P2   │
│                        │                              │                       │      │
│ Hybrid: multi_query    │ queries=[v,bm25]             │ —                     │ P2   │
│ Hybrid: RRF fusion     │ client-side, k=60            │ types only, dead code │ P2   │
│ Hybrid: weighted fus.  │ —                            │ enum only             │ P2   │
│ Hybrid: re-ranker      │ Cohere/Voyage/etc            │ —                     │ P3   │
│                        │                              │                       │      │
│ Branching              │ branch_from constant-time    │ —                     │ P2   │
│ Backups                │ scheduled cross-region copy  │ —                     │ P3   │
│                        │                              │                       │      │
│ Auth: isReadOnly       │ NOT in API (client-only)     │ called "permission"   │ P1   │
└────────────────────────┴──────────────────────────────┴───────────────────────┴──────┘
```

---

## 4 · Architecture — current vs target

### 4.1 Write paths

```
       CURRENT                              TARGET
─────────────────────────────         ───────────────────────────────
                                                                  
  upsertDocuments()                    upsertDocuments({                
    └─ upsert_columns only                upsert_rows | upsert_columns,
                                          condition?,                   
  patchDocument()                         distance_metric,              
    └─ patch_columns only                 return_affected_ids? })       
                                                                       
  deleteDocuments()                    patchDocuments({                 
    └─ deletes: [id]                      patch_rows | patch_columns,   
  deleteByFilter()                        condition?,                   
    └─ delete_by_filter                   patch_by_filter?,             
                                          patch_by_filter_allow_partial?
  copyFromNamespace()                     return_affected_ids? })       
    └─ TYPED BUT UNUSED                                                 
                                       deleteDocuments({                
                                          deletes | delete_by_filter   
                                          + allow_partial,             
                                          condition? })                
                                                                       
                                       copyFrom({ source_ns,            
                                          source_region?,               
                                          source_api_key? })            
                                                                       
                                       branchFrom({ source_ns })        
```

### 4.2 Query path

```
                ┌──────────────────────────────────┐
                │  CURRENT documentService.query() │
                ├──────────────────────────────────┤
                │  top_k                           │
                │  rank_by                         │  ◄── only ANN | BM25 trees
                │  filters                         │
                │  include_attributes              │
                │  consistency  (raw mode only)    │
                │  aggregate_by  (count only)      │
                │  group_by      (plain attr)      │
                │  offset        ← REMOVE (no-op)  │
                └──────────────────────────────────┘
                                  │
                                  ▼
                ┌──────────────────────────────────┐
                │  TARGET documentService.query()  │
                ├──────────────────────────────────┤
                │  rank_by: ANN | kNN | SparseKNN  │
                │           | BM25 | Saturate      │
                │           | Decay | Attribute    │
                │           | Dist | Product(...)  │
                │  filters: + Fuzzy +              │
                │           ContainsAnyToken +     │
                │           last_as_prefix         │
                │  limit:   { total, per? }        │
                │  include_attributes              │
                │  exclude_attributes              │  ◄── NEW
                │  consistency: strong | eventual  │  ◄── UI control
                │  aggregate_by: Count | Sum |     │
                │     Min | Max | Avg | Quantile | │
                │     CountDistinct                │
                │  group_by: + ForEachUnique       │
                └──────────────────────────────────┘
                                  │
                                  ▼
                ┌──────────────────────────────────┐
                │  multiQuery() — NEW              │
                │  queries: [vectorQ, bm25Q, ...]  │  ◄── enables hybrid
                │  returns: result.results[]       │
                └──────────────────────────────────┘
```

### 4.3 Namespace flow with new actions

```
                ┌─────────────────┐
                │  NamespaceList  │
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
  ┌──────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────┐
  │ Open     │   │ Branch...  │   │ Pin /    │   │ Warm cache   │
  │ documents│   │ (NEW)      │   │ Unpin    │   │ (NEW)        │
  └──────────┘   └─────┬──────┘   │ (NEW)    │   └──────┬───────┘
                       │          └────┬─────┘          │
                       ▼               ▼                ▼
                  branch_from     PATCH metadata    GET hint_cache_warm
                  → instant COW   pinning.replicas  → ack
                                  utilization badge
```

---

## 5 · Schema model — current vs target

```
                       CURRENT                                          TARGET
─────────────────────────────────────────────       ─────────────────────────────────────────────

Attribute flags:                                    Attribute flags:
  filterable: true|false                              filterable: true|false
  full_text_search: true|object                       full_text_search: true|object
                                                      regex: true|false              ◄── NEW
                                                      glob:  true|false              ◄── NEW
                                                      fuzzy: true|false              ◄── NEW
                                                                                   
Vector types:                                       Vector types:
  [N]f32                                              [N]f32
  [N]f16                                              [N]f16
                                                      {}f16  + sparse_knn{}          ◄── NEW
                                                                                   
Vectors per namespace: 1                            Vectors per namespace: up to 2  ◄── NEW

distance_metric: hard-coded cosine_distance         distance_metric: user-selectable
                                                      cosine_distance | euclidean_squared
                                                                                   
filterable auto-flip:                               filterable auto-flip:
  full_text_search → false                            full_text_search → false
                                                      regex|glob|fuzzy → false       ◄── NEW
```

---

## 6 · Hybrid search — what's there vs what's needed

```
                EXISTS                            MISSING
   ┌──────────────────────────┐      ┌──────────────────────────────┐
   │ types/unifiedQuery.ts    │      │ documentService.multiQuery() │
   │   rankFusion: 'rrf'|'w'  │      │   ↓ no SDK call ever made    │
   │ createHybridQuery()      │      │                              │
   │   ↓ never imported       │      │ RRF client-side (k=60)       │
   │   (dead code)            │      │   ↓ no implementation        │
   │                          │      │                              │
   │ Monaco snippet           │      │ Weighted fusion              │
   │   "queries: [...]"       │      │   ↓ enum only                │
   │   in RawQueryBar.tsx     │      │                              │
   └──────────────────────────┘      │ Dual-result rendering        │
                                     │   ↓ DocumentsTable assumes   │
                                     │      single list             │
                                     │                              │
                                     │ Hybrid builder UI            │
                                     │   ↓ VectorSearchInput +      │
                                     │      BM25ConfigPanel are     │
                                     │      mutually exclusive      │
                                     │                              │
                                     │ Re-ranker integration        │
                                     │   ↓ Cohere/Voyage/Mixedbread │
                                     └──────────────────────────────┘
```

**Recommendation:** when this lands, build it end-to-end (UI builder → SDK call → fusion → rendering) in a single PR. Half-shipped hybrid is worse than none.

---

## 7 · Branching — proposed flow

```
       USER ACTION                          API CALL                       RESULT
─────────────────────────────       ────────────────────────────       ───────────────────────
                                                                       
  Right-click ns "prod-users"   →   POST /v2/namespaces/{new_ns}   →   New namespace
  "Branch as..." → "test-1"        body: { branch_from:                created instantly
                                            "prod-users" }              (COW; no copy cost)
                                                                       
  Show in namespace tree as:                                          
    prod-users                                                        
    ├─ test-1   [branch]    ◄── badge in NamespaceList                
    └─ test-2   [branch]                                              
                                                                       
  Delete branch → identical to delete namespace                        
                  (no special branch-delete API)                       
```

---

## 8 · Per-area action list

### 8.1 Connections / Auth                                   `[P1]`

| Action | File | Notes |
|--------|------|-------|
| Add `aws-ca-central-1`, `aws-eu-west-2`, `aws-sa-east-1`, `gcp-us-east1`, `gcp-europe-west1` | `src/types/connection.ts:70-87` | XS — array literal |
| Rename `isReadOnly` UX as "Mark as read-only (UI guard)" with disclosure that it's client-side only | `connections/NewConnectionForm.tsx`, `services/permissionService.ts` | Reframe; keep the safety toggle |
| Optional: capability probe on test (`list namespaces` → write to throwaway ns) | `connections/ConnectionTestBanner.tsx` | Surfaces real key reach |

### 8.2 Namespaces                                            `[P1]`

| Action | File | Notes |
|--------|------|-------|
| Cursor-traverse list_namespaces until exhausted | `services/namespaceService.ts:250` | Bug B3 |
| Pass `prefix` to `listNamespacesFromAllRegions` from tree expansion | `stores/namespacesStore.ts:500` | Bug B4 |
| Drop fabricated `created_at` | `services/namespaceService.ts:138-160` | Bug B5 |
| Show `pinning` block + utilization badge in NamespaceList | `components/namespaces/NamespaceList.tsx` | Reads `metadata.pinning` |
| Add "Pin / Unpin" with replica selector | new dialog | `PATCH metadata.pinning` |
| Add "Warm cache" action in context menu | new action | `GET /hint_cache_warm` |
| Add "Branch from..." action (Phase 3) | new dialog | `branch_from` write |

### 8.3 Schema / Vectors                                      `[P1]`

| Action | File | Notes |
|--------|------|-------|
| Add `distance_metric` selector at namespace create | `components/schema/StandaloneSchemaDesigner.tsx` | cosine vs euclidean |
| Add `regex` / `glob` / `fuzzy` flags to attribute schema + auto-flip filterable | `components/schema/shared/AddAttributeDialog.tsx`, `SchemaAttributeCard.tsx`, `src/types/namespace.ts:35-39` | mirror FTS flow |
| Allow second vector column (multi-vector) | schema designer | Up to 2 per namespace |
| Sparse vector `{}f16 + sparse_knn` (Phase 3+) | schema designer | New type entry |
| Inline limit validation: dims ≤ 10752, attr count ≤ 1024 | `StandaloneSchemaDesigner.tsx:137` | warn before submit |

### 8.4 Writes                                                `[P1]`

| Action | File | Notes |
|--------|------|-------|
| Stop rejecting mixed-vector batches | `services/documentService.ts:157-162` | Bug B6 |
| Tighten `vector` field detection (declared vector attrs only) | `services/documentService.ts:204-215` | Avoid false-positives on custom names |
| Add `return_affected_ids` toggle + parse `rows_upserted/patched/deleted/remaining` from response | `services/documentService.ts:178,224,249,274` | Show in status bar |
| Support `delete_by_filter_allow_partial` | `services/documentService.ts:270-272` | Already typed |
| Wire `copy_from_namespace` (server-side copy) into a "Copy from..." action | new dialog | Already typed, never called |
| Add `branch_from_namespace` for branching action | new dialog | Phase 3 |
| Conditional writes (`upsert_condition` / `patch_condition` / `delete_condition` with `$ref_new`) | future raw-mode + advanced UI | Phase 3 |
| `patch_rows` mode | `services/documentService.ts:221` | Phase 3 |
| `patch_by_filter` + `allow_partial` | new method | Phase 3 |

### 8.5 Query / Filters                                       `[P0 → P2]`

| Action | File | Notes |
|--------|------|-------|
| Remove `offset` param | `services/documentService.ts:78,101` | Bug B2 |
| Drop Add/Sub/Mul/Div/Log/Exp/Abs/Pow/Sqrt from rank_by UI | `components/documents/RankingExpressionBuilder.tsx:39-51` | Bug B1; replace with valid ops |
| Add consistency selector (strong / eventual) to query toolbar | `components/documents/FilterBar/*` | `documentService.ts:43` already passes through |
| Add `exclude_attributes` field next to `include_attributes` | query builder | NEW |
| Aggregations: add Sum / Min / Max / Avg / Quantile / CountDistinct | `components/documents/AggregationsPanel.tsx:13-19` | hardcoded to count today |
| Filter: add `Fuzzy` with `max_edit_distance` / `min_query_chars` | `FilterBuilder.tsx`, `filterDescriptions.ts`, `unifiedQueryConverter.ts` | NEW |
| Filter: add `ContainsAnyToken` + `last_as_prefix` toggle | same files | NEW |
| Filter: add null/exists operator (`Eq null` / `NotEq null`) | same files | datetime `Lt` matches null — add UX warning |
| Map array-equals to `Contains` (not always `ContainsAny`) | `filterConversion.ts:28-38` | precision fix |
| Rank-by: add `Saturate`, `Decay`, `Attribute`, `Dist` ops | `RankingExpressionBuilder.tsx` | replace invalid ops with these |
| Add kNN exact mode toggle | `VectorSearchInput.tsx` | Phase 3 |
| Switch `top_k` to `limit.total` form; expose `limit.per` | `documentService.ts:37` | top_k still works but legacy |

### 8.6 FTS                                                   `[P2]`

| Action | File | Notes |
|--------|------|-------|
| Send `[]string` for BM25 query when tokenizer = `pre_tokenized_array` | `stores/documentsStore.ts:1228-1240` | Currently always sends string |
| Enforce `pre_tokenized_array` constraint validation (forbids language, stemming, remove_stopwords, case_sensitive=false) | `components/schema/shared/FullTextSearchConfig.tsx:42-121` | Block in UI |
| Apply `weight` per field in BM25 multi-field combine | `stores/documentsStore.ts:1228-1234` | `weight` is tracked but never emitted |
| Add `ascii_folding` helper text for latin-script users | `FullTextSearchConfig.tsx:115-120` | doc tooltip |
| Verify `remove_stopwords` default = `false` (flipped Jan 2026) | `FullTextSearchConfig.tsx` | Match current docs |

### 8.7 Hybrid search                                         `[P2]`

| Action | File | Notes |
|--------|------|-------|
| Build `multi_query` SDK call | `services/documentService.ts` (new method) | foundation |
| Build RRF (k=60) and weighted fusion clients | `utils/rankFusion.ts` (new) | client-side |
| Hybrid query builder (vector + BM25 simultaneously) | new `HybridSearchBuilder.tsx` | replaces mutually-exclusive `SearchMode` |
| Dual-result rendering | `DocumentsTable.tsx` | currently single-list |
| Delete dead `createHybridQuery()` once real builder lands | `src/types/unifiedQuery.ts:305-322` | cleanup |
| Re-ranker provider hookups (Cohere/Voyage/Mixedbread/ZeroEntropy) | future | Phase 4 |

### 8.8 Pinning / Warm cache / Recall                         `[P1 / P3]`

| Action | File | Notes |
|--------|------|-------|
| Read `pinning` from `getNamespaceMetadata` response | `services/namespaceService.ts:304-310` | already returned |
| "Pin / Unpin" action with replica count input | new action | `PATCH metadata.pinning` |
| Pinned badge + utilization gauge in NamespaceList | `components/namespaces/NamespaceList.tsx` | |
| "Warm cache" context menu action | new | `GET /hint_cache_warm` |
| "Evaluate recall" button in SchemaPage | new | `POST /_debug/recall` |

### 8.9 Limits & guardrails                                   `[P2]`

| Constant | Where to enforce |
|----------|------------------|
| Attribute count ≤ 1024 | schema designer |
| Vector dims ≤ 10752 | dim input |
| Attribute value ≤ 8 MiB | upsert preflight |
| Document size ≤ 64 MiB | import dialog |
| FTS query ≤ 8192 bytes | BM25 input |
| `limit.total` ≤ 10000 | query builder |
| Concurrent queries ≤ 16 | rate-limit warning |
| Write batch ≤ 512 MB | import dialog |

### 8.10 Branching / Copy / Backups                           `[P2 / P3]`

| Action | Surface |
|--------|---------|
| "Branch from..." in namespace context menu | uses `branch_from` (constant-time COW) |
| "Copy from..." (cross-region / cross-org) | uses `copy_from_namespace` + `source_region` + `source_api_key` |
| Backup workflow: scheduled per-prefix copy + retention cleanup | New "Backups" page (Phase 4 — large) |

---

## 9 · Out of scope

| Topic | Why skip |
|-------|----------|
| Audit logs | No client API; configured via dashboard, streamed to customer SIEM |
| Pricing / usage log | Static changelog; no programmatic feed |
| CMEK key entry form | Dashboard-managed; error-prone in a GUI. Optional: read-only "CMEK: \<key\>" badge if metadata exposes it |
| SSO | Dashboard-only |
| VDP / Enterprise tier marketing | Informational, no API |
| Highlighting / Late interaction / Nested attributes | Roadmap, no API yet |

---

## 10 · Risk register

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Risk                                Mitigation                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Half-shipped hybrid creates a   →   Land hybrid as one atomic PR;       │
│  worse UX than none                 keep types until shipped            │
│                                                                         │
│ Pinning replica change has cost →   Confirm dialog with documented      │
│  implications                       cost model                          │
│                                                                         │
│ `branch_from` deletes propagate →   Show "this is a branch of X"        │
│  surprise users                     header in DocumentsPage             │
│                                                                         │
│ `eventual` consistency surprises →  Default remains strong; selector    │
│  with stale reads                   shows tooltip "may return stale"    │
│                                                                         │
│ Removing invalid rank_by ops    →   Add migration in localStorage:      │
│  breaks saved queries               drop unknown ops on load with toast │
│                                                                         │
│ `isReadOnly` reframing might    →   Banner explains new label on first  │
│  confuse existing users             load                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11 · Rollout

```
v0.3.0  ─── Phase 1   (P0 fixes + regions)               1 PR
v0.4.0  ─── Phase 2   (pinning, warm-cache, consistency, M PRs
                       limit guards, distance_metric)    
v0.5.0  ─── Phase 3   (branching, server-side copy,      M PRs
                       new filter ops, multi-vector,
                       schema flags, aggregations)
v0.6.0  ─── Phase 4   (hybrid end-to-end, advanced       L PRs
                       rank_by ops, backups)
```

---

## 12 · Open questions

1. Hybrid: do we ship RRF only, or both RRF + weighted at once?
2. Pinning UI: dialog or inline gauge? Replica counts as a free-form number or preset {1, 2, 4, 8}?
3. `isReadOnly`: rename to "Read-only (UI guard)" or remove entirely now that we know it's not server-enforced?
4. Branching: show branches as siblings in tree, or as nested children under source?
5. Backups: out of scope for v1, or stub a "Coming soon" panel?

---

## 13 · Source audit transcripts

Each row of the gap matrix is backed by a parallel doc-vs-code audit (12 agents, 36 doc files, 8.6k lines). Per-area transcripts available on request.

---

## 14 · Deferred items log

Tracking what's been pushed past the current PR series and why. Each block names the cause and the unblock condition.

### 14.1 · SDK gap items — UNBLOCKED by 1.22.0 upgrade

```
┌────────────────────────────┬─────────────────────────────────────────────┐
│ Item                       │ Status after SDK 1.22.0 (was 0.10.18)       │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Namespace pinning          │ ✓ Now in SDK: PinningConfig type,           │
│  (RFC §8.8, §8.2)          │   NamespaceMetadata.Pinning with utilization│
│                            │   status, ns.updateMetadata() method,       │
│                            │   NamespaceMetadataPatch with `pinning?:    │
│                            │   boolean | PinningConfig | null`           │
│                            │   → ready for one-PR follow-up              │
│                            │                                             │
│ Namespace branching        │ ✓ Now in SDK: BranchFromNamespaceParams     │
│  (RFC §8.4, §8.10, §7)     │   type, `branch_from_namespace?: ...` on    │
│                            │   NamespaceWriteParams                       │
│                            │   → ready for one-PR follow-up              │
│                            │                                             │
│ Cross-region copy          │ ✓ Now in SDK: CopyFromNamespaceParams as a  │
│  (RFC §8.4, §8.10)         │   union of string | { source_namespace,     │
│                            │   source_api_key?, source_region? }         │
│                            │   → extend existing CopyNamespaceDialog     │
│                            │                                             │
│ Multi-vector columns       │ Partial: Columns shape still has named      │
│  (RFC §8.3, §5)            │   `vector?` field, but `[k: string]:` catch │
│                            │   -all accepts arbitrary vector columns.    │
│                            │   No new dedicated type. Schema designer    │
│                            │   could still emit them via attribute       │
│                            │   schema. Verify against API behavior.      │
│                            │                                             │
│ New rank_by ops surfaced   │ ✓ Bonus: SaturateParams, DecayParams,       │
│  in 1.22.0                 │   Bm25ClauseParams now typed → unblocks the │
│  (RFC §8.5)                │   RankingExpressionBuilder redesign         │
│                            │                                             │
│ Per-operator filter opts   │ ✓ Bonus: ContainsAllTokensFilterParams,     │
│  (last_as_prefix etc.)     │   ContainsAnyTokenFilterParams now typed    │
│  (RFC §8.5)                │   → unblocks last_as_prefix toggle UX       │
│                            │                                             │
│ Limit (limit.per)          │ ✓ Bonus: `Limit` type now exported          │
│  (RFC §4.2)                │                                             │
│                            │                                             │
│ Aggregations expansion     │ ✓ Bonus: AggregationGroup type now exported │
│  (Min/Max/Avg/Quantile/    │   → verify which functions are wired        │
│   CountDistinct)           │                                             │
└────────────────────────────┴─────────────────────────────────────────────┘

Upgrade landed in Phase 5 (`5.1` SDK bump commit). All eight items above
have follow-up PR slots open. The original four "blocked" items can each be
shipped as small dedicated PRs on top of the patterns already established
(pinning mirrors warmCache; branching mirrors copy; cross-region extends
the existing CopyNamespaceDialog; multi-vector touches AddAttributeDialog).
```

### 14.2 · Deferred for UX / scope discipline

```
┌────────────────────────────┬─────────────────────────────────────────────┐
│ Item                       │ Why deferred                                │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Conditional writes         │ Powerful but rarely-used. $ref_new requires │
│  (upsert_condition,        │ careful UI scaffolding (lets writes refer to│
│  patch_condition,          │ existing-row values mid-update). Better as  │
│  delete_condition)         │ a focused PR with `return_affected_ids` and │
│                            │ patch_by_filter in the same flow.           │
│                            │                                             │
│ patch_rows mode            │ Currently using patch_columns only.         │
│                            │ Same PR as conditional writes.              │
│                            │                                             │
│ patch_by_filter            │ Same PR as conditional writes.              │
│  + allow_partial           │                                             │
│                            │                                             │
│ return_affected_ids /      │ Today: we display rows_affected only.       │
│  rows_upserted/patched/    │ Plumbing the full counts is a status-bar    │
│  deleted/remaining surfacing│ refresh — small but cohesive PR.            │
│                            │                                             │
│ Explain query UI panel     │ API-layer plumbing landed in Slice 3b.      │
│  (RFC §4.2 sidebar)        │ UI needs to faithfully mirror the full      │
│                            │ query-build path (filters + rank_by +       │
│                            │ aggregations + group_by) which today is     │
│                            │ inlined in documentsStore.loadDocuments.    │
│                            │ Better to refactor query-build into a       │
│                            │ shared helper first, then add the panel.    │
│                            │                                             │
│ exclude_attributes UI      │ API-layer plumbing landed in Slice 3a.      │
│                            │ Most-asked case is auto-exclude vectors     │
│                            │ which is a behavior change worth its own PR.│
│                            │                                             │
│ limit.per UI               │ API-layer plumbing landed in Slice 3a.      │
│                            │ Needs UX next to group_by — diversification │
│                            │ only makes sense together.                  │
│                            │                                             │
│ last_as_prefix toggle      │ Filter-options 4-tuple support landed in    │
│  on ContainsAllTokens /    │ Slice 3a. Needs per-operator option panels  │
│  ContainsAnyToken / BM25   │ in FilterBuilder — wider design change.     │
│                            │                                             │
│ Fuzzy custom edit ladder   │ Default ladder ships in Slice 3a            │
│                            │ ({min_query_chars: 3,6} / {distance: 0,1}). │
│                            │ Custom multi-tier laddering needs the same  │
│                            │ per-operator option panel design.           │
│                            │                                             │
│ Aggregations: Min, Max,    │ Server roadmap items per roadmap.md         │
│  Avg, Quantile,            │ ("Aggregates: distinct, min, max — Up Next")│
│  CountDistinct             │ — would API-error today.                    │
│                            │                                             │
│ Backups workflow           │ Per Open Question #5 ("not needed now").    │
│  (RFC §8.10)               │                                             │
└────────────────────────────┴─────────────────────────────────────────────┘
```

### 14.3 · Phase status snapshot

```
Phase 1 (P0 fixes + regions)              ████████████████ shipped v0.3.0
Phase 2 (P1 surfaces)                     ██████████████░░ shipped v0.4.0
                                                            (pinning deferred)
Phase 3a (low-risk additions)             ████████████████ shipped v0.5.0a
Phase 3b (write/query additions)          ████████████░░░░ shipped v0.5.0b
                                                            (branching, multi-vec
                                                             deferred; copy +
                                                             recall + explain-API
                                                             shipped)
Phase 4  (hybrid search end-to-end)       ████████████████ shipped v0.6.0
                                                            (RRF, multi_query,
                                                             dual-input UI)
Phase 5  (SDK upgrade 0.10.18 → 1.22.0)   ████████████████ shipped
                                                            UNBLOCKS pinning,
                                                            branching, cross-
                                                            region copy, multi-
                                                            vector, plus bonus:
                                                            Saturate/Decay/etc.
Phase 6+ (SDK-unblocked follow-ups)       ░░░░░░░░░░░░░░░░ pending — small,
                                                            independent PRs each
Phase 3.5 (conditional writes etc)        ░░░░░░░░░░░░░░░░ pending follow-up
```
