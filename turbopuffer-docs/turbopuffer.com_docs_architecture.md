---
url: "https://turbopuffer.com/docs/architecture"
title: "Architecture"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Architecture

The API routes to a cluster of Rust binaries that access your
database on object storage (see [regions](https://turbopuffer.com/docs/regions) for more on routing).

After the first query, the namespace's documents are cached on NVMe SSD.
Subsequent queries are routed to the same query node for cache locality, but any
query node can serve queries from any namespace. The first query to a namespace
reads object storage directly and is slow (p50=874ms for 1M documents),
but subsequent, cached queries to that node are faster (p50=14ms
for 1M documents). Many use-cases can send a [pre-flight query to hint\\
that the client will send latency-sensitive requests in the near future](https://turbopuffer.com/docs/warm-cache).

turbopuffer is a multi-tenant service, which means each `./tpuf` binary handles requests for multiple tenants.
This keeps costs low. Enterprise customers can be isolated on request either
through [single-tenancy clusters, or BYOC](https://turbopuffer.com/docs/security):

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

Each namespace has its own prefix on object storage. turbopuffer
uses a write-ahead log (WAL) to ensure consistency. Every write adds
a new file to the WAL directory inside the namespace's prefix. If a
write returns successfully, data is guaranteed to be durably written
to object storage. This means high write throughput (~10,000+
vectors/sec), at the cost of high write latency (p50=285ms for 500kB).

Each namespace can currently write 1 WAL entry per second. Concurrent writes to
the same namespace are batched into the same entry. If a new batch is started
within one second of the previous one, it will take up to 1 second to commit.

```
                                              mem buffer
                                              ┌──────┐
            UPSERT/PATCH/DELETE               │░░░░░░│
            ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ─▶│░░░░░░│
                                              │░░░░░░│
                                              └──┬───┘
WAL                                              │ group commit (<= 1/s)
s3://tpuf/{namespace_id}/wal                     ▼
╔═════════════════════════════════════════════════════════╗
║┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             ║░
║│██████│ │██████│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│             ║░
║│██████│ │██████│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│             ║░
║│██████│ │██████│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│             ║░
║└──────┘ └──────┘ └──────┘ └──────┘ └──────┘             ║░
║ 01.bin   02.bin ▲ 03.bin   04.bin   05.bin ▲ (06.bin)   ║░
╚═════════════════│══════════════════════════│════════════╝░
 ░░░░░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░░░░░░░░
                  │                          │
             index cursor                CAS commit
                                           point

█ indexed + committed   ▓ committed, unindexed   ░ written, not committed

~10ms for consistent read
```

```
                                              mem buffer
                                              ┌──────┐
            UPSERT/PATCH/DELETE               │░░░░░░│
            ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ─▶│░░░░░░│
                                              │░░░░░░│
                                              └──┬───┘
WAL                                              │ group commit (<= 1/s)
s3://tpuf/{namespace_id}/wal                     ▼
╔═════════════════════════════════════════════════════════╗
║┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             ║░
║│██████│ │██████│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│             ║░
║│██████│ │██████│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│             ║░
║│██████│ │██████│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│ │▓▓▓▓▓▓│             ║░
║└──────┘ └──────┘ └──────┘ └──────┘ └──────┘             ║░
║ 01.bin   02.bin ▲ 03.bin   04.bin   05.bin ▲ (06.bin)   ║░
╚═════════════════│══════════════════════════│════════════╝░
 ░░░░░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░░░░░░░░░░│░░░░░░░░░░░░░░
                  │                          │
             index cursor                CAS commit
                                           point

█ indexed + committed   ▓ committed, unindexed   ░ written, not committed

~10ms for consistent read
```

After data is committed to the log, it is asynchronously indexed to
enable efficient retrieval (■). Any data that has not yet been
indexed is still available to search (◈), with a slower exhaustive
search of recent data in the log.

turbopuffer provides strong consistency by default, i.e. if you
perform a write, a subsequent query will immediately see the write.
However, you can configure your queries to be [eventually consistent](https://turbopuffer.com/docs/query#param-consistency) for lower warm latency.
With eventual consistency, staleness of up to about one hour can be observed in the worst case.

Both the approximate nearest neighbour (ANN) index we use for
vectors, as well as the inverted [BM25](https://en.wikipedia.org/wiki/Okapi_BM25) index we use for full-text search have been optimized for object
storage to provide good cold latency (~500ms on 1M documents).
Additionally, we build exact indexes for [metadata filtering](https://turbopuffer.com/docs/query#filtering-parameters).

```
                   ╔═══turbopuffer region═════════════╗
                   ║      ┌─────────────────────────┐ ╠──┐
                   ║      │     ./tpuf indexer      │ ║░ │
                   ║      └─────────────────────────┘ ║░ │
                   ║      ┌─────────────────────────┐ ║░ │
                   ║      │     ./tpuf indexer      │ ║░ │
                   ║      └─────────────────────────┘ ║░ │   ╔═══Object Storage══════════════╗
                   ║                                  ║░ │   ║ ┏━━Indexing Queue━━━━━━━━━━━┓ ║░
                   ║      ┌─────────────────────────┐ ║░ │   ║ ┃■■■■■■■■■                  ┃ ║░
                   ║      │      ./tpuf query       │ ║░ │   ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
                   ║      │┌─Memory Cache──────────┐│ ║░ │   ║ ┏━/{org_id}/{namespace}━━━━━┓ ║░
                   ║      ││■■■■■■■■■■             ││ ║░ │   ║ ┃ ┏━/wal━━━━━━━━━━━━━━━━━━┓ ┃ ║░
                   ║   ┌─▶│└───────────────────────┘│ ║░ └──▶║ ┃ ┃■■■■■■■■■■■■■■■◈◈◈◈    ┃ ┃ ║░
                   ║   │  │┌─NVMe Cache────────────┐│ ║░     ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
                   ║   │  ││■■■■■■■■■■■■■■■■■■■■■  ││ ║░ ┌──▶║ ┃ ┏━/index━━━━━━━━━━━━━━━━┓ ┃ ║░
                ┌──╩─┐ │  │└───────────────────────┘│ ║░ │   ║ ┃ ┃■■■■■■■■■■■■■■■        ┃ ┃ ║░
╔══════════╗    │    │ │  └─────────────────────────┘ ║░ │   ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
║  Client  ║───▶│ LB │─┤  ┌─────────────────────────┐ ║░ │   ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
╚══════════╝░   │    │ │  │      ./tpuf query       │ ║░ │   ╚═══════════════════════════════╝░
 ░░░░░░░░░░░░   └──╦─┘ │  │┌─Memory Cache──────────┐│ ║░ │    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                   ║   │  ││■■■■■■■■■■             ││ ╠──┘
                   ║   └─▶│└───────────────────────┘│ ║░
                   ║      │┌─NVMe Cache────────────┐│ ║░
                   ║      ││■■■■■■■■■■■■■■■■■■■■■  ││ ║░
                   ║      │└───────────────────────┘│ ║░
                   ║      └─────────────────────────┘ ║░
                   ╚══════════════════════════════════╝░
                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
                   ╔═══turbopuffer region═════════════╗
                   ║      ┌─────────────────────────┐ ╠──┐
                   ║      │     ./tpuf indexer      │ ║░ │
                   ║      └─────────────────────────┘ ║░ │
                   ║      ┌─────────────────────────┐ ║░ │
                   ║      │     ./tpuf indexer      │ ║░ │
                   ║      └─────────────────────────┘ ║░ │   ╔═══Object Storage══════════════╗
                   ║                                  ║░ │   ║ ┏━━Indexing Queue━━━━━━━━━━━┓ ║░
                   ║      ┌─────────────────────────┐ ║░ │   ║ ┃■■■■■■■■■                  ┃ ║░
                   ║      │      ./tpuf query       │ ║░ │   ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
                   ║      │┌─Memory Cache──────────┐│ ║░ │   ║ ┏━/{org_id}/{namespace}━━━━━┓ ║░
                   ║      ││■■■■■■■■■■             ││ ║░ │   ║ ┃ ┏━/wal━━━━━━━━━━━━━━━━━━┓ ┃ ║░
                   ║   ┌─▶│└───────────────────────┘│ ║░ └──▶║ ┃ ┃■■■■■■■■■■■■■■■◈◈◈◈    ┃ ┃ ║░
                   ║   │  │┌─NVMe Cache────────────┐│ ║░     ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
                   ║   │  ││■■■■■■■■■■■■■■■■■■■■■  ││ ║░ ┌──▶║ ┃ ┏━/index━━━━━━━━━━━━━━━━┓ ┃ ║░
                ┌──╩─┐ │  │└───────────────────────┘│ ║░ │   ║ ┃ ┃■■■■■■■■■■■■■■■        ┃ ┃ ║░
╔══════════╗    │    │ │  └─────────────────────────┘ ║░ │   ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
║  Client  ║───▶│ LB │─┤  ┌─────────────────────────┐ ║░ │   ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
╚══════════╝░   │    │ │  │      ./tpuf query       │ ║░ │   ╚═══════════════════════════════╝░
 ░░░░░░░░░░░░   └──╦─┘ │  │┌─Memory Cache──────────┐│ ║░ │    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                   ║   │  ││■■■■■■■■■■             ││ ╠──┘
                   ║   └─▶│└───────────────────────┘│ ║░
                   ║      │┌─NVMe Cache────────────┐│ ║░
                   ║      ││■■■■■■■■■■■■■■■■■■■■■  ││ ║░
                   ║      │└───────────────────────┘│ ║░
                   ║      └─────────────────────────┘ ║░
                   ╚══════════════════════════════════╝░
                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

Vector indexes are based on [SPFresh](https://dl.acm.org/doi/10.1145/3600006.3613166). SPFresh is a centroid-based approximate nearest neighbour index.
It has a fast index for locating the nearest centroids to the query
vector. A centroid-based index works well for object storage as it
minimizes roundtrips and write-amplification, compared to
graph-based indexes like HNSW or DiskANN.

On a cold query, the centroid index is downloaded from object
storage. Once the closest centroids are located, we simply fetch
each cluster's offset in one, massive roundtrip to object storage.

/{org\_id}/{namespace}/index

centroids.bin

Namespace Config

clusters-1.bin

clusters-2.bin

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

In reality, there are more roundtrips required for turbopuffer to
support consistent writes and work on large indexes. From first
principles, each roundtrip to object storage takes ~100ms. The 3-4
required roundtrips for a cold query often take as little as ~400ms.

When the namespace is cached in NVME/memory rather than fetched
directly from object storage, the query time drops dramatically to
p50=14. The roundtrip to object storage for consistency,
which we can relax on request for eventually consistent sub 10ms queries.

Metadata1

Filter index

Centroid index

Unindexed WAL

Clusters

Roundtrip 1

Roundtrip 22

Roundtrip 3

Press enter or space to select a node.You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.

Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.

1. _Metadata is downloaded for the turbopuffer storage engine. The_
_storage engine is optimized for minimizing roundtrips._

2. _The second roundtrip starts navigating the first level of the_
_indexes. In many cases, only one additional roundtrip is required._
_But the query planner makes decisions about how to efficiently_
_navigate the indexes. It needs to settle tradeoffs between_
_additional roundtrips and fetching more data in an existing_
_roundtrip._


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