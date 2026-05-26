---
url: "https://turbopuffer.com/docs/quickstart"
title: "Quickstart Guide"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Quickstart Guide

Get a quick feel for the API with some examples.

- [Python client](https://github.com/turbopuffer/turbopuffer-python)
- [TypeScript client](https://github.com/turbopuffer/turbopuffer-typescript)
- [Go client](https://github.com/turbopuffer/turbopuffer-go)
- [Java client](https://github.com/turbopuffer/turbopuffer-java)
- [C# client](https://github.com/turbopuffer/turbopuffer-csharp)
- [Ruby client](https://github.com/turbopuffer/turbopuffer-ruby)
- [Community Rust client](https://crates.io/crates/turbopuffer-client)
- [Sample Python notebook](https://colab.research.google.com/drive/17i4sfFTeJQkINCxjBaOGOZeENZr4ZaTE)

python

curlpythontypescriptgojavac#ruby

```python
# $ pip install turbopuffer
import turbopuffer
import os
from typing import List

tpuf = turbopuffer.Turbopuffer(
    # API tokens are created in the dashboard: https://turbopuffer.com/dashboard
    api_key=os.getenv("TURBOPUFFER_API_KEY"),
    # Pick the right region: https://turbopuffer.com/docs/regions
    region="gcp-us-central1",
)

ns = tpuf.namespace(f'quickstart-example-py')

# Create an embedding with OpenAI, could be {Cohere, Voyage, Mixed Bread, ...}
# Requires OPENAI_API_KEY to be set (https://platform.openai.com/settings/organization/api-keys)
def openai_or_rand_vector(text: str) -> List[float]:
    if not os.getenv("OPENAI_API_KEY"): print("OPENAI_API_KEY not set, using random vectors"); return [__import__('random').random() for _ in range(2)]
    try: return __import__('openai').embeddings.create(model="text-embedding-3-small",input=text).data[0].embedding
    except ImportError: print("openai package not installed, using random vectors (`pip install openai`)"); return [__import__('random').random() for _ in range(2)]

# Upsert documents with vectors and attributes
ns.write(
    upsert_rows=[\
        {\
            'id': 1,\
            'vector': openai_or_rand_vector("walrus narwhal"),\
            'category': "mammal",\
            'public': 1,\
            'text': "walrus narwhal",\
        },\
        {\
            'id': 2,\
            'vector': openai_or_rand_vector("pufferfish clownfish swordfish"),\
            'category': "fish",\
            'public': 0,\
            'text': "pufferfish clownfish swordfish",\
        },\
    ],
    distance_metric='cosine_distance',
    schema={
        "text": { # Configure FTS/BM25, other attribtues have inferred types (category: str, public: int)
            "type": "string",
             # More schema & FTS options https://turbopuffer.com/docs/write#schema
            "full_text_search": True,
        }
    }
)

# Query nearest neighbors with filter
print(ns.query(
  rank_by=("vector", "ANN", openai_or_rand_vector("arctic sea mammal")),
  limit=10,
  filters=("And", (("category", "Eq", "mammal"), ("public", "Eq", 1))),
  include_attributes=["category"],
))
# [Row(id=1, vector=None, $dist=0.42773545, category='mammal')]

# Full-text search on an attribute
# To combine FTS and vector search concurrently and fuse results, see https://turbopuffer.com/docs/hybrid-search
print(ns.query(
  limit=10,
  filters=("category", "Eq", "mammal"),
  rank_by=('text', 'BM25', 'quick walrus'),
))
# [Row(id=1, vector=None, $dist=0.7549128)]

# Vectors can be updated by passing new data for an existing ID
ns.write(
  upsert_rows=[\
    {\
      'id': 1,\
      'vector': openai_or_rand_vector("foo"),\
      'name': "foo",\
      'public': 1,\
    },\
    {\
      'id': 2,\
      'vector': openai_or_rand_vector("foo"),\
      'name': "foo",\
      'public': 1,\
    },\
    {\
      'id': 3,\
      'vector': openai_or_rand_vector("foo"),\
      'name': "foo",\
      'public': 1,\
    },\
  ],
  distance_metric='cosine_distance',
)
# Vectors are deleted by ID.
ns.write(deletes=[1, 3])
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