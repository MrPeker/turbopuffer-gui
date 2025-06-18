![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Vector Search Guide

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

Vector Search Guide
===================

turbopuffer supports vector search with [filtering](https://turbopuffer.com/docs/query#filtering). Vectors are incrementally indexed in an SPFresh vector index for performant search. Writes appear in search results immediately.

The vector index is automatically tuned for 90-100% recall ("accuracy"). We automatically [monitor recall](https://turbopuffer.com/blog/continuous-recall) for production queries. You can use the [recall endpoint](https://turbopuffer.com/docs/recall) to test yourself.

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

# Create an embedding with OpenAI, could be {Cohere, Voyage, Mixed Bread, ...}
# Requires OPENAI_API_KEY to be set (https://platform.openai.com/settings/organization/api-keys)
def openai_or_rand_vector(text: str) -> List[float]:
    if not os.getenv("OPENAI_API_KEY"): print("OPENAI_API_KEY not set, using random vectors"); return [__import__('random').random()]*2
    try: return __import__('openai').embeddings.create(model="text-embedding-3-small",input=text).data[0].embedding
    except ImportError: return [__import__('random').random()]*2

ns = tpuf.namespace('vector-1-example-py')

# Basic vector search example
ns.write(
    upsert_columns={
        'id': [1, 2, 3],
        'vector': [
            openai_or_rand_vector("A cat sleeping on a windowsill"),
            openai_or_rand_vector("A playful kitten chasing a toy"),
            openai_or_rand_vector("An airplane flying through clouds")
        ],
        'text': ['A cat sleeping on a windowsill', 'A playful kitten chasing a toy', 'An airplane flying through clouds' ],
        'category': ['animal', 'animal', 'vehicle'],
    },
    distance_metric='cosine_distance'
)

result = ns.query(
    rank_by=("vector", "ANN", openai_or_rand_vector("feline")),
    top_k=2,
    include_attributes=['text']
)
# Returns cat and kitten documents, sorted by vector similarity
print(result.rows)

# Example of vector search with filters
ns = tpuf.namespace('vector-2-example-py')
ns.write(
    upsert_columns={
        'id': [1, 2, 3, 4],
        'vector': [
            openai_or_rand_vector("A shiny red sports car"),
            openai_or_rand_vector("A sleek blue sedan"),
            openai_or_rand_vector("A large red delivery truck"),
            openai_or_rand_vector("A blue pickup truck")
        ],
        'description': [
            'A shiny red sports car',
            'A sleek blue sedan',
            'A large red delivery truck',
            'A blue pickup truck'
        ],
        'color': ['red', 'blue', 'red', 'blue'],
        'type': ['car', 'car', 'truck', 'truck'],
        'price': [50000, 35000, 80000, 45000]
    },
    distance_metric='cosine_distance'
)

result = ns.query(
    rank_by=("vector", "ANN", openai_or_rand_vector("car")),  # Embedding similar to "car"
    top_k=10,
    # Complex filter combining multiple conditions, see https://turbopuffer.com/docs/query for all options
    filters=('And', (
        ('price', 'Lt', 60000),
        ('color', 'Eq', 'blue')
    )),
    include_attributes=['description', 'price']
)
print(result.rows) # car, then truck
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
