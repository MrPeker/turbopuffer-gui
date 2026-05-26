---
url: "https://turbopuffer.com/docs/permissions"
title: "Permissions"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Permissions

When a namespace contains documents belonging to multiple users or groups, queries should only return documents the user has access to.

Permissions in turbopuffer currently have to be implemented at the user-level with filters, as turbopuffer doesn't provide built-in mechanisms for row/document-level RBAC.

## Recommended approach

Store the `user_id` or `group_ids` that have read access directly on each document. At query time, fetch the user's id and groups from your auth layer and pass them as a filter.
Generally this approach is more performant than passing document ids in a filter.

An array can be up to 8Mib in size so any group and user id identifiers stored on each document have to fit into this [limit](https://turbopuffer.com/docs/limits).
We store [filterable attributes in an inverted index structure](https://turbopuffer.com/docs/query#filtering) that allows us to efficiently filter 10 000s of user ids without performance degradation.

To reduce storage costs associated with storing user and group permissions on each document, encode them as uuids.
Note that the uuid type needs to be explicitly specified in the schema, otherwise the type will be inferred as a slower and more expensive string type.

python

curlpythontypescriptgojavac#ruby

```python
import os
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
    api_key=os.getenv('TURBOPUFFER_API_KEY'),
)

ns = tpuf.namespace(f'permissions-example-py')

# write a few sample documents that are permissioned by group and user_ids

ns.write(
    upsert_rows=[\
        {\
            'id': 1,\
            'vector': [1, 1],\
            'content': 'changes in the leadership team',\
            'groups': [],\
            'user_ids' : [123, 453, 125, 189]\
        },\
        {\
            'id': 2,\
            'vector': [2, 1],\
            'content': 'simon & nikhil - 1:1 notes',\
            'groups': [],\
            'user_ids' : [123, 125]\
        },\
        {\
            'id': 3,\
            'vector': [6, 1],\
            'content': 'notes on planned Kubernetes migration',\
            'groups': ['eng'],\
            'user_ids' : [96]\
        }\
    ],
    schema={
        'content': {
            'type': 'string',
            'full_text_search': True
        }
    },
    distance_metric='cosine_distance'
)

# now we can query the data passing in the appropriate permissions

result = ns.query(
    rank_by=('content', 'BM25', 'notes'),
    filters=('Or', (
        ('groups', 'Contains', 'design'),
        ('user_ids', 'Contains', 96))),
    limit=10,
    include_attributes=['content']
)
print(result.rows)

# [Row(id=3, vector=None, $dist=0.9686553, content='notes on planned Kubernetes migration')]
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