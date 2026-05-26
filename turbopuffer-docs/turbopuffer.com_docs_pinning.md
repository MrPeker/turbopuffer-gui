---
url: "https://turbopuffer.com/docs/pinning"
title: "Namespace Pinning"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Namespace Pinning

```
                   ╔══turbopuffer region═════╗      ╔═══Object Storage═════════════════╗
                   ║      ┌────────────────┐ ║░     ║ ┏━━Indexing Queue━━━━━━━━━━━━━━┓ ║░
                   ║   ┌─▶│  ./tpuf query  │ ║░     ║ ┃■■■■■■■■■                     ┃ ║░
                ┌──╩─┐ │  └────────────────┘ ║░     ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
╔══════════╗    │    │ │  ┌────────────────┐ ║░     ║ ┏━/{org_id}/{namespace}━━━━━━━━┓ ║░
║  Client  ║───▶│ LB │─┼─▶│  ./tpuf query  │─╬─────▶║ ┃ ┏━/wal━━━━━━━━━━━━━━━━━━━━━┓ ┃ ║░
╚══════════╝░   │    │ │  └────────────────┘ ║░     ║ ┃ ┃■■■■■■■■■■■■■■■◈◈◈◈       ┃ ┃ ║░
 ░░░░░░░░░░░░   └──╦─┘ │  ┌────────────────┐ ║░     ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
                   ║   │─▶│  ./tpuf query  │ ║░     ║ ┃ ┏━/index━━━━━━━━━━━━━━━━━━━┓ ┃ ║░
                   ║   │  │ [pin:org1/nsA] │ ║░     ║ ┃ ┃■■■■■■■■■■■■■■■           ┃ ┃ ║░
                   ║   │  └────────────────┘ ║░     ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
                   ║   │  ┌────────────────┐ ║░     ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
                   ║   └─▶│  ./tpuf query  │ ║░     ╚══════════════════════════════════╝░
                   ║      │ [pin:org2/nsY] │ ║░      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                   ║      └────────────────┘ ║░
                   ╚═════════════════════════╝░
                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░

```

```
                   ╔══turbopuffer region═════╗      ╔═══Object Storage═════════════════╗
                   ║      ┌────────────────┐ ║░     ║ ┏━━Indexing Queue━━━━━━━━━━━━━━┓ ║░
                   ║   ┌─▶│  ./tpuf query  │ ║░     ║ ┃■■■■■■■■■                     ┃ ║░
                ┌──╩─┐ │  └────────────────┘ ║░     ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
╔══════════╗    │    │ │  ┌────────────────┐ ║░     ║ ┏━/{org_id}/{namespace}━━━━━━━━┓ ║░
║  Client  ║───▶│ LB │─┼─▶│  ./tpuf query  │─╬─────▶║ ┃ ┏━/wal━━━━━━━━━━━━━━━━━━━━━┓ ┃ ║░
╚══════════╝░   │    │ │  └────────────────┘ ║░     ║ ┃ ┃■■■■■■■■■■■■■■■◈◈◈◈       ┃ ┃ ║░
 ░░░░░░░░░░░░   └──╦─┘ │  ┌────────────────┐ ║░     ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
                   ║   │─▶│  ./tpuf query  │ ║░     ║ ┃ ┏━/index━━━━━━━━━━━━━━━━━━━┓ ┃ ║░
                   ║   │  │ [pin:org1/nsA] │ ║░     ║ ┃ ┃■■■■■■■■■■■■■■■           ┃ ┃ ║░
                   ║   │  └────────────────┘ ║░     ║ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ║░
                   ║   │  ┌────────────────┐ ║░     ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
                   ║   └─▶│  ./tpuf query  │ ║░     ╚══════════════════════════════════╝░
                   ║      │ [pin:org2/nsY] │ ║░      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                   ║      └────────────────┘ ║░
                   ╚═════════════════════════╝░
                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░

```

By default, namespaces run on turbopuffer's shared, multi-tenant query
infrastructure. That is the right choice for most workloads.

**Namespace pinning** reserves compute and NVMe SSD cache for a specific
namespace. Once pinned, that namespace's queries run on those reserved
resources, so its data stays hot, cost and performance stay predictable, and
sustained high query volume is often much cheaper.

## Multi-tenant vs. pinned

