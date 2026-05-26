---
url: "https://turbopuffer.com/docs/concepts"
title: "Concepts"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Concepts

## Approximate Nearest Neighbor (ANN) Search

Most vector search applications benefit from trading off a small amount of
search accuracy (recall) for a large gain in performance. turbopuffer uses
[SPFresh](https://turbopuffer.com/docs/concepts#spfresh) to implement ANN search, enabling this tradeoff at low cost,
while maintaining >90-95% recall@10 even in large namespaces. See
[Recall](https://turbopuffer.com/docs/concepts#recall) and the [vector search guide](https://turbopuffer.com/docs/vector) for more details.

## Attribute Index

Attribute indexes are inverted indexes built for filterable attributes, enabling
fast filtering and sorting operations. These indexes are aware of the primary
vector index and understand the clustering hierarchy, allowing them to work
together for high-recall filtered vector searches. See the
[native filtering blog post](https://turbopuffer.com/blog/native-filtering) for details on how
attribute indexes enable high-recall filtered queries.

## Branch

A branch is an instant, copy-on-write clone of a namespace. Both namespaces are
fully independent after creation — writes to one are never visible in the other.
See the [branching guide](https://turbopuffer.com/docs/branching) for details and examples.

## Cache Hierarchy

turbopuffer uses a multi-tier cache hierarchy: object storage (source of truth),
NVMe SSD cache (for recently queried namespaces), and memory cache (for
frequently accessed namespaces). After a cold query, data is cached on NVMe SSD,
and frequently accessed namespaces are stored in memory. The storage engine is
designed to perform small, ranged reads directly from object storage for fast
cold queries without needing to load entire namespaces. See the
[architecture documentation](https://turbopuffer.com/docs/architecture) and
[warm cache documentation](https://turbopuffer.com/docs/warm-cache) for more details.

## Compute-Storage Separation

All durable state in turbopuffer is stored in object storage. Compute nodes are
stateless. This means any node can serve queries for any namespace. If a node
fails, another can immediately serve queries for any namespaces previously
served by the failed node. Data is cached on NVMe SSDs and in memory for
performance, but the storage engine is designed to perform efficient reads
directly from object storage when needed. This architecture enables
cost-effective scaling and high availability without additional cost. See the
[architecture documentation](https://turbopuffer.com/docs/architecture) and
[guarantees](https://turbopuffer.com/docs/guarantees) for more details.

## Filtering

Filtering allows queries to restrict results to documents matching specific
attribute conditions. Filters can be simple (equality, comparison) or complex
(nested AND/OR expressions, glob patterns, regex). Filterable attributes are
indexed into inverted indexes for fast evaluation. See the
[query documentation](https://turbopuffer.com/docs/query#filtering-parameters) for filter syntax and the
[native filtering blog post](https://turbopuffer.com/blog/native-filtering) for how filtering works
with vector search.

## FTS/BM25

Full-Text Search (FTS) in turbopuffer uses the BM25 (Best Matching 25) ranking
function, a classic text search algorithm that considers query term frequency
and document length. BM25 scores documents based on how well they match query
terms, with higher scores for documents that contain more relevant terms.
Full-text search is enabled on a per-attribute basis, and turbopuffer builds a
BM25 index for each enabled attribute. BM25 results can be combined with vector
search results client-side for [hybrid search](https://turbopuffer.com/docs/hybrid). See the
[full-text search guide](https://turbopuffer.com/docs/fts) for details on using BM25.

## Group Commit

Group commit is a write batching technique that combines multiple pending writes
into a single I/O operation. When a write is in flight, incoming writes are
buffered in memory. As soon as the current write completes, all buffered writes
are flushed together in the next write. This decouples write throughput from I/O
latency, making it possible to achieve high throughput even when individual
writes are slow (e.g., ~200ms for object storage writes). turbopuffer uses group
commit for batching writes to the [WAL](https://turbopuffer.com/docs/concepts#wal) and for its internal
[indexing job queue](https://turbopuffer.com/blog/object-storage-queue).

## Hybrid Search

Hybrid search combines multiple search strategies to improve search quality.
turbopuffer supports vector search (for semantic relevance) and BM25 full-text
search (for exact keyword matching). To implement hybrid search, send multiple
queries (which can be batched in a single API call using
[multi-query](https://turbopuffer.com/docs/query#multi-queries)) and combine results client-side using
techniques like reciprocal-rank fusion. See the
[hybrid search guide](https://turbopuffer.com/docs/hybrid) for examples and best practices.

## Indexing

After data is committed to the WAL, it is asynchronously indexed by separate
indexing nodes to enable efficient retrieval. This compute-compute separation
means expensive indexing operations don't impact query performance. Unindexed
data is still searched exhaustively for strongly consistent queries. Indexing
progress can be tracked through the `unindexed_bytes` field in the
[metadata endpoint](https://turbopuffer.com/docs/metadata). By default, attributes are indexed for
filtering and sorting, but you can disable indexing for attributes you don't
need to filter on using the [schema](https://turbopuffer.com/docs/write#schema). See the
[architecture documentation](https://turbopuffer.com/docs/architecture) for more details on the
indexing process.

## Log-structured merge (LSM) tree

A log-structured merge (LSM) tree is a data structure that buffers writes in
memory, flushes them to storage as immutable sorted runs, and periodically
merges (compacts) those runs together. Reads check across runs and merge the
results into a single ordered stream.

Most LSM trees are built for local disk. turbopuffer's is built natively on
object storage. When a write is committed to the [WAL](https://turbopuffer.com/docs/concepts#wal), it triggers an
asynchronous [indexing](https://turbopuffer.com/docs/concepts#indexing) job that builds the index on the LSM tree.
Because object storage is the source of truth, compute nodes are stateless. Any
[query node](https://turbopuffer.com/docs/concepts#query-and-indexing-nodes) can serve queries for any namespace, and
any [indexing node](https://turbopuffer.com/docs/concepts#indexing) can run compaction. The storage engine and query
planner work together to minimize roundtrips to object storage, targeting
sub-second cold query latency. Compaction runs periodically to merge sorted runs,
improving query performance and ensuring deleted data is eventually removed.
See the [architecture documentation](https://turbopuffer.com/docs/architecture) for more details on
how the storage engine works.

## Multi-Tenancy

Multi-tenancy can refer to two things in the turbopuffer context. First,
turbopuffer is a multi-tenant service, meaning each binary handles requests for
multiple tenants (organizations). This keeps costs low while maintaining
isolation between tenants. Enterprise customers can be isolated on request
through single-tenancy clusters or BYOC (Bring Your Own Cloud) deployments.

Second, turbopuffer's architecture is particularly well-suited for multi-tenancy
use cases. You can create unlimited namespaces, and each namespace has its own
vector index, full-text search index, attribute index, or a combination. This
means you can scale to support unlimited tenants, datasets, or applications,
each with their own isolated indexes, without architectural constraints. See the
[security documentation](https://turbopuffer.com/docs/security) for more details on multi-tenancy and
isolation options.

## Namespace

A namespace is an isolated container for documents and vectors in turbopuffer.
Each namespace has its own prefix on object storage and is implicitly created
when the first document is inserted.

We recommend creating one namespace per set of documents that are expected to be
returned in the same query rather than using filters to separate data. Smaller
namespaces generally provide better query performance. See the
[write documentation](https://turbopuffer.com/docs/write) for details on creating namespaces and the
[namespaces API](https://turbopuffer.com/docs/namespaces) for listing them.

## Primary Key

The primary key in turbopuffer is the document ID, which uniquely identifies
each document within a namespace. Document IDs can be unsigned 64-bit integers,
128-bit UUIDs, or strings up to 64 bytes. The primary key is used to reference
documents for updates, patches, and deletes. See the
[write documentation](https://turbopuffer.com/docs/write) for details on document IDs.

## Query

A query reads data from a namespace. Queries can be used to retrieve documents
by vector similarity, full-text search score, attribute value conditions, and
more. Queries can also be used to compute aggregations. See the
[query documentation](https://turbopuffer.com/docs/query) for details on query syntax and options.

## Query and Indexing Nodes

turbopuffer uses compute-compute separation with two types of nodes: query nodes
and indexing nodes. Query nodes handle API requests, such as reads and writes,
while indexing nodes maintain the indexes asynchronously, writing to object
storage new index states that query nodes discover. This separation ensures that
indexing operations don't impact query performance. Both node types auto-scale
with demand. See the [guarantees documentation](https://turbopuffer.com/docs/guarantees) for more
details on compute-compute separation.

## Read Consistency

turbopuffer provides strong consistency by default: if you perform a write, a
subsequent query will immediately see the write. Strong consistency ensures
queries see all data written before the query started, with a ~10ms latency
floor due to object storage checks for the latest writes.

For workloads requiring sub-10ms latency, you can configure queries to use
[eventual consistency](https://turbopuffer.com/docs/query#param-consistency), which trades consistency
for lower latency. Eventual consistency searches up to 128 MiB of unindexed data
and allows data to be up to about one hour stale in the worst case. Over 99.8% of queries return
consistent data even with eventual consistency. See the
[query documentation](https://turbopuffer.com/docs/query#param-consistency) for details on configuring
consistency levels and the [guarantees documentation](https://turbopuffer.com/docs/guarantees) for more
details on consistency guarantees.

## Recall

Recall is a metric that measures the accuracy of approximate nearest-neighbor
(ANN) search by comparing results against a brute-force exhaustive search.
Specifically, recall@k is the ratio of results returned by the ANN search that
also appear in the top k results of an exhaustive search. turbopuffer
automatically measures recall on 1% of live query traffic and aims for 90-95%
recall@10 for all queries, including filtered queries. You can evaluate recall
for your namespace using the [recall endpoint](https://turbopuffer.com/docs/recall). See the
[continuous recall blog post](https://turbopuffer.com/blog/continuous-recall) for more details on how
turbopuffer ensures high recall.

## Regex / Glob Index

When `glob: true` or `regex: true` is enabled in the [schema](https://turbopuffer.com/docs/write#schema)
for an attribute, we'll build a trigram-based index to accelerate [Glob](https://turbopuffer.com/docs/query#param-Glob)
and [Regex](https://turbopuffer.com/docs/query#param-Regex) filters. The index allows us to first narrow
the set of possibly matching candidates for a given Glob/Regex before doing
exhaustive evaluation.

## Schema

turbopuffer maintains a schema for each namespace that defines the type and
indexing behavior for each attribute, including vectors. Within a namespace,
attributes must have consistent types across all documents. Within each vector
column, all vectors must have the same number of dimensions.

By default, data types for attributes are automatically inferred and all
attributes are indexed for filtering and sorting. You can customize indexing
behavior or specify types that cannot be automatically inferred (e.g., `uuid`,
`datetime`) by passing a schema object in a write request. To inspect the schema
for a namespace, use the [metadata endpoint](https://turbopuffer.com/docs/metadata). See the
[write documentation](https://turbopuffer.com/docs/write#schema) for details on configuring schemas.

## SPFresh

SPFresh is a centroid-based approximate nearest neighbor (ANN) index that
turbopuffer uses for vector search. It allows turbopuffer to efficiently locate
vectors nearby the query vector by navigating clusters of vectors at a time.
SPFresh incrementally updates clusters as vectors change, while maintaining high
recall. This avoids expensive full index rebuilds and efficiently enables large
scale namespaces. SPFresh works well for object storage as it minimizes
roundtrips compared to graph-based indexes. See the
[architecture documentation](https://turbopuffer.com/docs/architecture) for more details.

## Vectors and Documents

Documents are the basic unit of data in turbopuffer. Each document has a unique
ID (unsigned 64-bit integer, 128-bit UUID, or string up to 64 bytes) within a
namespace and can contain vectors and attributes. Vectors are arrays of
floating-point numbers used for vector similarity search. A namespace may or may
not have vector indexes; if it does, all documents must include all vector attributes.
Attributes are key-value pairs that can be used for filtering, sorting, and
full-text search. Within each namespace, both attributes and vectors must have
consistent types. See the [write documentation](https://turbopuffer.com/docs/write) for details on
creating documents and the [vector search guide](https://turbopuffer.com/docs/vector) for using
vectors.

## WAL

The Write-Ahead Log (WAL) is turbopuffer's mechanism for ensuring data
consistency and durability. Write operations for a given namespace are batched
together for up to a second, with concurrent writes to the same namespace
automatically combined into the same WAL entry. When a write returns
successfully, the data is guaranteed to be durably written to a new file in the
WAL directory inside the namespace's prefix on object storage, providing
[durable writes](https://turbopuffer.com/docs/guarantees).

After data is committed to the log, it is asynchronously indexed to enable
efficient retrieval. This design enables high write throughput (~10,000+
vectors/sec) while maintaining durability guarantees. See the
[architecture documentation](https://turbopuffer.com/docs/architecture) for more details on how WAL
works.

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