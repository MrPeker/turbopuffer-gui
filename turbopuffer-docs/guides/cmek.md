# Setting up CMEK encryption with an EKM

By default, all data at rest is encrypted using AES-256 using the cloud provider's managed keys.

turbopuffer also supports customer managed encryption keys (CMEK) for scale and enterprise customers. When using CMEK, writes provide a key name (GCP resource ID or AWS ARN) identifying an encryption key in the customer's key management system (customer KMS) also known as External Key Manager (EKM). All namespace objects will then be encrypted with this customer provided key, which can be revoked at any time.

### Enabling CMEK

1. Ensure you are on the scale or enterprise plan.
2. Open your cloud Provider's Console and create a KMS/EKM in the same region as the turbopuffer region(s) you're using.
3. Ask turbopuffer support to get the turbopuffer Service Account email (GCP) or account ARN (AWS).
4. Grant turbopuffer access to the key:

**On GCP**: edit the Key Ring and grant the Permission Cloud KMS CryptoKey Encrypter/Decrypter to the turbopuffer service account email.

**On AWS**: edit the Key Policy to add the following statement:

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

5. Use the key name to write to your turbopuffer namespace.

### When do I provide the encryption key?

The encryption key name only needs to be provided on writes. All future writes will use the previously sent encryption key name, which cannot be changed after the first upsert. Queries do not need to provide the encryption key name; the underlying object store will transparently decrypt objects so long as turbopuffer maintains permission to use your keys.

### Does CMEK impact latency or availability?

No, CMEK does not impact either availability or performance of turbopuffer.

### What does it cost?

On the turbopuffer side, there is no additional cost to using CMEK on top of your plan.

The cloud will charge you based on encryption operations and the number of keys.

### Who is doing the encryption?

Encryption of the data at rest is handled entirely by the cloud object store.

* **AWS S3** - data is stored with Server-Side Encryption using AWS KMS-managed keys
* **Google Cloud Storage** - data is stored with GCS's CMEK.

### Does turbopuffer support key rotation?

When you rotate your cloud KMS key, turbopuffer will automatically use the latest active key version for new writes. However, turbopuffer does not automatically re-encrypt existing data. This means:

* Data written before rotation remains encrypted with the previous key version
* New data will be encrypted with the latest key version
* You must keep all previously used key versions active to maintain access to older data
* Revoking previous key versions will make that namespace permanently inaccessible

If you need to migrate all data to a new key version, use the export API to re-upsert your data into a new namespace with the desired encryption configuration.