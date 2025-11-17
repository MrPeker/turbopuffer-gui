---
url: "https://turbopuffer.com/docs/limits"
title: "Limits"
---

[100B vectors @ 200ms p99NEW: 100B vectors @ 200ms p99 latency (opt-in beta)](https://turbopuffer.com/docs/roadmap)

## Navigation

[![Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

[Customers](https://turbopuffer.com/customers) [Pricing](https://turbopuffer.com/pricing) [Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Blog](https://turbopuffer.com/blog) [Docs](https://turbopuffer.com/docs) [Contact](https://turbopuffer.com/contact) [Dashboard](https://turbopuffer.com/dashboard) [Sign up](https://turbopuffer.com/join)

[Introduction](https://turbopuffer.com/docs)

[Architecture](https://turbopuffer.com/docs/architecture)

[Guarantees](https://turbopuffer.com/docs/guarantees)

[Tradeoffs](https://turbopuffer.com/docs/tradeoffs)

[Limits](https://turbopuffer.com/docs/limits)

[Regions](https://turbopuffer.com/docs/regions)

[Roadmap & Changelog](https://turbopuffer.com/docs/roadmap)

[Security](https://turbopuffer.com/docs/security)

[Encryption](https://turbopuffer.com/docs/cmek)

[Private Networking](https://turbopuffer.com/docs/private-networking)

[Performance](https://turbopuffer.com/docs/performance)

Guides

[Quickstart](https://turbopuffer.com/docs/quickstart)

[Vector Search](https://turbopuffer.com/docs/vector)

[Full-Text Search](https://turbopuffer.com/docs/fts)

[Hybrid Search](https://turbopuffer.com/docs/hybrid)

[Testing](https://turbopuffer.com/docs/testing)

API

[Auth & Encoding](https://turbopuffer.com/docs/auth)

[Write](https://turbopuffer.com/docs/write)

[Query](https://turbopuffer.com/docs/query)

[Namespace metadata](https://turbopuffer.com/docs/metadata)

[Export](https://turbopuffer.com/docs/export)

[Warm cache](https://turbopuffer.com/docs/warm-cache)

[List namespaces](https://turbopuffer.com/docs/namespaces)

[Delete namespace](https://turbopuffer.com/docs/delete-namespace)

[Recall](https://turbopuffer.com/docs/recall)

# Limits

There isn't a limit or performance metric we can't improve by an order of
magnitude when prioritized. If you expect to brush up against a limit or you
are limited by present performance, [contact us](https://turbopuffer.com/contact).

| Metric | Observed in production | Production limits (current) |
| --- | --- | --- |
| Max documents (global) | 1T+ @ 1PB | Unlimited |
| Max documents (queried simultaneously) | [100B+ @ 10TB](https://x.com/turbopuffer/status/1978173877571441135) | Unlimited |
| Max documents (per namespace) | 500M+ @ 2TB | 500M @ 2TB |
| Max number of namespaces | 100M+ | Unlimited |
| Max dimensions |  | 10,752 |
| Max inactive time in cache | ~1 day | Contact us for custom |
| Max write throughput (global) | 10M+ writes/s @ 32GB/s | Unlimited |
| Max write throughput (per namespace) | 32K+ writes/s @ 64MB/s | 10K writes/s @ 32 MB/s |
| Max upsert batch request size |  | 256 MB |
| Max write batch rate (per namespace) |  | 1 batch/s |
| Max rows affected by [patch by filter](https://turbopuffer.com/docs/write#patch-by-filter) |  | 500k |
| Max rows affected by [delete by filter](https://turbopuffer.com/docs/write#delete-by-filter) |  | 5M |
| Max ingested, unindexed data |  | 2 GB |
| Max queries (global) | 10K+ queries/s | Unlimited |
| Max queries (per namespace) | 1K+ queries/s | 1K+ queries/s |
| Max queries in a [multi-query request](https://turbopuffer.com/docs/query#param-queries) |  | 16 |
| Max concurrent queries per namespace |  | 16 (100s of queries/s) |
| Max read replicas | 3 | Unlimited |
| Vector search recall@10 | 90-100% | 90-100% |
| Max attribute value size |  | 8 MiB |
| Max filterable value size |  | 4KiB |
| Max document size |  | 64 MiB |
| Max id size |  | 64 bytes |
| Max attribute name length |  | 128 bytes |
| Max attribute names per namespace |  | 256 |
| Max namespace name length |  | 128 bytes |
| Max full-text query length | 8,192 | 1,024 |
| Max topk | 10K | 1.2K |
| Max aggregation groups per query | 1.2K | 1.2K |

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)

[- SOC2 Type 2 certified\\
- HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")