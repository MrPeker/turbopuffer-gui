---
url: "https://turbopuffer.com/docs/recall"
title: "Evaluate recall"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# POST /v1/namespaces/:namespace/\_debug/recall

Evaluate recall for documents in a namespace.

When you call this endpoint, it selects `num` random vectors that were
previously inserted. For each of these vectors, it performs an ANN index search
as well as a ground
truth exhaustive search.

Recall is calculated as the ratio of matching vectors between the two search
results. This endpoint also returns the average number of results returned from
both the ANN index search and the exhaustive search (ideally, these are equal).
Example of 90% recall@10:

```
             ANN                                          Exact
┌────────────────────────────┐               ┌────────────────────────────┐
│id: 9, score: 0.12          │▒              │id: 9, score: 0.12          │▒
├────────────────────────────┤▒              ├────────────────────────────┤▒
│id: 2, score: 0.18          │▒              │id: 2, score: 0.18          │▒
├────────────────────────────┤▒              ├────────────────────────────┤▒
│id: 8, score: 0.29          │▒              │id: 8, score: 0.29          │▒
┌────────────────────────────┤▒              ├────────────────────────────┤▒
│id: 1, score: 0.55          │▒              │id: 1, score: 0.55          │▒
┣─━─━─━─━─━─━─━─━─━─━─━─━─━─━┘▒   Mismatch   ┣─━─━─━─━─━─━─━─━─━─━─━─━─━─━┘▒
 id: 0, score: 0.90          ┃▒◀─────────────▶ id: 4, score: 0.85         ┃▒
┗ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ▒              ┗ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ▒
 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒               ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
```

```
       ANN              Exact
┌────────────┐ ┌────────────┐
│id:9,score:0│▒│id:9,score:0│▒
├────────────┤▒├────────────┤▒
│id:2,score:1│▒│id:2,score:1│▒
├────────────┤▒├────────────┤▒
│id:8,score:3│▒│id:8,score:3│▒
├────────────┤▒├────────────┤▒
│id:1,score:4│▒│id:1,score:4│▒
┣━━━━━━━━━━━━┫▒┣━━━━━━━━━━━━┫▒
│id:0,score:9│▒│id:4,score:8│▒
┗━━━━━━━━━━━━┛▒┗━━━━━━━━━━━━┛▒
 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒▒▒▒
         ↑ Mismatch ↑
```

We use this endpoint internally to measure recall. See this [blog\\
post](https://turbopuffer.com/blog/continuous-recall) for more.

## Request

**num** numberdefault: 25

number of searches to run.

* * *

**top\_k** numberdefault: 10

search for top\_k nearest neighbors.

* * *

**filters** objectoptional

filter by attributes, see [filtering\\
parameters](https://turbopuffer.com/docs/reference/query#filter-parameters) for more info.

* * *

**rank\_by** array

The [ranking function](https://turbopuffer.com/docs/query#param-rank_by) to evaluate recall for.
If this field is provided `num` must be either `null` or `1`.

## Response

**avg\_recall** number

The average recall across all sampled queries, expressed as a decimal between 0 and 1. A value of 1.0 indicates perfect recall (100% of exhaustive search results were found by the approximate nearest neighbour search).

**avg\_exhaustive\_count** number

The average number of results returned by the exhaustive search across all queries. This represents the ideal number of results that should be returned.

**avg\_ann\_count** number

The average number of results returned by the approximate nearest neighbor index search across all queries. In most cases this should equal `avg_exhaustive_count`.

## Examples

python

curlpythontypescriptgojavac#ruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace(f'recall-example-py')

# If an error occurs, this call raises a turbopuffer.APIError if a retry was not successful.
recall = ns.recall(num=5, top_k=10)
print(recall)
# NamespaceRecallResponse(avg_ann_count=10.0, avg_exhaustive_count=10.0, avg_recall=1.0)
```

How to interpret this response:

- A recall of 1.0 means that 100% of the ideal results (from the exhaustive search) were also present in the approximate ANN results
- `avg_ann_count` equals `avg_exhaustive_count`, meaning the approximate search returned the same number of results as the exhaustive

## Billing

Billed as queries when `avg_recall` is at least 0.9 and the namespace is not empty. The number of queries is one per sample per 100K documents, with a
minimum of `num` queries.

For example, `num=30` on a 1M document namespace is billed as 300 queries.
On a smaller namespace with under 100K documents and `num=30`, it would be 30 queries.

copy page

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Pricing](https://turbopuffer.com/pricing) [Store](https://turbopuffer.supply/) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-3v27t102a-3RynqZ5A9vuOuAo68X_wFQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml) [Events](https://turbopuffer.com/events)

[turbopuffer on Twitter](https://x.com/turbopuffer)[turbopuffer on LinkedIn](https://www.linkedin.com/company/turbopuffer/)[turbopuffer on BlueSky](https://bsky.app/profile/turbopuffer.bsky.social)[turbopuffer on YouTube](https://www.youtube.com/@turbopufferdb)

© 2026 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa.pdf) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)

Docs search

esc

## Guides

[Quickstart\\
\\
Get started with turbopuffer in minutes](https://turbopuffer.com/docs/quickstart)

[Vector Search\\
\\
Perform approximate nearest neighbor searches](https://turbopuffer.com/docs/vector)

[Full-Text Search\\
\\
Learn how to use BM25 full-text search](https://turbopuffer.com/docs/fts)

[Hybrid Search\\
\\
Combine vector and full-text search strategies](https://turbopuffer.com/docs/hybrid)

## API Docs

[Write\\
\\
Create, update, or delete documents](https://turbopuffer.com/docs/write)

[Query\\
\\
Query documents with filters and ranking](https://turbopuffer.com/docs/query)

[Auth & Encoding\\
\\
Authentication, headers, and request encoding](https://turbopuffer.com/docs/auth)

[Namespace metadata\\
\\
Get metadata about a namespace](https://turbopuffer.com/docs/metadata)