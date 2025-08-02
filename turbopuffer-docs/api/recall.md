# Evaluate recall

## POST /v1/namespaces/:namespace/_debug/recall

Evaluate recall for documents in a namespace.

When you call this endpoint, it selects num random vectors that were previously inserted. For each of these vectors, it performs an ANN index search as well as a ground truth exhaustive search.

Recall is calculated as the ratio of matching vectors between the two search results. This endpoint also returns the average number of results returned from both the ANN index search and the exhaustive search (ideally, these are equal).

Example of 90% recall@10:

```
ANN                          Exact
┌────────────────────────────┐ ┌────────────────────────────┐
│id: 9, score: 0.12         │ │id: 9, score: 0.12         │
├────────────────────────────┤ ├────────────────────────────┤
│id: 2, score: 0.18         │ │id: 2, score: 0.18         │
├────────────────────────────┤ ├────────────────────────────┤
│id: 8, score: 0.29         │ │id: 8, score: 0.29         │
├────────────────────────────┤ ├────────────────────────────┤
│id: 1, score: 0.55         │ │id: 1, score: 0.55         │
├────────────────────────────┤ ├────────────────────────────┤
│id: 0, score: 0.90         │ │id: 4, score: 0.85         │ ← Mismatch
└────────────────────────────┘ └────────────────────────────┘
```

We use this endpoint internally to measure recall. See this blog post for more.

### Parameters

**num** number (default: 25)

number of searches to run.

**top_k** number (default: 10)

search for top_k nearest neighbors.

**filters** object (optional)

filter by attributes, see filtering parameters for more info.

**queries** array[float] (default: sampled)

use specific query vectors for the measurement. if omitted, sampled from index.

### Response interpretation

* A recall of 1.0 means that 100% of the ideal results (from the exhaustive search) were also present in the approximate ANN results
* avg_ann_count equals avg_exhaustive_count, meaning the approximate search returned the same number of results as the exhaustive