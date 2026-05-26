---
url: "https://turbopuffer.com/docs/metadata"
title: "Metadata"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

## View Metadata

# GET /v1/namespaces/:namespace/metadata

Returns metadata about a namespace.

## Response

**schema** object

See the [schema documentation](https://turbopuffer.com/docs/write#schema).

* * *

**approx\_logical\_bytes** integer

The approximate number of logical bytes in the namespace.

This is a coarse approximation and may change over time as turbopuffer's
data representation evolves.

When using [`disable_backpressure`](https://turbopuffer.com/docs/write#param-disable_backpressure), this metric will not be updated until all data has been indexed.

* * *

**approx\_row\_count** integer

The approximate number of rows in the namespace.

When using [`disable_backpressure`](https://turbopuffer.com/docs/write#param-disable_backpressure), this metric will not be updated until all data has been indexed.

* * *

**created\_at** string

The timestamp when the namespace was created, in ISO 8601 format.

Example: `"2024-03-15T10:30:45Z"`

* * *

**last\_write\_at** string

The timestamp when the namespace's data was last modified, in ISO 8601 format.

Example: `"2024-03-19T09:12:14Z"`

* * *

**updated\_at** string

The timestamp when the namespace when the namespace's data or schema
was last modified, in ISO 8601 format.

Example: `"2024-04-16T09:27:32Z"`

* * *

**encryption** object

Describes how the namespace is encrypted.

- Default server-side encryption: `{ "mode": "default" }`
- [CMEK](https://turbopuffer.com/docs/cmek): `{ "mode": "customer-managed", "key_name": "…" }`

```jsonc
  // GCP Example
  { "mode": "customer-managed",
    "key_name": "projects/myproject/locations/us-central1/keyRings/EXAMPLE/cryptoKeys/KEYNAME" }
  // AWS Example
  { "mode": "customer-managed",
    "key_name": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012" }
```

* * *

**index** object

The state of the [index](https://turbopuffer.com/docs/architecture) for the namespace. Contains the
following fields:

- `status` (string): `updating` or `up-to-date`

- `unindexed_bytes` (integer):

The number of bytes in the namespace that are in the [write-ahead log](https://turbopuffer.com/docs/architecture)
but have not yet been indexed. Note that unindexed data is still searched by queries
(see [consistency](https://turbopuffer.com/docs/query#param-consistency) for details).

Only present when `status` is `updating`.


* * *

**pinning** object

[Namespace pinning](https://turbopuffer.com/docs/pinning) provisions reserved compute for a namespace
to provide predictable cost and performance for large namespaces with sustained
query volume, with always-warm cache.

Only present when the namespace is pinned.

Contains the following fields:

- `replicas` (integer): The number of read replicas configured for the namespace.
Each replica increases read throughput.

- `status` (object): Operational status for the pinned namespace. When
available, includes the number of `ready_replicas` that are warm and able to
serve traffic, along with the average `utilization` of all ready replicas.

When `utilization` exceeds 90%, consider increasing replica count.


Example: `{ "replicas": 2, "status": { "ready_replicas": 1, "utilization": 0.73 } }`

* * *

**branching** object

The state of [branching](https://turbopuffer.com/docs/branching) for the namespace. Only present for
branched namespaces. Contains the following fields:

- `parent` (string): The namespace this was branched from.

## Example

python

curlpythontypescriptgojavac#ruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region="gcp-us-central1",  # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace(f"metadata-inspect-example-py")

metadata = ns.metadata()
print(metadata)  # returns a turbopuffer.NamespaceMetadata object
```

## Billing

This request is billed as a query that returns zero rows.

* * *

## Change Metadata

# PATCH /v1/namespaces/:namespace/metadata

Updates metadata configuration for a namespace.

Updates the configuration for a namespace.

Currently used to configure [namespace pinning](https://turbopuffer.com/docs/pinning).

### Request

**pinning** object

Configuration for [namespace pinning](https://turbopuffer.com/docs/pinning), which provisions reserved
compute for a namespace to provide predictable cost and performance for large
namespaces with sustained query volume, with always-warm cache.

Set to `null` to remove pinning from a namespace.

Contains the following fields:

- `replicas` (integer, optional): The number of read replicas to provision.
Defaults to `1`. Each replica runs on its own reserved node, increases read
throughput, and multiplies pinning cost.

**Example (enable pinning):**

```json
{
  "pinning": {
    "replicas": 2
  }
}
```

You can also enable pinning with the defaults (1 replica):

```json
{
  "pinning": true
}
```

**Example (disable pinning):**

```json
{
  "pinning": null
}
```

### Response

Returns the updated namespace metadata. See [View Metadata](https://turbopuffer.com/docs/metadata#view-metadata) response
fields for details.

### Billing

This request is billed as a query that returns zero rows.

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