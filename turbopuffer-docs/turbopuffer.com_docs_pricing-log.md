---
url: "https://turbopuffer.com/docs/pricing-log"
title: "Pricing Changelog"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Pricing Changelog

**Last updated:** April 3, 2026

This page tracks pricing changes over time. If you need help estimating impact
for your workload, [contact us](https://turbopuffer.com/contact/sales). For more details on how your turbopuffer bill is calculated, see our [pricing page](https://turbopuffer.com/pricing).

## 2026

### April 2026

Introduced [namespace pinning](https://turbopuffer.com/docs/pinning), which bills pinned namespaces in
GB-hours instead of per-query `TB Queried` pricing. Pinning cost scales with
namespace size, replica count, and time pinned, with minimums of 64 GB and 10
minutes.

### March 2026

Pricing for namespaces with [multiple vector columns](https://turbopuffer.com/docs/write#multiple-vector-columns):

- Filterable attributes are billed once per vector column for both writes and storage, reflecting the cost of maintaining indexes across multiple ANN indexes
- Non-filterable attributes are billed once regardless of the number of vector columns

### February 2026

Query pricing for the largest namespaces reduced by up to 94%:

- Base queried data rate decreased from $5/PB to $1/PB
- 80% marginal discount when queried data size is between 32 GB and 128 GB
- 96% marginal discount when queried data size is greater than 128 GB
- Minimum billable data per query increased from 256 MB to 1.28 GB

## 2025

### July 2025

Query pricing for large namespaces reduced by up to 80%:

- 80% marginal discount on bytes queried over 32 GB, per query

## 2024

### September 2024

Introduced `copy_from_namespace`, allowing data to be copied between namespaces at a 50% discount on write costs.

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