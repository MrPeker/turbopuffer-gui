---
url: "https://turbopuffer.com/docs/testing"
title: "Testing"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

# Testing

In your tests and development environment we suggest hitting production
turbopuffer for the best end to end testing. Since creating a namespace in
turbopuffer is virtually free, you can create a namespace for each test with a
random name, and simply delete it after the test. We recommend each developer
has their own namespace for their dev namespaces.

In addition, to separate test and production, consider creating a separate
organization in the dashboard. You can use
[copy\_from\_namespace](https://turbopuffer.com/docs/backups) to copy production data into your test
org for realistic development environments.

python

pythontypescriptgojavaruby

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
    res = tpuf_ns.query(rank_by=("vector", "ANN", [1.1, 1.1]), top_k=10)
    assert res.rows[0].id == 1
```

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)