- **Multi-tenant** (default): Shared compute and cache. This is the simplest and
most cost-effective option for most namespaces. Smart caching adapts to traffic
patterns to minimize query latency. For spiky traffic, you can [warm the\\
cache](https://turbopuffer.com/docs/warm-cache) to reduce cold starts.

- **Pinned**: Reserved compute and NVMe SSD cache for one namespace. This keeps
the hot path warm and gives large, busy namespaces more predictable throughput,
latency, and cost.

Pinning also changes billing: instead of per-query ( **TB Queried**) pricing,
pinned namespaces are billed by **GB-hours** based on namespace size and how
long the namespace stays pinned. That means the effective cost per query goes
down as query volume goes up, with a break-even point typically around 10
queries per second.


## When to use pinning

Pinning is a good fit when:

- **You run sustained high query volume** on a namespace, where **GB-hours** are
cheaper than paying per query.
- **You want predictable query latency** on a namespace, where occasional cold
queries would hurt your product.
- **You want predictable cost** on a namespace, where **GB-hours** are easier
to forecast than per-query **TB Queried**.

For many small or naturally sharded namespaces, the default multi-tenant path
is still the best choice.

As a rule of thumb, pinning is worth evaluating when a large (>16 GB) namespace
sustains above 10 queries per second and you want more predictable cost and
performance.

## How it works

1. You turn pinning on for an existing namespace via the [metadata\\
API](https://turbopuffer.com/docs/metadata#change-metadata).
2. turbopuffer loads the namespace into the SSD cache of reserved [query\\
nodes](https://turbopuffer.com/docs/concepts#query-and-indexing-nodes).
3. All queries for that namespace route to those query nodes.
4. The namespace stays hot on those reserved SSDs for as long as it stays
pinned.

Pinning usually takes less than 30 minutes. During that time, queries continue
to work on the existing path with no downtime.

Pinning does not change durability: data remains stored durably in object
storage whether pinned or not.

### Replicas

Replicas increase read throughput.

Each replica runs on its own reserved [query node](https://turbopuffer.com/docs/concepts#query-and-indexing-nodes),
and reads are load-balanced across them. Throughput scales linearly with replica
count.

A single replica can handle between 100 and 1000 QPS, depending on query shape,
filters, and namespace size. Filtered vector and full-text search queries fall
in the middle of this range.

To decide when to add replicas, monitor `pinning.status.utilization` on `GET /v1/namespaces/:namespace/metadata` (see [Metadata](https://turbopuffer.com/docs/metadata#view-metadata)).
If utilization stays high or if queries return `HTTP 429 (Too Many Requests)`
errors, add more replicas to increase read capacity.

Replicas do not currently autoscale for a pinned namespace. Support for this is
planned.

Replicas also improve fault tolerance. If a replica hits a hardware failure,
turbopuffer will fail over and rewarm a new replica. With multiple replicas,
this is less likely to result in cold query latency reaching your application.
If you are okay with cold latency for a few minutes during a cloud hardware
failure, you do not need multiple replicas.

## Pricing

Pinned namespaces are billed by **GB-hours**:

`namespace size (GB) × replicas × hours pinned`

Queries served by a pinned namespace are not subject to **TB Queried**
usage-based pricing. At sustained query volume, this often makes individual
queries much cheaper than per-query pricing. Exact break-even depends on your
workload.

Billing has a floor of **64 GB** and **10 minutes**. A pinned namespace smaller
than 64 GB is billed as 64 GB, and a namespace pinned for less than 10 minutes
is billed for 10 minutes.

Use the calculator below to compare multi-tenant and pinned pricing based on
namespace size and QPS.

### Pinning cost calculator

|  |  |
| --- | --- |
| Namespace size<br>256 GB | 16 GB32 GB64 GB128 GB256 GB512 GB768 GB1 TB1.5 TB2 TB3 TB4 TB<br>256 GB |
| Queries per second<br>50 QPS | 1020501002005001000500010k<br>50 QPS |

Multi-tenant (per-query)

$7,498/mo

Storage (standard): $84.48Queries: $7,414

Pinned (GB-hours)

$2,573/mo

Storage (pinned): $2,476Storage (standard): $84.48Queries (bytes scanned): IncludedQueries (bytes returned): $13.14Replicas: 1at 500 QPS each

Pinning is2.9x cheaperfor this workload

## Configuration

Configure pinning with `PATCH /v1/namespaces/:namespace/metadata` (see
[Metadata](https://turbopuffer.com/docs/metadata#change-metadata)).

Set `pinning` to `true` to pin with default settings and 1 replica.

Set `pinning` to `null` to unpin.

Inspect current settings with `GET /v1/namespaces/:namespace/metadata`.

**Example: Enable pinning with 2 replicas**

python

curlpythontypescriptgojavac#ruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace(f'pinning-enable-example-py')
ns.update_metadata(
    pinning={
        'replicas': 2,
    }
)
```

**Example: Disable pinning**

python

curlpythontypescriptgojavac#ruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace(f'pinning-disable-example-py')
ns.update_metadata(pinning=None)
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