---
url: "https://turbopuffer.com/docs/limits"
title: "Limits"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Limits

There isn't a limit or performance metric we can't improve by an order of
magnitude when prioritized. If you expect to brush up against a limit or you
are limited by present performance, [contact us](https://turbopuffer.com/contact).

| Metric | Observed in production | Production limits (current) |
| --- | --- | --- |
| Max documents (global) | 4T+ @ 15PB+ | Unlimited |
| Max documents (queried simultaneously) | [100B+ @ 10TB](https://turbopuffer.com/blog/ann-v3) | Unlimited |
| Max documents (per namespace) | 500M+ @ 2TB | 500M @ 2TB |
| Max number of namespaces | 250M+ | Unlimited |
| Max number of [pinned namespaces](https://turbopuffer.com/docs/pinning) | 256 | Contact us for custom |
| Max vector columns per namespace |  | 2 |
| Max dimensions for dense vectors |  | 10,752 |
| Max total dimensions for sparse vectors | 30,522 | Unlimited |
| Max dimensions per sparse vector |  | 1,024 |
| Max inactive time in cache | hours | Contact us for custom |
| Max write throughput (global) | 10M+ writes/s @ 32GB/s | Unlimited |
| Max write throughput (per namespace) | 32k+ writes/s @ 64MB/s | 10k writes/s @ 32 MB/s |
| Max namespace copy throughput | 72 MB/s | Contact us if bottlenecked |
| Number of branches | 1M+ | Unlimited |
| Max upsert batch request size |  | 512 MB |
| Max rows affected by [patch by filter](https://turbopuffer.com/docs/write#patch-by-filter) |  | 50k |
| Max rows affected by [delete by filter](https://turbopuffer.com/docs/write#delete-by-filter) |  | 5M |
| Max ingested, unindexed data |  | 2 GB |
| Max queries (global) | 25k+ queries/s | Unlimited |
| Max queries (per namespace) | 1k+ queries/s | 1k+ queries/s |
| Max queries in a [multi-query request](https://turbopuffer.com/docs/query#param-queries) |  | 16 |
| Max concurrent queries per namespace |  | 16 (100s of queries/s) |
| Max read replicas | 3 | Unlimited |
| Vector search recall@10 | 90-100% | 90-100% |
| Max attribute value size |  | 8 MiB |
| Max filterable value size |  | 4 KiB |
| Max document size |  | 64 MiB |
| Max id size |  | 64 bytes |
| Max attribute name length |  | 128 bytes |
| Max attribute names per namespace |  | 1,024 |
| Max namespace name length |  | 128 bytes |
| Max full-text query length | 8,192 | 1,024 |
| Max [limit.total](https://turbopuffer.com/docs/query#param-limit) | 10k | 10k |
| Max aggregation groups per query | 10k | 10k |

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