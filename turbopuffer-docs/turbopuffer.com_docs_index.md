---
url: "https://turbopuffer.com/docs/index"
title: "Introduction"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

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
vectors take p90=444ms, while warm
queries are just p50=8ms.
This architecture means it's as fast as in-memory search engines when cached, but far
cheaper to run.

Storing data in cache and object storage costs less than traditional replicated
disk systems, even for frequently accessed data.

turbopuffer is focused on first-stage retrieval to efficiently narrow millions
of documents down to tens or hundreds. While it may have fewer features than
traditional search engines, this streamlined approach enables higher quality,
more maintainable search applications that you can customize in your preferred
programming language. See [Hybrid Search](https://turbopuffer.com/docs/hybrid-search) to get started.

To get started with turbopuffer, see the [quickstart guide](https://turbopuffer.com/docs/quickstart).

For more technical details, see [Architecture](https://turbopuffer.com/docs/architecture),
[Guarantees](https://turbopuffer.com/docs/guarantees), and [Tradeoffs](https://turbopuffer.com/docs/tradeoffs).

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)