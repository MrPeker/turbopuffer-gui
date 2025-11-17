---
url: "https://turbopuffer.com/docs/vector"
title: "Vector Search Guide"
---

[100B vectors @ 200ms p99NEW: 100B vectors @ 200ms p99 latency (opt-in beta)](https://turbopuffer.com/docs/roadmap)

## Navigation

[![Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

[Customers](https://turbopuffer.com/customers) [Pricing](https://turbopuffer.com/pricing) [Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Blog](https://turbopuffer.com/blog) [Docs](https://turbopuffer.com/docs) [Contact](https://turbopuffer.com/contact) [Dashboard](https://turbopuffer.com/dashboard) [Sign up](https://turbopuffer.com/join)

[Introduction](https://turbopuffer.com/docs)

[Architecture](https://turbopuffer.com/docs/architecture)

[Guarantees](https://turbopuffer.com/docs/guarantees)

[Tradeoffs](https://turbopuffer.com/docs/tradeoffs)

[Limits](https://turbopuffer.com/docs/limits)

[Regions](https://turbopuffer.com/docs/regions)

[Roadmap & Changelog](https://turbopuffer.com/docs/roadmap)

[Security](https://turbopuffer.com/docs/security)

[Encryption](https://turbopuffer.com/docs/cmek)

[Private Networking](https://turbopuffer.com/docs/private-networking)

[Performance](https://turbopuffer.com/docs/performance)

Guides

[Quickstart](https://turbopuffer.com/docs/quickstart)

[Vector Search](https://turbopuffer.com/docs/vector)

[Full-Text Search](https://turbopuffer.com/docs/fts)

[Hybrid Search](https://turbopuffer.com/docs/hybrid)

[Testing](https://turbopuffer.com/docs/testing)

API

[Auth & Encoding](https://turbopuffer.com/docs/auth)

[Write](https://turbopuffer.com/docs/write)

[Query](https://turbopuffer.com/docs/query)

[Namespace metadata](https://turbopuffer.com/docs/metadata)

[Export](https://turbopuffer.com/docs/export)

[Warm cache](https://turbopuffer.com/docs/warm-cache)

[List namespaces](https://turbopuffer.com/docs/namespaces)

[Delete namespace](https://turbopuffer.com/docs/delete-namespace)

[Recall](https://turbopuffer.com/docs/recall)

# Vector Search Guide

turbopuffer supports vector search with [filtering](https://turbopuffer.com/docs/query#filtering).
Vectors are incrementally indexed in an SPFresh vector index for performant search.
Writes appear in search results immediately.

The vector index is automatically tuned for 90-100% recall ("accuracy"). We
automatically [monitor recall](https://turbopuffer.com/blog/continuous-recall) for production queries.
You can use the [recall endpoint](https://turbopuffer.com/docs/recall) to test yourself.

python

curlpythontypescriptgojavaruby

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
    upsert_rows=[\
        {\
            'id': 1,\
            'vector': openai_or_rand_vector("A cat sleeping on a windowsill"),\
            'text': 'A cat sleeping on a windowsill',\
            'category': 'animal',\
        },\
        {\
            'id': 2,\
            'vector': openai_or_rand_vector("A playful kitten chasing a toy"),\
            'text': 'A playful kitten chasing a toy',\
            'category': 'animal',\
        },\
        {\
            'id': 3,\
            'vector': openai_or_rand_vector("An airplane flying through clouds"),\
            'text': 'An airplane flying through clouds',\
            'category': 'vehicle',\
        },\
    ],
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
    upsert_rows=[\
        {\
            'id': 1,\
            'vector': openai_or_rand_vector("A shiny red sports car"),\
            'description': 'A shiny red sports car',\
            'color': 'red',\
            'type': 'car',\
            'price': 50000,\
        },\
        {\
            'id': 2,\
            'vector': openai_or_rand_vector("A sleek blue sedan"),\
            'description': 'A sleek blue sedan',\
            'color': 'blue',\
            'type': 'car',\
            'price': 35000,\
        },\
        {\
            'id': 3,\
            'vector': openai_or_rand_vector("A large red delivery truck"),\
            'description': 'A large red delivery truck',\
            'color': 'red',\
            'type': 'truck',\
            'price': 80000,\
        },\
        {\
            'id': 4,\
            'vector': openai_or_rand_vector("A blue pickup truck"),\
            'description': 'A blue pickup truck',\
            'color': 'blue',\
            'type': 'truck',\
            'price': 45000,\
        },\
    ],
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

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)

[- SOC2 Type 2 certified\\
- HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")