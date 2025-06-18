![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Quickstart Guide

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

Quickstart Guide
================

Get a quick feel for the API with some examples.

*   [Python Client](https://github.com/turbopuffer/turbopuffer-python)
*   [TypeScript Client](https://github.com/turbopuffer/turbopuffer-typescript)
*   [Go Client](https://github.com/turbopuffer/turbopuffer-go)
*   [Community Rust client](https://crates.io/crates/turbopuffer-client)
*   [Sample Python notebook](https://colab.research.google.com/drive/17i4sfFTeJQkINCxjBaOGOZeENZr4ZaTE)
*   [Community tool to migrate vectors between providers](https://github.com/AI-Northstar-Tech/vector-io)

curl python typescript go

Copy

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
    if not os.getenv("OPENAI_API_KEY"): print("OPENAI_API_KEY not set, using random vectors"); return [__import__('random').random()]*2
    try: return __import__('openai').embeddings.create(model="text-embedding-3-small",input=text).data[0].embedding
    except ImportError: return [__import__('random').random()]*2

# Upsert documents with vectors and attributes
ns.write(
    upsert_columns={
        'id': [1, 2],
        'vector': [openai_or_rand_vector("walrus narwhal"), openai_or_rand_vector("elephant walrus rhino")],
        'name': ["foo", "foo"],
        'public': [1, 0],
        'text': ["walrus narwhal", "elephant walrus rhino"],
    },
    distance_metric='cosine_distance',
    schema={
        "text": { # Configure FTS/BM25, other attribtues have inferred types (name: str, public: int)
            "type": "string",
             # More schema & FTS options https://turbopuffer.com/docs/schema
            "full_text_search": True,
        }
    }
)

# Query nearest neighbors with filter
print(ns.query(
  rank_by=("vector", "ANN", openai_or_rand_vector("walrus narwhal")),
  top_k=10,
  filters=("And", (("name", "Eq", "foo"), ("public", "Eq", 1))),
  include_attributes=["name"],
))
# [Row(id=1, vector=None, $dist=0.009067952632904053, name='foo')]

# Full-text search on an attribute
# If you want to combine FTS and vector search, see https://turbopuffer.com/docs/hybrid-search
print(ns.query(
  top_k=10,
  filters=("name", "Eq", "foo"),
  rank_by=('text', 'BM25', 'quick walrus'),
))
# [Row(id=1, vector=None, $dist=0.19, name='foo')]
# [Row(id=2, vector=None, $dist=0.168, name='foo')]

# Vectors can be updated by passing new data for an existing ID
ns.write(
  upsert_columns={
    'id': [1, 2, 3],
    'vector': [openai_or_rand_vector("foo"), openai_or_rand_vector("foo"), openai_or_rand_vector("foo")],
    'name': ["foo", "foo", "foo"],
    'public': [1, 1, 1],
  },
  distance_metric='cosine_distance',
)
# Vectors are deleted by ID.
ns.write(deletes=[1, 3])
```

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
