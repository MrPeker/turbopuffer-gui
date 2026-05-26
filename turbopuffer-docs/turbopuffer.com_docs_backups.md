---
url: "https://turbopuffer.com/docs/backups"
title: "Cross-Region Backups"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Cross-Region Backups

```
  ┌─aws-us-east-1 (source)─────┐              ┌─aws-us-west-2 (dest)───┐
  │                            │░             │                        │░
  │  ┌──────────────────────┐  │░             │  ┌──────────────────┐  │░
  │  │    my-namespace      │  │░ ──────────▶ │  │ my-namespace-copy│  │░
  │  └──────────────────────┘  │░             │  └──────────────────┘  │░
  │                            │░             │            ▲           │░
  └────────────────────────────┘░             └────────────┼───────────┘░
   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░              ░░░░░░░░░░░░│░░░░░░░░░░░░░
                                                           │
                                     ──copy_from_namespace─┘
```

```
┌─aws-us-east-1 (source)──────┐
│  ┌───────────────────────┐  │░
│  │    my-namespace       │  │░
│  └───────────────────────┘  │░
└─────────────────────────────┘░
 ░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░
              ▼
┌─aws-us-west-2 (dest)────────┐
│  ┌───────────────────────┐  │░
│  │  my-namespace-copy    │  │░
│  └───────────────────────┘  │░
└─────────────┬───────────────┘░
 ░░░░░░░░░░░░░│░░░░░░░░░░░░░░░░░
              │
──copy_from_namespace
```

