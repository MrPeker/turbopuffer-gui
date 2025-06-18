Full-Text Search Guide

===============

[Now open for all, let's get you puffin'turbopuffer is generally available, let's get you puffin'](https://turbopuffer.com/join)

Navigation
----------

[![Image 1: Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

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

On this page

*   [Basic example](https://turbopuffer.com/docs/fts#basic-example)
*   [Advanced example](https://turbopuffer.com/docs/fts#advanced-example)
*   [Custom tokenization](https://turbopuffer.com/docs/fts#custom-tokenization)

Full-Text Search Guide
======================

turbopuffer supports BM25 full-text search for [string and []string types](https://turbopuffer.com/docs/schema). This guide shows how to configure and use full-text search with different options.

turbopuffer's full-text search engine has been written from the ground up for the turbopuffer storage engine for low latency searches directly on object storage.

For hybrid search combining both vector and BM25 results, see [Hybrid Search](https://turbopuffer.com/docs/hybrid-search).

For all available full-text search options, see the [Schema documentation](https://turbopuffer.com/docs/schema#languages-for-full-text-search).

### [](https://turbopuffer.com/docs/fts#basic-example)Basic example

The simplest form of full-text search is on a single field of type `string`.

curl python typescript go

Copy

```python
# $ pip install turbopuffer
import turbopuffer
import os

tpuf = turbopuffer.Turbopuffer(
    # API tokens are created in the dashboard: https://turbopuffer.com/dashboard
    api_key=os.getenv("TURBOPUFFER_API_KEY"),
    # Pick the right region: https://turbopuffer.com/docs/regions
    region="gcp-us-central1",
)

ns = tpuf.namespace(f'fts-basic-example-py')
ns.write(
    upsert_columns={
        'id': [1, 2, 3],
        'content': [
            'turbopuffer is a fast search engine with FTS, filtering, and vector search support',
            'turbopuffer can store billions and billions of documents cheaper than any other search engine',
            'turbopuffer will support many more types of queries as it evolves. turbopuffer will only get faster.'
        ]
    },
    schema={
        'content': {
            'type': 'string',
            # Enable BM25 with default settings
            # For all config options, see https://turbopuffer.com/docs/schema
            'full_text_search': True
        }
    }
)

# Basic FTS search.
results = ns.query(
    rank_by=('content', 'BM25', 'turbopuffer'),
    top_k=10,
    include_attributes=['content']
)
# [3, 1, 2] is the default BM25 ranking based on document length and
# term frequency
print(results)

# Simple phrase matching filter, to limit results to documents that contain the
# terms "search" and "engine"
results = ns.query(
    rank_by=('content', 'BM25', 'turbopuffer'),
    filters=('content', 'ContainsAllTokens', 'search engine'),
    top_k=10,
    include_attributes=['content']
)
# [1, 2] (same as above, but without document 3)
print(results)

# To combine with vector search, see:
# https://turbopuffer.com/docs/hybrid-search
```

### [](https://turbopuffer.com/docs/fts#advanced-example)Advanced example

You can use full-text search operators like [Sum](https://turbopuffer.com/docs/query#aggregation-operators) and [Product](https://turbopuffer.com/docs/query#field-weightsboosts) to perform a full-text search across multiple attributes simultaneously.

curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace(f'fts-advanced-example-py')

# Write some documents with a rich set of attributes.
ns.write(
    upsert_columns={
        'id': [1, 2, 3],
        'title': [
            'Getting Started with Python',
            'Advanced TypeScript Tips',
            'Python vs JavaScript'
        ],
        'content': [
            'Learn Python basics including variables, functions, and classes',
            'Discover advanced TypeScript features and type system tricks',
            'Compare Python and JavaScript for web development'
        ],
        'tags': [
            ['python', 'programming', 'beginner'],
            ['typescript', 'javascript', 'advanced'],
            ['python', 'javascript', 'comparison']
        ],
        'language': ['en', 'en', 'en'],
        'publish_date': [1709251200, 1709337600, 1709424000]
    },
    schema={
        'title': {
            'type': 'string',
            'full_text_search': {
                # See all FTS indexing options at
                # https://turbopuffer.com/docs/schema
                'language': 'english',
                'stemming': True,
                'remove_stopwords': True,
                'case_sensitive': False
            }
        },
        'content': {
            'type': 'string',
            'full_text_search': {
                'language': 'english',
                'stemming': True,
                'remove_stopwords': True
            }
        },
        'tags': {
            'type': '[]string',
            'full_text_search': {
                'stemming': False,
                'remove_stopwords': False,
                'case_sensitive': True
            }
        }
    }
)

# Advanced FTS search.
# In this example, hits on `title` and `tags` are weighted / boosted higher than
# hits on `content`.
result = ns.query(
    # See all FTS query options at https://turbopuffer.com/docs/query
    rank_by=('Sum', (
        ('Product', (3, ('title', 'BM25', 'python beginner'))),
        ('Product', (2, ('tags', 'BM25', 'python beginner'))),
        ('content', 'BM25', 'python beginner')
    )),
    filters=('And', (
        ('publish_date', 'Gte', 1709251200),
        ('language', 'Eq', 'en'),
    )),
    top_k=10,
    include_attributes=['title', 'content', 'tags']
)
print(result.rows)

# To combine with vector search, see:
# https://turbopuffer.com/docs/hybrid-search
```

### [](https://turbopuffer.com/docs/fts#custom-tokenization)Custom tokenization

When turbopuffer's built-in tokenizers aren't sufficient, use the `pre_tokenized_array`[tokenizer](https://turbopuffer.com/docs/schema#tokenizers-for-full-text-search) to perform client side tokenization using arbitrary logic.

python typescript go

Copy

```python
import turbopuffer
from typing import List

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

# A simple word tokenizer that preserves hyphens instead of splitting on them.
def tokenize(text: str) -> List[str]:
    # Replace all characters besides alphanumeric and '-' with spaces.
    cleaned = ""
    for ch in text:
        if ch.isalnum() or ch in "-":
            cleaned += ch
        else:
            cleaned += str(" ")
    # Lowercase and split on spaces.
    return cleaned.lower().split()

# Write some sample data.
ns = tpuf.namespace(f'fts-custom-tokenization-py')
ns.write(
    upsert_rows=[
        {"id": 1, "content": tokenize("We hold these truths to be self-evident.")},
        {"id": 2, "content": tokenize("For my own self, it seemed evident.")},
    ],
    schema={
        'content': {
            'type': '[]string',
            'full_text_search': {'tokenizer': 'pre_tokenized_array'}
        }
    }
)

# Query for "self" and "evident".
results = ns.query(
    # Notice that the BM25 operator now expects a list of tokens, not a string.
    rank_by=('content', 'BM25', ['self', 'evident']),
    top_k=10,
)
# Only document 2 is matched, because document 1 has the token "self-evident"
# but neither the token "self" nor "evident".
print(results)

# Query for "self-evident".
results = ns.query(
    rank_by=('content', 'BM25', ['self-evident']),
    top_k=10,
)
# Now only document 1 is matched.
print(results)

# To accept string queries, simply apply the tokenizer to the query string
# before passing it to the `BM25` operator.
def query_string(query: str):
    return ns.query(
        rank_by=('content', 'BM25', tokenize(query)),
        top_k=10,
    )
```

![Image 2: turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about)[Pricing](https://turbopuffer.com/pricing)[Press & media](https://turbopuffer.com/press)[System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-2bro3fb5j-6Ys5st9UFDrm7qXQw_S9Rw)[Docs](https://turbopuffer.com/docs)[Email](https://turbopuffer.com/contact/support)[Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

[](https://x.com/turbopuffer)[](https://www.linkedin.com/company/turbopuffer/)[](https://bsky.app/profile/turbopuffer.bsky.social)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service)[Data Processing Agreement](https://turbopuffer.com/dpa)[Privacy Policy](https://turbopuffer.com/privacy-policy)[Security & Compliance](https://turbopuffer.com/docs/security)

[* SOC2 Type 2 certified * HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")
