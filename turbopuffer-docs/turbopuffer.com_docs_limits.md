---
url: "https://turbopuffer.com/docs/limits"
title: "Limits"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

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
| Max inactive time in cache | hours | Contact us for custom |
| Max write throughput (global) | 10M+ writes/s @ 32GB/s | Unlimited |
| Max write throughput (per namespace) | 32k+ writes/s @ 64MB/s | 10k writes/s @ 32 MB/s |
| Max namespace copy throughput | 72 MB/s | Contact us if bottlenecked |
| Max upsert batch request size |  | 256 MB |
| Max write batch rate (per namespace) |  | 1 batch/s |
| Max rows affected by [patch by filter](https://turbopuffer.com/docs/write#patch-by-filter) |  | 500k |
| Max rows affected by [delete by filter](https://turbopuffer.com/docs/write#delete-by-filter) |  | 5M |
| Max ingested, unindexed data |  | 2 GB |
| Max queries (global) | 10k+ queries/s | Unlimited |
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
| Max attribute names per namespace |  | 256 |
| Max namespace name length |  | 128 bytes |
| Max full-text query length | 8,192 | 1,024 |
| Max [limit.total](https://turbopuffer.com/docs/query#param-limit) | 10k | 10k |
| Max aggregation groups per query | 10k | 1.2k |

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)