---
url: "https://turbopuffer.com/docs/export"
title: "Export documents"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

## Export documents

To export all documents in a namespace, use the [query](https://turbopuffer.com/docs/query) API to page
through documents by advancing a filter on the `id` attribute.

Documents inserted while the export is in progress will be included.

A common use-case for this is to copy your all documents to a different
namespace after some client-side transformation. To copy documents without
transformation, use [copy\_from\_namespace](https://turbopuffer.com/docs/write#param-copy_from_namespace)
for a more efficient server-side copy (follow with
[delete\_by\_filter](https://turbopuffer.com/docs/write/#param-delete_by_filter) to copy only a subset of
documents).

python

pythontypescriptgojavaruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('export-example-py')

last_id = None
while True:
    result = ns.query(
        rank_by=('id', 'asc'),
        top_k=10_000,
        filters=('id', 'Gt', last_id) if last_id is not None else turbopuffer.omit,
    )

    # Do something with the page of results.
    print(result)

    if len(result.rows) < 10_000:
        break
    last_id = result.rows[-1].id
```

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)