![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Evaluate recall

===============

[Now open for all, let's get you puffin'turbopuffer is generally available, let's get you puffin'](https://turbopuffer.com/join)

Navigation
----------

[![Image 4: Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

[Pricing](https://turbopuffer.com/pricing)[Company](https://turbopuffer.com/about)[Blog](https://turbopuffer.com/blog)[Docs](https://turbopuffer.com/docs)[Contact](https://turbopuffer.com/contact)[Dashboard](https://turbopuffer.com/dashboard)[Get started](https://turbopuffer.com/join)

[Introduction](https://turbopuffer.com/docs)

[Architecture](https://turbopuffer.com/architecture)

[Guarantees](https://turbopuffer.com/docs/guarantees)

[Tradeoffs](https://turbopuffer.com/docs/tradeoffs)

[Limits](https://turbopuffer.com/docs/limits)

[Regions](https://turbopuffer.com/docs/regions)

[Roadmap & Changelog](https://turbopuffer.com/docs/roadmap)

[Security](https://turbopuffer.com/docs/security)

Guides

[Quickstart](https://turbopuffer.com/docs/quickstart)

[Vector Search](https://turbopuffer.com/docs/vector)

[Full-Text Search](https://turbopuffer.com/docs/fts)

[Hybrid Search](https://turbopuffer.com/docs/hybrid)

[Testing](https://turbopuffer.com/docs/testing)

[Performance](https://turbopuffer.com/docs/performance)

[Encryption](https://turbopuffer.com/docs/cmek)

API

[Auth & Encoding](https://turbopuffer.com/docs/auth)

[Write](https://turbopuffer.com/docs/write)

[Query](https://turbopuffer.com/docs/query)

[Schema](https://turbopuffer.com/docs/schema)

[Export](https://turbopuffer.com/docs/export)

[Warm cache](https://turbopuffer.com/docs/warm-cache)

[List namespaces](https://turbopuffer.com/docs/namespaces)

[Delete namespace](https://turbopuffer.com/docs/delete-namespace)

[Recall](https://turbopuffer.com/docs/recall)

On this page

*   [Parameters](https://turbopuffer.com/docs/recall#parameters)
*   [Examples](https://turbopuffer.com/docs/recall#examples)

POST /v1/namespaces/:namespace/_debug/recall
--------------------------------------------

Evaluate recall for documents in a namespace.

When you call this endpoint, it selects `num` random vectors that were previously inserted. For each of these vectors, it performs an ANN index search as well as a ground truth exhaustive search.

Recall is calculated as the ratio of matching vectors between the two search results. This endpoint also returns the average number of results returned from both the ANN index search and the exhaustive search (ideally, these are equal).

We use this endpoint internally to measure recall. See this [blog post](https://turbopuffer.com/blog/continuous-recall) for more.

### [](https://turbopuffer.com/docs/recall#parameters)Parameters

[](https://turbopuffer.com/docs/recall#param-num)

**num**number default: 25

number of searches to run.

* * *

[](https://turbopuffer.com/docs/recall#param-top_k)

**top_k**number default: 10

search for top_k nearest neighbors.

* * *

[](https://turbopuffer.com/docs/recall#param-filters)

**filters**object optional

filter by attributes, see [filtering parameters](https://turbopuffer.com/docs/reference/query#filter-parameters) for more info.

* * *

[](https://turbopuffer.com/docs/recall#param-queries)

**queries**array[float]default: sampled

use specific query vectors for the measurement. if omitted, sampled from index.

### [](https://turbopuffer.com/docs/recall#examples)Examples

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('recall-example-py')

# If an error occurs, this call raises a turbopuffer.APIError if a retry was not successful.
recall = ns.recall(num=5, top_k=10)
print(recall)
# NamespaceRecallResponse(avg_ann_count=10.0, avg_exhaustive_count=10.0, avg_recall=1.0)
```

How to interpret this response:

*   A recall of 1.0 means that 100% of the ideal results (from the exhaustive search) were also present in the approximate ANN results
*   `avg_ann_count` equals `avg_exhaustive_count`, meaning the approximate search returned the same number of results as the exhaustive

![Image 5: turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about)[Pricing](https://turbopuffer.com/pricing)[Press & media](https://turbopuffer.com/press)[System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-2bro3fb5j-6Ys5st9UFDrm7qXQw_S9Rw)[Docs](https://turbopuffer.com/docs)[Email](https://turbopuffer.com/contact/support)[Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

[](https://x.com/turbopuffer)[](https://www.linkedin.com/company/turbopuffer/)[](https://bsky.app/profile/turbopuffer.bsky.social)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service)[Data Processing Agreement](https://turbopuffer.com/dpa)[Privacy Policy](https://turbopuffer.com/privacy-policy)[Security & Compliance](https://turbopuffer.com/docs/security)

[* SOC2 Type 2 certified * HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")
