---
url: "https://turbopuffer.com/docs/private-networking"
title: "Private Networking"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

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
| aws-ap-southeast-2 | https://privatelink.ap-southeast-2.turbopuffer.com |
| aws-ca-central-1 | https://privatelink.ca-central-1.turbopuffer.com |
| aws-eu-central-1 | https://privatelink.eu-central-1.turbopuffer.com |
| aws-eu-west-1 | https://privatelink.eu-west-1.turbopuffer.com |
| aws-us-east-1 | https://privatelink.us-east-1.turbopuffer.com |
| aws-us-east-2 | https://privatelink.us-east-2.turbopuffer.com |
| aws-us-west-2 | https://privatelink.us-west-2.turbopuffer.com |
| aws-ap-south-1 | https://privatelink.ap-south-1.turbopuffer.com |
| gcp-us-central1 | https://psc.us-central1.turbopuffer.com |
| gcp-us-west1 | https://psc.us-west1.turbopuffer.com |
| gcp-us-east4 | https://psc.us-east4.turbopuffer.com |
| gcp-northamerica-northeast2 | https://psc.northamerica-northeast2.turbopuffer.com |
| gcp-europe-west3 | https://psc.europe-west3.turbopuffer.com |
| gcp-asia-southeast1 | https://psc.asia-southeast1.turbopuffer.com |
| gcp-asia-northeast3 | https://psc.asia-northeast3.turbopuffer.com |

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)