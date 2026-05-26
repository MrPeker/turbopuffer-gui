---
url: "https://turbopuffer.com/docs/branching"
title: "Namespace Branching"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Namespace Branching

Branching creates an instant, copy-on-write clone of a namespace via `branch_from`.

- **Constant-time** regardless of namespace size
- **Fully independent** — reads, writes, queries, and deletes on either namespace don't affect the other
- **Branch from branches** — multi-level workflows like per-developer branches from staging
- **Unlimited** — no limit on child branches per namespace (A→B, A→C, A→D, ...) nor on length of branch chains (A→B, B→C, C→D, ...)

**Namespace branching** is rolling out in select regions. To join the private
beta, [contact us](https://turbopuffer.com/contact/support).

## Pricing

Pricing may change before GA.

Branching is billed at a flat rate of $0.032.

Storage of a branched namespace is billed on logical bytes at standard rates —
each branch is billed as if it were an independent namespace. We plan to reduce
this once we've observed branching in production and learned what the reuse
rates are.

## When to use branching vs copy\_from\_namespace

Use [`copy_from_namespace`](https://turbopuffer.com/docs/write#param-copy_from_namespace) when you
need a backup with full data isolation (branching shares underlying storage),
when copying across regions or organizations (see the [cross-region backups\\
guide](https://turbopuffer.com/docs/backups)), or when re-encrypting a namespace with a different
[CMEK key](https://turbopuffer.com/docs/cmek).

Use branching otherwise.

## Use cases

- **Codebase indexing.** Embed a codebase once; branch per local checkout so only changed files need re-indexing.
- **Test pipelines.** Branch a production namespace, run tests against real data, tear it down when done.
- **Development environments.** Give each developer a sandbox of a shared dataset.
- **Snapshots.** Capture the state of a changing namespace at a point in time, query the immutable snapshot many times, discard when finished.

## Deleting branches

Both the source and branched namespaces are fully independent after creation.
Deleting a branch does not affect the source namespace, and deleting the source
does not affect any branches. Use the standard
[delete namespace](https://turbopuffer.com/docs/delete-namespace) endpoint to remove either one.

## Example

python

curlpythontypescriptgojavac#ruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

source = tpuf.namespace(f'branching-example-source-py')

ns = tpuf.namespace(f'branching-example-py')
ns.branch_from(source_namespace=f'branching-example-source-py')

# Write to the branch
ns.write(upsert_rows=[{'id': 3, 'title': 'New'}])

# Branch has source data + new write
result = ns.query(rank_by=('id', 'asc'), top_k=10, include_attributes=['title'])
print(result.rows)

# Source is unaffected
result = source.query(rank_by=('id', 'asc'), top_k=10, include_attributes=['title'])
print(result.rows)
```

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