---
url: "https://turbopuffer.com/docs"
title: "Introduction"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Introduction

```
                        ╔═ turbopuffer ════════════════════════════╗
╔════════════╗          ║                                          ║░
║            ║░         ║  ┏━━━━━━━━━━━━━━━┓     ┏━━━━━━━━━━━━━━┓  ║░
║   client   ║░───API──▶║  ┃    Memory/    ┃────▶┃    Object    ┃  ║░
║            ║░         ║  ┃   SSD Cache   ┃     ┃ Storage (S3) ┃  ║░
╚════════════╝░         ║  ┗━━━━━━━━━━━━━━━┛     ┗━━━━━━━━━━━━━━┛  ║░
 ░░░░░░░░░░░░░░         ║                                          ║░
                        ╚══════════════════════════════════════════╝░
                         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
      ╔════════════╗
      ║   client   ║░
      ╚════════════╝░
       ░░░░░║░░░░░░░░
            ▼
╔═ turbopuffer ════════════╗
║  ┏━━━━━━━━━━━━━━━━━━━━┓  ║░
║  ┃    Memory/SSD      ┃  ║░
║  ┃      Cache         ┃  ║░
║  ┗━━━━━━━━┳━━━━━━━━━━━┛  ║░
║           ▼              ║░
║  ┏━━━━━━━━━━━━━━━━━━━━┓  ║░
║  ┃    Object Storage  ┃  ║░
║  ┃      (S3)          ┃  ║░
║  ┗━━━━━━━━━━━━━━━━━━━━┛  ║░
╚══════════════════════════╝░
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

turbopuffer is a fast search engine that combines vector and full-text search
using object storage, making all your data easily searchable.

Using only object storage for state and NVMe SSD with memory cache for compute,
turbopuffer scales horizontally to handle billions of documents.

The system caches only actively searched data while keeping the rest in low-cost
object storage, offering competitive pricing. Cold queries for 1 million
vectors take p90=1214ms, while warm
queries are just p50=14ms.
This architecture means it's as fast as in-memory search engines when cached, but far
cheaper to run.

Storing data in cache and object storage costs less than traditional replicated
disk systems, even for frequently accessed data.

Using object storage as the sole source of truth enables operations like
[branching](https://turbopuffer.com/docs/branching) — a copy-on-write clone of any namespace, created
in constant time regardless of size, with fully independent reads and writes
afterward.

turbopuffer is focused on first-stage retrieval to efficiently narrow millions
of documents down to tens or hundreds. While it may have fewer features than
traditional search engines, this streamlined approach enables higher quality,
more maintainable search applications that you can customize in your preferred
programming language. See [Hybrid Search](https://turbopuffer.com/docs/hybrid-search) to get started.

To get started with turbopuffer, see the [quickstart guide](https://turbopuffer.com/docs/quickstart).

For more technical details, see [Architecture](https://turbopuffer.com/docs/architecture),
[Guarantees](https://turbopuffer.com/docs/guarantees), and [Tradeoffs](https://turbopuffer.com/docs/tradeoffs).

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