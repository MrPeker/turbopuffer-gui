---
url: "https://turbopuffer.com/docs/vector"
title: "Vector Search Guide"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

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
    if not os.getenv("OPENAI_API_KEY"): print("OPENAI_API_KEY not set, using random vectors"); return [__import__('random').random() for _ in range(2)]
    try: return __import__('openai').embeddings.create(model="text-embedding-3-small",input=text).data[0].embedding
    except ImportError: print("openai package not installed, using random vectors (`pip install openai`)"); return [__import__('random').random() for _ in range(2)]

ns = tpuf.namespace(f'vector-1-example-py')

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
    limit=2,
    include_attributes=['text']
)
# Returns cat and kitten documents, sorted by vector similarity
print(result.rows)

# Example of vector search with filters
ns = tpuf.namespace(f'vector-2-example-py')
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
    limit=10,
    # Complex filter combining multiple conditions, see https://turbopuffer.com/docs/query for all options
    filters=('And', (
        ('price', 'Lt', 60000),
        ('color', 'Eq', 'blue')
    )),
    include_attributes=['description', 'price']
)
print(result.rows) # car, then truck
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