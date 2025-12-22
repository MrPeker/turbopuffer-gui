---
url: "https://turbopuffer.com/docs/cmek"
title: "Setting up CMEK encryption with an EKM"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

# Setting up CMEK encryption with an EKM

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

```
┌─tpuf bucket────────────┐
│ ┌────────────────────┐ │░
│ │   namespace a      │ │░
│ │ (AES-256, Cloud    │ │░
│ │  managed key)      │ │░
│ └────────────────────┘ │░
│ ┌────────────────────┐ │░
│ │   namespace b      │ │░
│ │(AES-256, Your Key) │◀┼─┐
│ └────────────────────┘ │░│
│ ┌────────────────────┐ │░│
│ │   namespace C      │ │░│
│ │ (AES-256, Your     │◀┼─┼─┐
│ │ Customer's Key)    │ │░│ │
│ └────────────────────┘ │░│ │
└────────────────────────┘░│ │
 ░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
                           │ │
┌─your cloud─────────────┐ │ │
│ ┌─EKM-A─────────────┐ │  │ │
│ │ ╔══════╗ ┌──────┐ │ │──┘ │
│ │ ║key-1 ║ │key-2 │ │ │    │
│ │ ╚══════╝ └──────┘ │ │    │
│ └───────────────────┘ │    │
└───────────────────────┘    │
                             │
┌─your customer's cloud─┐    │
│ ┌─EKM-B──────────────┐│    │
│ │ ╔══════╗ ┌──────┐  ││────┘
│ │ ║key-3 ║ │key-4 │  ││
│ │ ╚══════╝ └──────┘  ││
│ └────────────────────┘│
└───────────────────────┘
```

By default, all data at rest is encrypted using AES-256 using the cloud
provider's managed keys.

turbopuffer supports [customer managed encryption keys](https://turbopuffer.com/docs/write#parameters)
(CMEK) for [enterprise](https://turbopuffer.com/pricing) customers. CMEK encryption allows customer and
customer's customer the similar control of their data as if it was in their own
bucket. CMEK can often be used in place of self-hosting with simpler
operational requirements.

When using CMEK, writes provide a key name (GCP resource ID or AWS ARN)
identifying an encryption key in the customer's key management system (customer
KMS) also known as External Key Manager (EKM). All namespace objects will then
be encrypted with this customer provided key, which can be revoked at any time.

### Enabling CMEK

1. Ensure you are on the [enterprise](https://turbopuffer.com/pricing) plan.

2. Open your cloud Provider's Console and create a KMS/EKM in the same region as
the turbopuffer region(s) you're using.

3. Ask turbopuffer support to get the turbopuffer Service Account email (GCP) or
account ARN (AWS).

4. Grant turbopuffer access to the key:


- On GCP, edit the _Key Ring_ and grant the Permission `Cloud KMS CryptoKey Encrypter/Decrypter` to the turbopuffer service account email.
- On AWS, edit the _Key Policy_ to add the following statement:

```json
  {
    "Sid": "KeyUsage",
    "Effect": "Allow",
    "Principal": {
      "AWS": "<provided by turbopuffer>"
    },
    "Action": [\
      "kms:ReEncrypt*",\
      "kms:GenerateDataKey*",\
      "kms:Encrypt",\
      "kms:DescribeKey",\
      "kms:Decrypt"\
    ],
    "Resource": "*"
  }
```

5. Use the key name to [write](https://turbopuffer.com/docs/write#param-encryption) to your turbopuffer
namespace.

### When do I provide the encryption key?

The encryption key name only needs to be provided on
[writes](https://turbopuffer.com/docs/write#param-encryption). All future writes will use the
previously sent encryption key name, which cannot be changed after the first upsert.
Queries do not need to provide the encryption key name; the underlying object store
will transparently decrypt objects so long as turbopuffer maintains
permission to use your keys.

### Does CMEK impact latency or availability?

No, CMEK does not impact either availability or performance of turbopuffer.

### What does it cost?

On the turbopuffer side, there is no additional cost to using CMEK on top of your plan.

Your cloud provider will charge you based on the number of encryption operations and the number of keys.

### Who is doing the encryption?

Encryption of the data at rest is handled entirely by the cloud object store.

- AWS S3 - data is stored with [Server-Side Encryption using AWS KMS-managed keys](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html)
- Google Cloud Storage - data is stored with GCS's [CMEK](https://cloud.google.com/storage/docs/encryption/customer-managed-keys).

### Does turbopuffer support key rotation?

When you rotate your cloud KMS key, turbopuffer will automatically use the
latest active key version for new writes. However, turbopuffer does not
automatically re-encrypt existing data. This means:

- Data written before rotation remains encrypted with the previous key version
- New data will be encrypted with the latest key version
- You must keep all previously used key versions active to maintain access to
older data
- Revoking previous key versions will make that namespace permanently inaccessible

If you need to migrate all data to a new key version, you have two options:

1. Use the [export](https://turbopuffer.com/docs/export) API to re-upsert your data into a new namespace with the desired encryption configuration
2. Use [`copy_from_namespace`](https://turbopuffer.com/docs/write#param-copy_from_namespace) with a different `encryption` parameter to copy the namespace with a new CMEK key

The second option is faster and more cost-effective, with up to a 75% write discount. It also works for upgrading an unencrypted (SSE) namespace to CMEK encryption.

**Should you find this limiting, [contact us](https://turbopuffer.com/contact)**

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)