---
url: "https://turbopuffer.com/docs/fts"
title: "Full-Text Search Guide"
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

# Full-Text Search Guide

turbopuffer supports BM25 full-text search for [string and \[\]string types](https://turbopuffer.com/docs/write#schema). This guide
shows how to configure and use full-text search with different options.

turbopuffer's full-text search engine has been written from the ground up for
the turbopuffer storage engine for low latency searches directly on object
storage.

For hybrid search combining both vector and BM25 results, see [Hybrid Search](https://turbopuffer.com/docs/hybrid-search).

For all available full-text search options, see the [Schema documentation](https://turbopuffer.com/docs/write#schema).

### Basic example

The simplest form of full-text search is on a single field of type `string`.

python

curlpythontypescriptgojavaruby

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
    upsert_rows=[\
        {\
            'id': 1,\
            'content': 'turbopuffer is a fast search engine with FTS, filtering, and vector search support'\
        },\
        {\
            'id': 2,\
            'content': 'turbopuffer can store billions and billions of documents cheaper than any other search engine'\
        },\
        {\
            'id': 3,\
            'content': 'turbopuffer will support many more types of queries as it evolves. turbopuffer will only get faster.'\
        }\
    ],
    schema={
        'content': {
            'type': 'string',
            # Enable BM25 with default settings
            # For all config options, see https://turbopuffer.com/docs/write#schema
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

### Advanced example

You can use full-text search operators like [Sum](https://turbopuffer.com/docs/query#aggregation-operators) and [Product](https://turbopuffer.com/docs/query#field-weightsboosts) to perform
a full-text search across multiple attributes simultaneously.

python

curlpythontypescriptgojavaruby

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace(f'fts-advanced-example-py')

# Write some documents with a rich set of attributes.
ns.write(
    upsert_rows=[\
        {\
            'id': 1,\
            'title': 'Getting Started with Python',\
            'content': 'Learn Python basics including variables, functions, and classes',\
            'tags': ['python', 'programming', 'beginner'],\
            'language': 'en',\
            'publish_date': 1709251200\
        },\
        {\
            'id': 2,\
            'title': 'Advanced TypeScript Tips',\
            'content': 'Discover advanced TypeScript features and type system tricks',\
            'tags': ['typescript', 'javascript', 'advanced'],\
            'language': 'en',\
            'publish_date': 1709337600\
        },\
        {\
            'id': 3,\
            'title': 'Python vs JavaScript',\
            'content': 'Compare Python and JavaScript for web development',\
            'tags': ['python', 'javascript', 'comparison'],\
            'language': 'en',\
            'publish_date': 1709424000\
        }\
    ],
    schema={
        'title': {
            'type': 'string',
            'full_text_search': {
                # See all FTS indexing options at
                # https://turbopuffer.com/docs/write#param-full_text_search
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
        ('Product', 3, ('title', 'BM25', 'python beginner')),
        ('Product', 2, ('tags', 'BM25', 'python beginner')),
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

### Custom tokenization

When turbopuffer's built-in tokenizers aren't sufficient, use the
`pre_tokenized_array` [tokenizer](https://turbopuffer.com/docs/fts#tokenizers)
to perform client side tokenization using arbitrary logic.

python

pythontypescriptgojavaruby

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
    upsert_rows=[\
        {"id": 1, "content": tokenize("We hold these truths to be self-evident.")},\
        {"id": 2, "content": tokenize("For my own self, it seemed evident.")},\
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

### Supported languages

turbopuffer currently supports language-aware stemming and stopword removal for
full-text search. The following languages are supported:

```
english (default)   arabic     hungarian    portuguese   swedish
danish              finnish    italian      romanian     tamil
dutch               french     norwegian    russian      turkish
german              greek
```

Other languages can be supported by [contacting us](https://turbopuffer.com/contact).

### Tokenizers

- `word_v2` (default for new namespaces)
- `word_v1`
- `word_v0`
- `pre_tokenized_array`

The default tokenizer is periodically upgraded. If your application relies
on specific tokenization behavior, you should explicitly specify a tokenizer
in the [schema](https://turbopuffer.com/docs/write#param-full_text_search).

The `word_v2` tokenizer forms tokens from ideographic codepoints, contiguous
sequences of alphanumeric codepoints, and sequences of emoji codepoints that
form a single glyph. Codepoints that are not alphanumeric, ideographic, or an
emoji are discarded. Codepoints are classified according to Unicode v16.0.

The `word_v1` tokenizer works like the `word_v2` tokenizer, except that
ideographic codepoints are treated as alphanumeric codepoint. Codepoints are
classified according to Unicode v10.0.

The `word_v0` tokenizer works like the `word_v1` tokenizer, except that emoji
codepoints are discarded.

The `pre_tokenized_array` tokenizer is a special tokenizer that indicates that
you want to perform your own tokenization. This tokenizer can only be used on
attributes of type `[]string`; each string in the array is interpreted as a
token. When this tokenizer is active, queries using the `BM25` or
`ContainsAllTokens` operators must supply a query operand of type `[]string`
rather than `string`; each string in the array is interpreted as a token. Tokens
are always matched case sensitively, without stemming or stopword removal. You
cannot specify `language`, `stemming: true`, `remove_stopwords: true`, or
`case_sensitive: false` when using this tokenizer.

New tokenizers can be requested by [contacting us](https://turbopuffer.com/contact).

### Advanced tuning

The [BM25 scoring algorithm](https://en.wikipedia.org/wiki/Okapi_BM25) involves two parameters that can be tuned for
your workload:

- `k1` controls how quickly the impact of term frequency saturates. When `k1` is
close to zero, term frequency is effectively ignored when scoring a document.
When `k1` is close to infinity, term frequency contributes nearly
linearly to the score.

The default value, `1.2`, means that increasing term frequency in a document
boosts heavily to start but quickly results in diminishing returns.

- `b` controls document length normalization. When `b` is `0.0`, documents are
treated equally regardless of length, which allows long articles tend to
dominate due to sheer volume of terms. When `b` is `1.0`, documents are
boosted or penalized based on the ratio of their length to the average
document length in the corpus.

The default value, `0.75`, controls for length bias without eliminating it
entirely (long documents are often legitimately more relevant).


The default values are suitable for most applications. Tuning is typically
required only if your corpus consists of extremely short texts like tweets
(decrease `k1` and `b`) or extremely long texts like legal documents (increase
`k1` and `b`).

To tune these parameters, we recommend an empirical approach: build a set of
evals, and choose the parameter values that maximize performance on those evals.

On this page

- [Basic example](https://turbopuffer.com/docs/fts#basic-example)
- [Advanced example](https://turbopuffer.com/docs/fts#advanced-example)
- [Custom tokenization](https://turbopuffer.com/docs/fts#custom-tokenization)
- [Supported languages](https://turbopuffer.com/docs/fts#supported-languages)
- [Tokenizers](https://turbopuffer.com/docs/fts#tokenizers)
- [Advanced tuning](https://turbopuffer.com/docs/fts#advanced-tuning)

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