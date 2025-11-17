---
url: "https://turbopuffer.com/docs/tradeoffs"
title: "Tradeoffs"
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

# Tradeoffs

Every technology has tradeoffs. This document outlines turbopuffer's key design
choices to help inform your evaluation:

- **High latency, high throughput writes.** turbopuffer prioritizes simplicity, durability, and scalability by using object storage as a write-ahead log, keeping nodes stateless. While this means writes take up to 200ms to commit, the system supports thousands of writes per second per namespace. Despite this latency, our consistent read model makes documents visible to queries faster than eventually consistent search engines. This architecture choice enables our cost-effective scaling and is particularly well-suited for search workloads.
- **Focused on first-stage retrieval.** turbopuffer focuses on efficient first-stage retrieval, providing a simple API to filter millions of documents down to a smaller candidate set. In a 2nd stage, you can then refine and rerank results using familiar programming languages, making your search logic easier to develop and maintain. Learn more about this approach in our [Hybrid Search](https://turbopuffer.com/docs/hybrid-search) guide. We've found that it's difficult to maintain search applications in mountains of idiosyncratic query language.
- **Optimized for accuracy.** turbopuffer delivers high recall out of the box,
maintaining this quality even with complex filters. We prioritize consistent,
accurate results over configurable performance optimizations.
- **Consistent reads have a ~10ms latency floor.** turbopuffer's reads are
consistent by default, requiring object storage checks for the latest writes.
This baseline latency aligns with object storage's `GET IF-NOT-MATCH` latency and
should improve as object storage technology advances. For workloads requiring
sub-10ms latency, you can [enable eventual consistency](https://turbopuffer.com/docs/query). S3's
metadata p50=10ms p90=17ms, GCS's metadata p50=12-18ms p90=15-25ms (more region-dependent).
- **Occasional cold queries.** Since all data is not always in memory or disk,
turbopuffer will occasionally do cold queries directly on object storage and
rehydrate the cache. This means that e.g. P999 queries may be in the 100s of
milliseconds range (see cold/hot [performance](https://turbopuffer.com/) on the landing page). Our
storage layer is optimized for this use-case, and does direct ranged reads on
object storage in the fewest round-trips possible for the fastest cold
queries. Many applications can [prewarm namespaces](https://turbopuffer.com/docs/warm-cache) so
users never observe cold latency.
- **Scales to millions of namespaces.** turbopuffer scales to trillions of
documents across hundreds of millions of namespaces. While you can create
unlimited namespaces, individual namespaces have ever-expanding [size\\
guidelines](https://turbopuffer.com/docs/limits). Namespacing your data means benefiting natural data
partitioning (e.g. tenancy) for performance and cost.
- **Focused on paid customers.** For the current phase of our company we have
chosen a commercial-only model to maintain high-quality support and rapid
development. While we don't offer a free tier or open source version, you can
run turbopuffer in your own cloud-- [contact us](https://turbopuffer.com/contact/sales) for
details.

| turbopuffer excels at | turbopuffer may not currently be the best fit for |
| --- | --- |
| Large scale (100B+ documents/vectors) with lots of namespaces (tens of millions) | Low scale, free tier |
| Naturally sharded data (e.g. B2B where each tenant's data is isolated in its own namespace) | Extensive 1st-stage ranking (we encourage generating a candidate set with hybrid search and refining/re-ranking further in your own 2nd stage) |
| Cost-effectiveness | Built-in 2nd-stage re-ranking (we encourage you to do it in `{search.py,search.ts,..}`) |
| Fast cold starts | Built-in embedding (this is a few lines of code at most) |
| Reliability | Open Source |
| Hybrid search (BM25 + vector search) |  |
| Support from DB Engineers |  |
| Deploy into your VPC (BYOC) |  |
| Heavy writes (Appends, Updates and Deletes) |  |

For more details, see [Guarantees](https://turbopuffer.com/docs/guarantees), [Limits](https://turbopuffer.com/docs/limits), and [Architecture](https://turbopuffer.com/docs/architecture) pages.

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