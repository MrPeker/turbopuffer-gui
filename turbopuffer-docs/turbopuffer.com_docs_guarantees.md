---
url: "https://turbopuffer.com/docs/guarantees"
title: "Guarantees"
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

# Guarantees

This document serves as a brief reference of turbopuffer's guarantees:

- **Durable Writes.** Writes are committed to object storage upon successful return by turbopuffer's API.
- **Consistent Reads.** Queries return the latest data by default but can be [configured](https://turbopuffer.com/docs/query)
for performance at the cost of read consistency. Most updates are visible immediately since
queries usually hit the writing node. [Over 99.99% of queries return consistent data](https://turbopuffer.com/docs/query#param-consistency),
however in rare cases (e.g. during scaling), reads may be briefly stale (typically limited to ~100ms, with a
strict upper bound of 1 minute). The cache refreshes on every query, ensuring the latest writes appear
next request.
- **Atomic Conditional Writes.** [Conditional writes](https://turbopuffer.com/docs/write#conditional-writes) evaluate their condition atomically with writing.
- **Atomic Batches.** All writes in an upsert are applied simultaneously.
- **Any node can serve queries for any namespace.** HA does not come as a cost/reliability trade-off. Our HA is the number of query nodes we run.
- **Object storage is the only stateful dependency.** This means there is no separate consensus plane that needs to be maintained and scaled independently, simplifying the system's operations and thus reliability. All concurrency control is delegated to object storage.
- **Compute-Compute Separation.** Query nodes handle queries and writes to object storage and the write-through cache. All expensive computation happens on separate, auto-scaled indexing nodes.
- **Smart Caching.** After a cold query, data is cached on NVMe SSD and frequently accessed namespaces are stored in memory. turbopuffer does not need to load the entire namespace into cache, and then query it. The storage engine is designed to perform small, ranged reads directly to object storage for fast cold queries. [Cache warming hints](https://turbopuffer.com/docs/warm-cache) can eliminate user-visible cold query latency in many applications.
- **Autoscaling.** Query and indexing nodes are automatically scale with demand.

Regarding ACID properties: turbopuffer provides Atomicity, Consistency, and
Durability.

Isolation is not broadly applicable, as general purpose read-write transactions
are not supported. However, limited read-write semantics are available through
[conditional writes](https://turbopuffer.com/docs/write#conditional-writes),
[`patch_by_filter`](https://turbopuffer.com/docs/write#patch-by-filter), and
[`delete_by_filter`](https://turbopuffer.com/docs/write#delete-by-filter).

Conditional writes evaluate their reads and writes atomically. This prevents
concurrency anomalies such as Lost Updates and ensures they behave as if run
under Serializable isolation, the strongest isolation level.

`patch_by_filter` and `delete_by_filter` execute in two phases:

1. They evaluate their filter against a namespace snapshot to identify matching
document IDs.
2. They atomically re-evaluate their filter against those matching IDs and
modify documents that still satisfy the condition.

Re-evaluation ensures that documents are never modified that no longer satisfy
the condition. However, newly qualifying documents that were inserted or updated
between the two phases will be missed. As a result, `patch_by_filter` and
`delete_by_filter` behave as if run under Read Committed isolation, similar to
`UPDATE ... SET ... WHERE ...` and `DELETE FROM ... WHERE ...` in
[PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED).

For CAP theorem: turbopuffer prioritizes consistency over availability when
object storage is unreachable. You can adjust this to favor availability through
[query configuration](https://turbopuffer.com/docs/query).

For more details, see [Tradeoffs](https://turbopuffer.com/docs/tradeoffs), [Limits](https://turbopuffer.com/docs/limits),
and [Architecture](https://turbopuffer.com/docs/architecture).

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