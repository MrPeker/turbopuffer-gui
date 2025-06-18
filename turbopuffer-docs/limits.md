Limits

===============

[Now open for all, let's get you puffin'turbopuffer is generally available, let's get you puffin'](https://turbopuffer.com/join)

Navigation
----------

[![Image 1: Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

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

Limits
======

There isn't a limit or performance metric we can't improve by an order of magnitude when prioritized. If you expect to brush up against a limit or you are limited by present performance, [contact us](https://turbopuffer.com/contact). Often can be fixed in days.

| Metric | Observed in production | Production limits (current)(upcoming) |
| --- | --- | --- |
| Max documents (global) | 150B+ | Unlimited |
| Max documents (per namespace) | 200M | 100M 1B+ |
| Max number of namespaces | 40M+ | Unlimited |
| Max dimensions |  | 10,752 |
| Max inactive time in cache | ~3 days | Contact us for custom |
| Max write rate (global) | 1M+ writes/s | Unlimited |
| Max write rate (per namespace) | 10K writes/s | 10K writes/s |
| Max upsert batch request size | 256 MB | 256 MB |
| Max write batch rate (per namespace) | 1 batch/s | 1 batch/s 4 batches/s |
| Max rows affected by[delete by filter](https://turbopuffer.com/docs/write#delete-by-filter) | 25M | ~10M |
| Max ingested, unindexed data | 2 GB | 2 GB |
| Max queries (global) | 6K+ queries/s | Unlimited |
| Max queries (per namespace) | 1K+ queries/s | 1K+ queries/s 10K queries/s |
| Max concurrent queries per namespace | 16 | 16 |
| Vector search recall@10 | 90-100% | 90-100%Configurable |
| Max attribute value | 8 MiB | 8 MiB |
| Max document size |  | 64 MiB |
| Max id size |  | 64 bytes |
| Max attribute name length | 128 | 128 |
| Max attribute names per namespace | 256 | 256 |
| Max namespace name length | 128 | 128 |
| Max full-text query length | 8,192 | 1,024 |
| Max topk | 10K | 1.2K |

![Image 2: turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about)[Pricing](https://turbopuffer.com/pricing)[Press & media](https://turbopuffer.com/press)[System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-2bro3fb5j-6Ys5st9UFDrm7qXQw_S9Rw)[Docs](https://turbopuffer.com/docs)[Email](https://turbopuffer.com/contact/support)[Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

[](https://x.com/turbopuffer)[](https://www.linkedin.com/company/turbopuffer/)[](https://bsky.app/profile/turbopuffer.bsky.social)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service)[Data Processing Agreement](https://turbopuffer.com/dpa)[Privacy Policy](https://turbopuffer.com/privacy-policy)[Security & Compliance](https://turbopuffer.com/docs/security)

[* SOC2 Type 2 certified * HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")
