![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Setting up CMEK encryption with an EKM

===============

[Now open for all, let's get you puffin'turbopuffer is generally available, let's get you puffin'](https://turbopuffer.com/join)

Navigation
----------

[![Image 4: Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

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

On this page

*   [Enabling CMEK](https://turbopuffer.com/docs/cmek#enabling-cmek)
*   [When do I provide the encryption key?](https://turbopuffer.com/docs/cmek#when-do-i-provide-the-encryption-key)
*   [Does CMEK impact latency or availability?](https://turbopuffer.com/docs/cmek#does-cmek-impact-latency-or-availability)
*   [What does it cost?](https://turbopuffer.com/docs/cmek#what-does-it-cost)
*   [Does turbopuffer support key rotation?](https://turbopuffer.com/docs/cmek#does-turbopuffer-support-key-rotation)

Setting up CMEK encryption with an EKM
======================================

```
┌─────tpuf bucket────────────┐                                      
                   │  ┌────────────────────┐    │░                                     
                   │  │    namespace a     │    │░           ┌───your cloud───────────┐
──────write────────┼─▶│  (AES-256, Cloud   │    │░           │ ┌──EKM-A─────────────┐ │
                   │  │    managed key)    │    │░           │ │ ╔══════╗  ┌──────┐ │ │
                   │  └────────────────────┘    │░    ┌──────┼─┼▶║key-1 ║  │key-2 │ │ │
      write        │  ┌────────────────────┐    │░    │      │ │ ╚══════╝  └──────┘ │ │
──/EKM-A/key-1─────┼─▶│    namespace b     │    │░    │      │ └────────────────────┘ │
                   │  │(AES-256, Your Key) │◀───┼─────┘      └────────────────────────┘
                   │  │                    │    │░                                     
                   │  └────────────────────┘    │░           ┌───your customer's cloud┐
                   │  ┌────────────────────┐    │░           │ ┌─EKM-B──────────────┐ │
      write        │  │    namespace C     │    │░           │ │ ╔══════╗  ┌──────┐ │ │
──/EKM-B/key-3─────┼─▶│   (AES-256, Your   │◀───┼────────────┼─┼▶║key-3 ║  │key-4 │ │ │
                   │  │  Customer's Key)   │    │░           │ │ ╚══════╝  └──────┘ │ │
                   │  └────────────────────┘    │░           │ └────────────────────┘ │
                   └────────────────────────────┘░           └────────────────────────┘
                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

By default, all data at rest is encrypted using AES-256 using the cloud provider's managed keys.

turbopuffer also supports [customer managed encryption keys](https://turbopuffer.com/docs/write#parameters) (CMEK) for [scale](https://turbopuffer.com/pricing) and [enterprise](https://turbopuffer.com/pricing) customers. When using CMEK, writes provide a key name (GCP resource ID or AWS ARN) identifying an encryption key in the customer's key management system (customer KMS) also known as External Key Manager (EKM). All namespace objects will then be encrypted with this customer provided key, which can be revoked at any time.

### [](https://turbopuffer.com/docs/cmek#enabling-cmek)Enabling CMEK

1.   Ensure you are on the [scale](https://turbopuffer.com/pricing) or [enterprise](https://turbopuffer.com/pricing) plan.

2.   Open your cloud Provider's Console and create a KMS/EKM in the same region as the turbopuffer region(s) you're using.

3.   Ask turbopuffer support to get the turbopuffer Service Account email (GCP) or account ARN (AWS).

4.   Grant turbopuffer access to the key:

*   On GCP, edit the _Key Ring_ and grant the Permission `Cloud KMS CryptoKey Encrypter/Decrypter` to the turbopuffer service account email.
*   On AWS, edit the _Key Policy_ to add the following statement:

```json
{
    "Sid": "KeyUsage",
    "Effect": "Allow",
    "Principal": {
      "AWS": "<provided by turbopuffer>"
    },
    "Action": [
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:Encrypt",
      "kms:DescribeKey",
      "kms:Decrypt"
    ],
    "Resource": "*"
  }
```

1.   Use the key name to [write](https://turbopuffer.com/docs/write#param-encryption) to your turbopuffer namespace.

### [](https://turbopuffer.com/docs/cmek#when-do-i-provide-the-encryption-key)When do I provide the encryption key?

The encryption key only needs to be provided on [writes](https://turbopuffer.com/docs/write#param-encryption). All future writes will use the previously sent encryption key, which cannot be changed after the first upsert. Queries do not need to provide the encryption key; the underlying object store will transparently decrypt objects so long as turbopuffer maintains permission to use your keys.

### [](https://turbopuffer.com/docs/cmek#does-cmek-impact-latency-or-availability)Does CMEK impact latency or availability?

No, CMEK does not impact either availability or performance of turbopuffer.

### [](https://turbopuffer.com/docs/cmek#what-does-it-cost)What does it cost?

On the turbopuffer side, there is no additional cost to using CMEK on top of your plan.

The cloud will charge you based on encryption operations and the number of keys.

### [](https://turbopuffer.com/docs/cmek#does-turbopuffer-support-key-rotation)Does turbopuffer support key rotation?

When you rotate your cloud KMS key, turbopuffer will automatically use the latest active key version for new writes. However, turbopuffer does not automatically re-encrypt existing data. This means:

*   Data written before rotation remains encrypted with the previous key version
*   New data will be encrypted with the latest key version
*   You must keep all previously used key versions active to maintain access to older data
*   Revoking previous key versions will make that namespace permanently inaccessible

If you need to migrate all data to a new key version, use the [export](https://turbopuffer.com/docs/export) API to re-upsert your data into a new namespace with the desired encryption configuration. **Should you find this limiting, contact us, we should be able to improve ease of key rotation**.

![Image 5: turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about)[Pricing](https://turbopuffer.com/pricing)[Press & media](https://turbopuffer.com/press)[System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-2bro3fb5j-6Ys5st9UFDrm7qXQw_S9Rw)[Docs](https://turbopuffer.com/docs)[Email](https://turbopuffer.com/contact/support)[Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

[](https://x.com/turbopuffer)[](https://www.linkedin.com/company/turbopuffer/)[](https://bsky.app/profile/turbopuffer.bsky.social)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service)[Data Processing Agreement](https://turbopuffer.com/dpa)[Privacy Policy](https://turbopuffer.com/privacy-policy)[Security & Compliance](https://turbopuffer.com/docs/security)

[* SOC2 Type 2 certified * HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")
