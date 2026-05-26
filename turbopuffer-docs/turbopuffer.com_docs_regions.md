---
url: "https://turbopuffer.com/docs/regions"
title: "Regions"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Regions

turbopuffer supports multiple regions, choose the one closest to your backend.

| Region | URL | Location | Browser RTT |
| --- | --- | --- | --- |
| gcp-us-east4 | https://gcp-us-east4.turbopuffer.com | N. Virginia | 01234567890123456789 ms |
| gcp-us-east1 | https://gcp-us-east1.turbopuffer.com | South Carolina | 01234567890123456789 ms |
| gcp-northamerica-northeast2 | https://gcp-northamerica-northeast2.turbopuffer.com | Toronto | 01234567890123456789 ms |
| gcp-us-central1 | https://gcp-us-central1.turbopuffer.com | Iowa | 01234567890123456789 ms |
| gcp-us-west1 | https://gcp-us-west1.turbopuffer.com | Oregon | 01234567890123456789 ms |
| gcp-europe-west1 | https://gcp-europe-west1.turbopuffer.com | Belgium | 01234567890123456789 ms |
| gcp-europe-west3 | https://gcp-europe-west3.turbopuffer.com | Frankfurt | 01234567890123456789 ms |
| gcp-asia-northeast3 | https://gcp-asia-northeast3.turbopuffer.com | Seoul | 012345678901234567890123456789 ms |
| gcp-asia-southeast1 | https://gcp-asia-southeast1.turbopuffer.com | Singapore | 012345678901234567890123456789 ms |
| aws-us-east-1 | https://aws-us-east-1.turbopuffer.com | N. Virginia | 0123456789 ms |
| aws-ca-central-1 | https://aws-ca-central-1.turbopuffer.com | Montreal | 01234567890123456789 ms |
| aws-us-east-2 | https://aws-us-east-2.turbopuffer.com | Ohio | 01234567890123456789 ms |
| aws-eu-central-1 | https://aws-eu-central-1.turbopuffer.com | Frankfurt | 01234567890123456789 ms |
| aws-eu-west-1 | https://aws-eu-west-1.turbopuffer.com | Ireland | 01234567890123456789 ms |
| aws-eu-west-2 | https://aws-eu-west-2.turbopuffer.com | London | 01234567890123456789 ms |
| aws-us-west-2 | https://aws-us-west-2.turbopuffer.com | Oregon | 01234567890123456789 ms |
| aws-sa-east-1 | https://aws-sa-east-1.turbopuffer.com | São Paulo | 012345678901234567890123456789 ms |
| aws-ap-south-1 | https://aws-ap-south-1.turbopuffer.com | Mumbai | 012345678901234567890123456789 ms |
| aws-ap-southeast-2 | https://aws-ap-southeast-2.turbopuffer.com | Sydney | 012345678901234567890123456789 ms |

We support Azure for "Deploy in your VPC", but no public regions yet. [Contact us](https://turbopuffer.com/contact) if you need a public Azure region.

In addition to these public clusters, we run dedicated clusters in various other
regions for single-tenancy customers and in any region inside your VPC in AWS,
GCP and Azure (BYOC). We can spin up dedicated or BYOC clusters in hours upon request, [contact\\
us](https://turbopuffer.com/contact). We will continue to expand public regions with
demand.

python

curlpythontypescriptgojavaruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    # Pick the right region: https://turbopuffer.com/docs/regions
    region='gcp-us-east4',
)

ns = tpuf.namespace(f'region-example-py')
```

To move data between regions, use [`copy_from_namespace`](https://turbopuffer.com/docs/write#param-copy_from_namespace) with a cross-region source. For granular control, use the [export](https://turbopuffer.com/docs/export) and [write](https://turbopuffer.com/docs/write) APIs with a client for each region.

## Cross-Cloud Latency

Since response times for vector search are typically above 10ms, the
contribution of cross-cloud latency is generally acceptable. Traffic within a
cloud provider's region is lower latency (< 1ms) than cross-cloud traffic
(1-10ms), even if the providers are geographically close. For larger
customers, cross-cloud interconnects can be set up to reduce network latency.

## Cross-Cloud Egress Fees

A common misconception is that as long as your vendor is in the same Cloud as
you (e.g. AWS ↔️ AWS), you will be charged lower networking fees. This is generally not the case,
as most providers' API endpoints point to public IPs that route through the
public internet, unless you've set up a private connect (see below; you'll know if you
have). Any traffic leaving your VPC incurs $0.05-0.09/GB Internet egress fees
( [AWS](https://aws.amazon.com/ec2/pricing/on-demand/) /
[GCP](https://cloud.google.com/vpc/network-pricing#all-networking-pricing)/
[Azure](https://azure.microsoft.com/en-us/pricing/details/bandwidth/)).

Egress networking fees are charged to you on your bill by your provider. For
larger customers, we will work with you to set up AWS Private Link, GCP Private
Service Connect, Azure Private Link or an interconnect to reduce networking fees
to $0.01/GB. Unless you're transferring tens of billions of vectors per month,
this is unlikely to have a large effect on your bill (1B vectors = 6TB would be
$600 of egress, not a significant issue).

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