---
url: "https://turbopuffer.com/docs/private-networking"
title: "Private Networking"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Private Networking

```

    ┌─────your VPC───────────────┐                  ┌─────tpuf VPC───────────────┐
    │                            │░                 │                            │░
    │ ┌─────────┐ ┌─────────┐    │░                 │    ┌─────────┐ ┌─────────┐ │░
    │ │ client  │ │ client  │ ◀──┼──────────────────┼──▶ │ storage │ │ compute │ │░
    │ └─────────┘ └─────────┘    │░  PrivateLink/   │    └─────────┘ └─────────┘ │░
    │                            │░      PSC        │                            │░
    └────────────────────────────┘░                 └────────────────────────────┘░
     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
┌──your VPC───────────────┐
│                         │░
│ ┌─────────┐ ┌─────────┐ │░
│ │ client  │ │ client  │◀┼───┐
│ └─────────┘ └─────────┘ │░  |
│                         │░  |
└─────────────────────────┘░  |
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░  |
                              |
              PrivateLink/PSC |
                              |
┌──tpuf VPC───────────────┐   |
│                         │░  |
│ ┌─────────┐ ┌─────────┐ │░  |
│ │ storage │ │ compute │◀┼───┘
│ └─────────┘ └─────────┘ │░
│                         │░
└─────────────────────────┘░
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

turbopuffer supports private network connections between your VPC
and our [multi-tenant regions](https://turbopuffer.com/docs/regions).

- AWS regions use [AWS PrivateLink](https://aws.amazon.com/privatelink/)
- GCP regions use [GCP Private Service Connect](https://cloud.google.com/vpc/docs/private-service-connect)

Private network connection across cloud providers (e.g. AWS => GCP) are
not supported. [Contact us](https://turbopuffer.com/contact/support) if you need this.

## Enforcement

By default, even after establishing a private network connection to a region,
API requests for your organization will still be permitted via the public
endpoint for the region.

Upon request, turbopuffer can enforce that all API requests for an organization
are made via your private endpoints.

## Pricing

- Private networking is only available on the [enterprise plan](https://turbopuffer.com/pricing).
- There are no usage-based fees for private network endpoints.

## Setup

1. Provide [turbopuffer support](https://turbopuffer.com/contact/support) with:
   - Your AWS account ID or your GCP project ID
   - The [region](https://turbopuffer.com/docs/regions) you want to establish a private connections to
2. Wait for turbopuffer to authorize connections from your cloud account

3. Establish a private network connection to the service name provided by turbopuffer support
   - **AWS:** [Create an interface VPC endpoint](https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html)
   - **GCP:** [Create a Private Service Connect endpoint](https://cloud.google.com/vpc/docs/create-manage-private-service-connect-interfaces)
4. Set the `base_url` in your client to the private endpoint for your region (see table below)


| Region | Private Endpoint |
| --- | --- |
| aws-ap-southeast-2 | https://privatelink.aws-ap-southeast-2.turbopuffer.com |
| aws-ca-central-1 | https://privatelink.aws-ca-central-1.turbopuffer.com |
| aws-eu-central-1 | https://privatelink.aws-eu-central-1.turbopuffer.com |
| aws-eu-west-1 | https://privatelink.aws-eu-west-1.turbopuffer.com |
| aws-eu-west-2 | https://privatelink.aws-eu-west-2.turbopuffer.com |
| aws-us-east-1 | https://privatelink.aws-us-east-1.turbopuffer.com |
| aws-us-east-2 | https://privatelink.aws-us-east-2.turbopuffer.com |
| aws-us-west-2 | https://privatelink.aws-us-west-2.turbopuffer.com |
| aws-ap-south-1 | https://privatelink.aws-ap-south-1.turbopuffer.com |
| aws-sa-east-1 | https://privatelink.aws-sa-east-1.turbopuffer.com |
| gcp-us-central1 | https://<endpoint name>.psc.gcp-us-central1.turbopuffer.com |
| gcp-us-east1 | https://<endpoint name>.psc.gcp-us-east1.turbopuffer.com |
| gcp-us-west1 | https://<endpoint name>.psc.gcp-us-west1.turbopuffer.com |
| gcp-us-east4 | https://<endpoint name>.psc.gcp-us-east4.turbopuffer.com |
| gcp-northamerica-northeast2 | https://<endpoint name>.psc.gcp-northamerica-northeast2.turbopuffer.com |
| gcp-europe-west3 | https://<endpoint name>.psc.gcp-europe-west3.turbopuffer.com |
| gcp-europe-west1 | https://<endpoint name>.psc.gcp-europe-west1.turbopuffer.com |
| gcp-asia-southeast1 | https://<endpoint name>.psc.gcp-asia-southeast1.turbopuffer.com |
| gcp-asia-northeast3 | https://<endpoint name>.psc.gcp-asia-northeast3.turbopuffer.com |

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