turbopuffer's architecture

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

Architecture
============

The API routes to a cluster of Rust binaries that access your database on object storage (see[regions](https://turbopuffer.com/docs/regions)for more on routing).

After the first query, the namespace's documents are cached on NVMe SSD. Subsequent queries are routed to the same query node for cache locality, but any query node can serve queries from any namespace. The first query to a namespace reads object storage directly and is slow (p50=402 ms for 1M documents), but subsequent, cached queries to that node are faster (p50=16 ms for 1M documents). Many use-cases can send a[pre-flight query to warm the cache](https://turbopuffer.com/docs/warm-cache)so the user only ever experiences warm latency.

turbopuffer is a multi-tenant service, which means each`./tpuf` binary handles requests for multiple tenants. This keeps costs low. Enterprise customers can be isolated on request.

Client

turbopuffer

./tpuf

Cache (SSD/RAM)

Object storage

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

Each namespace has its own prefix on object storage. turbopuffer uses a write-ahead log (WAL) to ensure consistency. Every write adds a new file to the WAL directory inside the namespace's prefix. If a write returns successfully, data is guaranteed to be durably written to object storage. This means high write throughput (~10,000+ vectors/sec), at the cost of high write latency (p50=285 ms for 500KB).

Writes occur in windows of 100ms, i.e. if you issue concurrent writes to the same namespace within 100ms, they will be batched into one WAL entry. Each namespace can currently write 1 WAL entry per second. If a new batch is started within one second of the previous one, it will take up to 1 second to commit.

User write

WAL /{org_id}/{namespace}/wal

001

002

003

004

/{org_id}/{namespace}/index

centroids.bin

Namespace Config

clusters-1.bin

clusters-2.bin

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

After data is committed to the log, it is asynchronously indexed to enable efficient retrieval (■). Any data that has not yet been indexed is still available to search (◈), with a slower exhaustive search of recent data in the log.

turbopuffer provides strong consistency by default, i.e. if you perform a write, a subsequent query will immediately see the write. However, you can configure your queries to be[eventually consistent](https://turbopuffer.com/docs/query#param-consistency)for lower warm latency.

Both the approximate nearest neighbour (ANN) index we use for vectors, as well as the inverted[BM25](https://en.wikipedia.org/wiki/Okapi_BM25)index we use for full-text search have been optimized for object storage to provide good cold latency (~500ms on 1M documents). Additionally, we build exact indexes for[metadata filtering](https://turbopuffer.com/docs/query#filter-parameters).

Client

turbopuffer region

LB

./tpuf query

./tpuf query

./tpuf query

./tpuf indexer

./tpuf indexer

Object Storage

Indexing Queue

/{org_id}/{namespace}

/wal

/index

Namespace Config

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

Vector indexes are based on[SPFresh](https://dl.acm.org/doi/10.1145/3600006.3613166). SPFresh is a centroid-based approximate nearest neighbour index. It has a fast index for locating the nearest centroids to the query vector. A centroid-based index works well for object storage as it minimizes roundtrips and write-amplification, compared to graph-based indexes like HNSW or DiskANN.

On a cold query, the centroid index is downloaded from object storage. Once the closest centroids are located, we simply fetch each cluster's offset in one, massive roundtrip to object storage.

/{org_id}/{namespace}/index

centroids.bin

Namespace Config

clusters-1.bin

clusters-2.bin

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

In reality, there are more roundtrips required for turbopuffer to support consistent writes and work on large indexes. From first principles, each roundtrip to object storage takes ~100ms. The 3-4 required roundtrips for a cold query often take as little as ~400ms.

When the namespace is cached in NVME/memory rather than fetched directly from object storage, the query time drops dramatically to ~16 ms p50. The roundtrip to object storage for consistency, which we can relax on request for eventually consistent sub 10ms queries.

Metadata 1

Filter index

Centroid index

Unindexed WAL

Clusters

Roundtrip 1

Roundtrip 2 2

Roundtrip 3

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

1.   Metadata is downloaded for the turbopuffer storage engine. The storage engine is optimized for minimizing roundtrips.
2.   The second roundtrip starts navigating the first level of the indexes. In many cases, only one additional roundtrip is required. But the query planner makes decisions about how to efficiently navigate the indexes. It needs to settle tradeoffs between additional roundtrips and fetching more data in an existing roundtrip.

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
