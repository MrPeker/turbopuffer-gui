---
url: "https://turbopuffer.com/docs/testing"
title: "Testing"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Testing

In your tests and development environment we suggest hitting production
turbopuffer for the best end to end testing. Since creating a namespace in
turbopuffer is virtually free, you can create a namespace for each test with a
random name, and simply delete it after the test.

For tests against real data, or to give each developer their own copy, use
[branching](https://turbopuffer.com/docs/branching) to instantly clone a production namespace. Delete
the branch when done — the source namespace is unaffected.

To separate test and production infrastructure, consider creating a separate
organization in the dashboard. For cross-region or cross-org copies, use
[`copy_from_namespace`](https://turbopuffer.com/docs/backups).

python

pythontypescriptgojavac#ruby

```python
# tpuf_test.py

# Run with `pytest tpuf_test.py`.

import pytest
import string
import random
import turbopuffer
from turbopuffer.lib import namespace

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

# Create a namespace for each test, and always delete it afterwards
@pytest.fixture
def tpuf_ns():
    random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    ns_name = f"test-{random_suffix}"
    ns = tpuf.namespace(ns_name)
    try:
        yield ns
    finally:
        try:
            ns.delete_all()
        except turbopuffer.NotFoundError:
            # If the namespace never got created, no cleanup is needed.
            pass

def test_query(tpuf_ns: namespace.Namespace):
    tpuf_ns.write(
      upsert_rows=[\
        {"id": 1, "vector": [1, 1]},\
        {"id": 2, "vector": [2, 2]}\
      ],
      distance_metric="cosine_distance",
    )
    res = tpuf_ns.query(rank_by=("vector", "ANN", [1.1, 1.1]), limit=10)
    assert res.rows[0].id == 1
```

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