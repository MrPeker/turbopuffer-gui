---
url: "https://turbopuffer.com/docs/security"
title: "Security & Compliance"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

# Security & Compliance

### Hosting

All customer data is hosted exclusively in the [region you\\
select](https://turbopuffer.com/docs/regions). Customer data inserted into one region remains in that
region, except when requested by the customer via the turbopuffer API. Customer
data and usage data is always encrypted in transit with TLS1.2+. Customer data
is always encrypted at rest with AES-256, and optionally with a [customer's\\
key](https://turbopuffer.com/docs/security#customer-managed-encryption-cmek).

### SOC2

turbopuffer undergoes System and Organization Controls (SOC) 2 Type 2 audits of
the design and operational effectiveness of security and availability controls.

You can request a copy of the latest SOC 2 report and Penetration Test
from our [Trust\\
Center](https://app.drata.com/trust/b4dc7714-f52d-4f50-97e3-ff56a41c2b5c).

### Data Protection (GDPR & CCPA)

turbopuffer provides a [Data Processing Addendum (DPA)](https://turbopuffer.com/dpa) for all customers
to enable compliance with the General Data Protection Regulation (GDPR) and the
California Consumer Privacy Act (CCPA).
The DPA describes our commitment to policies that comply with the requirements
of privacy laws on data processors, such as data deletion, breach notification,
and subprocessor management policies.

We're happy to assist with any additional questions you may have as part of your
privacy compliance processes.

### HIPAA

Customers who wish to store protected health information (PHI) in turbopuffer
may request a Business Associate Agreement (BAA) with turbopuffer, under which
turbopuffer commits to compliance with the requirements of HIPAA on business
associates that store and process PHI.

[Contact us](https://turbopuffer.com/contact) if you require a BAA or have further questions.

### Vulnerability Disclosure

See our [Vulnerability Disclosure policy](https://turbopuffer.com/docs/vdp).

### Customer managed encryption (CMEK)

turbopuffer offers support for [customer managed encryption\\
keys](https://turbopuffer.com/docs/cmek) (CMEK), allowing customers on the [Enterprise](https://turbopuffer.com/pricing) plan
to ensure their data is encrypted using keys from their Key Management System
(KMS)/Enterprise Key Manager (EKM).

This _also_ allow customer's customers to use their own KMS to encrypt their
data, as the [encryption key is defined at the namespace level.](https://turbopuffer.com/docs/write)

This gives a customer or a customer's customer the same control over their data
as they would have if they were to host their own data in their own bucket.

[Get started with CMEK.](https://turbopuffer.com/docs/cmek)

### Private networking

turbopuffer supports private network connections between customer VPCs
and our [multi-tenant regions](https://turbopuffer.com/docs/regions). This feature is available to
customers on the [Enterprise](https://turbopuffer.com/pricing) plan.

- AWS regions use [AWS PrivateLink](https://aws.amazon.com/privatelink/)
- GCP regions use [GCP Private Service Connect](https://cloud.google.com/vpc/docs/private-service-connect)

[Get started with private networking.](https://turbopuffer.com/docs/private-networking)

### Subprocessors for Customer Data

| Subprocessor | Purpose of Processing | Subprocessor Country | Data Hosting Location |
| --- | --- | --- | --- |
| **Google LLC** (GCP) | Compute and storage | United States | Customer-selected region |
| **Amazon Web Services** (AWS) | Compute and storage | United States | Customer-selected region |

[Subscribe to subprocessor update notifications for when we engage new customer\\
data subprocessors.](https://turbopuffer.com/dashboard/subprocessor-subscribe)

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)