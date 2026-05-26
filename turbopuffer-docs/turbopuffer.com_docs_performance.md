---
url: "https://turbopuffer.com/docs/performance"
title: "Optimizing Performance"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Optimizing Performance

turbopuffer is designed to be performant by default, but there are ways to
optimize performance further. These suggestions aren't requirements for good
performance--rather, they highlight opportunities for improvement when you have
the flexibility to choose.

For example, while a single namespace with 100M documents works fine, splitting
it into 10 namespaces of 10M documents each may yield better query performance
if there's a natural way to group the documents.

- **Choose the [region](https://turbopuffer.com/docs/regions) closest to your backend.** We can't beat the
speed of light. If there isn't a region close to us and the latency is
paramount, [contact us.](https://turbopuffer.com/contact)
- **HTTP connection reuse.** Use the same `Turbopuffer` client instance for as
many requests as possible. This uses a connection pool behind the scenes to
avoid the overhead of a TCP and TLS handshake on every request.
- **U64 or UUID IDs**: The smaller the IDs, the faster the puffin'. A UUID
encoded as a string is 36 bytes, whereas the [UUID-native type is 16\\
bytes](https://turbopuffer.com/docs/write#schema). A u64 is even smaller at 8 bytes.
- **Inverted index.** Attribute values that are filterable are indexed into an inverted
index. Inverted indexes means large intersects can be much faster than on a
traditional B-Tree index.
- **filterable: false**. For attributes you never intend to filter on, marking
[attributes as filterable: false](https://turbopuffer.com/docs/write#schema) will improve indexing performance and
grant you a 50% discount. For large attribute values, e.g. storing a raw text
chunk or image, this can improve performance and cost significantly.
- **Use small namespaces.** The rule of thumb is to make the namespaces as
small as they can be without having to routinely query more than one at a time.
If documents have significantly different schemas, it's also worth splitting
them. Don't try to be too clever. Smaller namespaces will be faster to query and index.
- **Prewarm namespaces.** If your application is latency-sensitive, consider
[warming the cache](https://turbopuffer.com/docs/warm-cache) for the namespace before the user interacts with it
(e.g. when they open the search or chat dialog).
- **Smaller vectors are faster.** Smaller vectors will be faster to search, e.g.
512 dimensions will be faster than 1536 dimensions.
[f16](https://turbopuffer.com/docs/write#param-type) will be faster than f32. The tradeoff with
smaller vectors is typically lower search precision. Consider the cost/performance
vs precision tradeoff with your own evals. For models with quantization-aware
training ( [voyage-4 series](https://blog.voyageai.com/2026/01/15/voyage-4/), [voyage-context-3](https://blog.voyageai.com/2025/07/23/voyage-context-3/),
[embed-v4](https://cohere.com/blog/embed-4), [Qwen3-VL-Embedding-8B](https://qwen.ai/blog?id=qwen3-vl-embedding)), `int8` output
matches `f32` precision ( [benchmarks](https://docs.google.com/spreadsheets/d/1qLBWWvN7-4W53BveJgkQiDSoK_j2RYLh5DafDdEOPnc/edit?gid=1834510862#gid=1834510862&range=A11:B14)), so you can pass `int8`
values directly as JSON integers to an `f16` namespace for `f16` speed with no
precision loss.
- **Use [branching](https://turbopuffer.com/docs/branching) to duplicate namespaces.** If you're
creating copies of namespaces for testing, backups, or code repositories,
branching creates a copy-on-write clone in constant time regardless of
namespace size.
- **Batch writes.** If you're writing a lot of documents, consider batching
them into fewer writes. This will improve performance and [leverages batch\\
discounts up to 50%](https://turbopuffer.com/#pricing). Each individual write batch request can be a
maximum of 512MB.
- **Concurrent writes.** If you're writing a lot of documents, consider using
multiple processes to write batches in parallel. Especially for single-threaded
runtimes like Node.js or Python, this can be a significant performance boost as
upserting is generally bottlenecked by serialization and compression.
- **Control include\_attributes.** The more data we have to
return, the slower it will be. Make sure to only specify the attributes you
need.
- **Use eventual consistency.** If you need higher query throughput and can tolerate
stale results, consider using [eventual consistency](https://turbopuffer.com/docs/query#param-consistency)
for your queries.
- **Pin high QPS namespaces.** For sustained high query volumes over a few, large
namespaces, consider [namespace pinning](https://turbopuffer.com/docs/pinning) to provision reserved
compute nodes for more predictable cost and performance with always-warm cache.
- **Avoid large attributes with frequent patches.** When using [patch](https://turbopuffer.com/docs/write#param-patch_rows)
or [patch\_by\_filter](https://turbopuffer.com/docs/write#param-patch_by_filter), turbopuffer currently reads all
attributes of the documents being patched, even those not being modified. If you
have large attributes (>10KB), consider storing them in a separate namespace
linked by ID. For example, if you have chunks with vectors
and a large metadata blob that's shared across chunks, store the metadata in a
separate namespace keyed by a shared ID (e.g. `file_id`). At query time, do a
vector search on chunks, then look up the metadata using the unique IDs from
your results. This way, patches to chunk-specific attributes never touch the
large metadata.
- `rank_by` expressions can quickly become quite sophisticated. For best
peformance, we recommend keeping the first-stage ranking function simple, with
only a few attributes being used to compute BM25 scores and/or attribute
scores, retrieving in the order of 100 to 1,000 hits, and then applying more
sophisticated ranking in the second stage.
- **Understand how Glob and Regex filters are optimized.** Under the hood, they
use a trigram-based index to quickly narrow down the set of possibly matching candidates.
As a general rule of thumb, the more specific the pattern, the better the performance. Anchored
patterns (`turbo*` or `*puffer`) are much more specific than unanchored patterns (`*tpuf*`),
and thus will perform better. Avoid unspecific patterns like `[a-z]*`, which require a full-table
scan.
- **Separate ANN and BM25 index namespaces**. If indexing performance suffers on a
namespace with both ANN and BM25 indexes, we recommend splitting these indexes into
separate namespaces to improve throughput. We're actively working on improving
performance for combined ANN and BM25 namespaces, and this temporary workaround will
be unnecessary soon.

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