---
url: "https://turbopuffer.com/docs/backups"
title: "Cross-Region Backups"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

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

Copies are performed entirely server-side, so there's no data transfer through
your infrastructure. They're billed at up to a 75% write discount and create fully
writable namespaces you can use however you like. Storage is billed at standard rates,
but since you're not querying backup namespaces, they're cheap to keep around,
making daily or weekly snapshots practical. Cross-region copies are currently
only supported within the same cloud provider (e.g., AWS to AWS or GCP to GCP).

### Running Backups on Schedule

To maintain up-to-date backups, run cross-region copies on a regular schedule.
Here's an example script (run via cron or any scheduler) that backs up all
namespaces matching a prefix. It appends the date to each backup namespace name
and automatically cleans up backups older than 7 days:

python

pythontypescriptgojavaruby

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

    backup_ns.write(
        copy_from_namespace={
            "source_namespace": ns.id,
            "source_region": SOURCE_REGION,
            # if backing up to a different organization, include source_api_key:
            # "source_api_key": "<source-org-api-key>",
        }
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

### Recovering a Namespace

Backup namespaces are fully functional. You can either point your application
to the namespace in the backup region directly, or copy it to a new namespace
in your preferred region as shown below:

python

pythontypescriptgojavaruby

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
    source_client.namespace(recovered_name).write(
        copy_from_namespace={"source_namespace": ns.id, "source_region": BACKUP_REGION}
    )
    recovered += 1

print(f"Done: recovered {recovered} namespaces in {time.time() - start_time:.1f}s")
```

For more details on `copy_from_namespace`, see the [write documentation](https://turbopuffer.com/docs/write#param-copy_from_namespace).

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)