turbopuffer supports efficient namespace copies across [regions](https://turbopuffer.com/docs/regions) via
[copy\_from\_namespace](https://turbopuffer.com/docs/write#param-copy_from_namespace) for geo-redundancy,
disaster recovery, and accidental deletion protection. We don't currently offer automated backups. Historically,
customers have rebuilt from their primary data source when needed, but
cross-region copies are now often a better option.

[Branching](https://turbopuffer.com/docs/branching) provides constant-time namespace snapshots, but
shares underlying storage with the source namespace. Use `copy_from_namespace`
for full data isolation.

Copies are performed entirely server-side, so there's no data transfer through
your infrastructure. They're billed at up to a 75% write discount and create fully
writable namespaces you can use however you like. Cross-region copies also bill
returned bytes for the logical size copied. Storage is billed at standard rates,
but since you're not querying backup namespaces, they're cheap to keep around,
making daily or weekly snapshots practical. Copies work across regions and
across cloud providers (e.g., AWS to GCP).

## CMEK encryption

To encrypt the backup with a [customer managed encryption key (CMEK)](https://turbopuffer.com/docs/cmek), specify an
encryption key in the [`encryption` parameter](https://turbopuffer.com/docs/write#param-encryption).
The key must be available in the destination region.

Specifying an encryption key is mandatory if the source namespace has CMEK
encryption enabled.

## Running Backups on Schedule

To maintain up-to-date backups, run cross-region copies on a regular schedule.
Here's an example script (run via cron or any scheduler) that backs up all
namespaces matching a prefix. It appends the date to each backup namespace name
and automatically cleans up backups older than 7 days:

python

pythontypescriptgojavac#ruby

```python
# /// script
# requires-python = ">=3.10"
# dependencies = ["turbopuffer"]
# ///

import os
import time

import turbopuffer

# Configuration
SOURCE_REGION = "gcp-us-central1"
BACKUP_REGION = "gcp-us-west1"
SOURCE_PREFIX = "fts-"  # Back up all namespaces starting with "fts-"
BACKUP_PREFIX = "backup-"  # Backup namespaces will be "backup-{name}-{date}"
RETENTION_DAYS = 7

source_client = turbopuffer.Turbopuffer(
    api_key=os.getenv("TURBOPUFFER_API_KEY"), region=SOURCE_REGION
)
backup_client = turbopuffer.Turbopuffer(
    api_key=os.getenv("TURBOPUFFER_API_KEY"), region=BACKUP_REGION
)

timestamp = int(time.time())  # Unix epoch seconds
start_time = time.time()

# Step 1: Back up each namespace matching the source prefix
print("Starting backups...")
namespaces = list(source_client.namespaces(prefix=SOURCE_PREFIX))

for ns in namespaces:
    backup_name = f"{BACKUP_PREFIX}{ns.id}-{timestamp:010d}"
    print(f"  Backing up: {ns.id}")
    backup_ns = backup_client.namespace(backup_name)

    backup_ns.copy_from(
        source_namespace=ns.id,
        source_region=SOURCE_REGION,
        # if backing up to a different organization, include source_api_key:
        # source_api_key="<source-org-api-key>",
    )

# Step 2: Delete old backups beyond the retention period (after successful backup)
print("Cleaning up old backups...")
cutoff = int(time.time()) - RETENTION_DAYS * 86400
deleted = 0

for ns in backup_client.namespaces(prefix=BACKUP_PREFIX):
    # Safety check: only delete namespaces that match our backup prefix
    assert len(BACKUP_PREFIX) > 0 and ns.id.startswith(
        BACKUP_PREFIX
    ), f"Refusing to delete namespace that doesn't match backup prefix: {ns.id}"

    # Extract timestamp from backup namespace name (e.g., "backup-prod-users-1234567890")
    if len(ns.id) >= 10:
        try:
            backup_time = int(ns.id[-10:])
            if backup_time < cutoff:
                print(f"  Deleting: {ns.id}")
                backup_client.namespace(ns.id).delete_all()
                deleted += 1
        except ValueError:
            print(
                f"  Skipping {ns.id}: invalid timestamp format",
                file=__import__("sys").stderr,
            )

print(
    f"Done: backed up {len(namespaces)} namespaces, deleted {deleted} old backups in {time.time() - start_time:.1f}s"
)
```

See [Limits](https://turbopuffer.com/docs/limits) for copy throughput estimates.

## Recovering a Namespace

Backup namespaces are fully functional. You can either point your application
to the namespace in the backup region directly, or copy it to a new namespace
in your preferred region as shown below:

python

pythontypescriptgojavac#ruby

```python
# /// script
# requires-python = ">=3.10"
# dependencies = ["turbopuffer"]
# ///

import os
import time

import turbopuffer

# Configuration
SOURCE_REGION = "gcp-us-central1"
BACKUP_REGION = "gcp-us-west1"
BACKUP_PREFIX = "backup-"

source_client = turbopuffer.Turbopuffer(
    api_key=os.getenv("TURBOPUFFER_API_KEY"), region=SOURCE_REGION
)
backup_client = turbopuffer.Turbopuffer(
    api_key=os.getenv("TURBOPUFFER_API_KEY"), region=BACKUP_REGION
)

# Find latest backup timestamp (last 10 chars = Unix epoch seconds)
backups = list(backup_client.namespaces(prefix=BACKUP_PREFIX))
timestamps: set[int] = set()
for ns in backups:
    if len(ns.id) >= 10:
        try:
            timestamps.add(int(ns.id[-10:]))
        except ValueError:
            pass
latest = max(timestamps)

print(f"Recovering from backup: {latest}")
start_time = time.time()
recovered = 0

latest_suffix = f"{latest:010d}"
for ns in backups:
    if not ns.id.endswith(latest_suffix):
        continue
    original_name = ns.id[len(BACKUP_PREFIX) : -11]  # -11 for "-" + 10 digits
    recovered_name = f"recovered-py-{original_name}"
    print(f"  {ns.id} -> {recovered_name}")
    source_client.namespace(recovered_name).copy_from(
        source_namespace=ns.id, source_region=BACKUP_REGION
    )
    recovered += 1

print(f"Done: recovered {recovered} namespaces in {time.time() - start_time:.1f}s")
```

For more details on `copy_from_namespace`, see the [write documentation](https://turbopuffer.com/docs/write#param-copy_from_namespace).

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