Hybrid Search

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

Hybrid Search
=============

```
┌─{search.py,search.ts}─────────────────────────────────────────────────┐
             │                    ┌─turbopuffer queries────┐                         │
             │                    │  ┌───────────────────┐ │                         │
             │                    ├─▶│  Vector Query 1   │─┤                         │
             │ ┌ ─ ─ ─ ─ ─ ─ ─ ─  │  └───────────────────┘ │  ┌──────┐               │
┌──────────┐ │  Query Rewriting │ │  ┌───────────────────┐ │  │ Rank │   ┌ ─ ─ ─ ─ ┐ │
│User Query│─┼▶│(Language Model) ─┼─▶│  Vector Query 2   │─┼─▶│ Fuse │──▶  Re-Rank   │
└──────────┘ │  ─ ─ ─ ─ ─ ─ ─ ─ ┘ │  └───────────────────┘ │  └──────┘   └ ─ ─ ─ ─ ┘ │
             │                    │  ┌───────────────────┐ │                         │
             │                    ├─▶│   Text Query 1    │─┤                         │
             │                    │  └───────────────────┘ │                         │
             │                    └────────────────────────┘                         │
             └───────────────────────────────────────────────────────────────────────┘
```

To improve search quality, multiple strategies can be used together. This is commonly referred to as hybrid search.

turbopuffer supports vector search and BM25 full-text search. Combining them produces semantically relevant search results (vectors), as well as results matching specific words or strings (i.e. product SKUs, email addresses, weighing exact keywords highly).

Keep search logic in `{search.py, search.ts}`. Use turbopuffer for initial retrieval to narrow millions of results to dozens for rank fusion and re-ranking.

To improve search results further, we suggest:

*   Using a re-ranker (such as [Cohere](https://cohere.com/rerank), [MixedBread](https://www.mixedbread.ai/docs/reranking/overview), or [Voyage](https://docs.voyageai.com/docs/reranker))
*   Building a test suite of queries and ideal results, and evaluate NDCG ([blog post](https://softwaredoug.com/blog/2021/02/21/what-is-a-judgment-list))
*   Building a query rewriting layer ([LlamaIndex resource](https://docs.llamaindex.ai/en/stable/examples/query_transformations/query_transform_cookbook/))
*   Trying various chunking strategies ([LangChain resource](https://js.langchain.com/v0.1/docs/modules/data_connection/document_transformers/))
*   Trying [contextual retrieval](https://www.anthropic.com/news/contextual-retrieval), or otherwise rewriting the chunks to be embedded
*   Adding additional multi-modal data to query, e.g. embeddings of the images ([Cohere image model](https://docs.cohere.com/v2/docs/embeddings#image-embeddings), [Voyage image model](https://docs.voyageai.com/docs/multimodal-embeddings))

python typescript go

Copy

```python
# $ pip install turbopuffer
import turbopuffer
from turbopuffer.types import Row, ID
from concurrent.futures import ThreadPoolExecutor
import os
from typing import List

tpuf = turbopuffer.Turbopuffer(
    # API tokens are created in the dashboard: https://turbopuffer.com/dashboard
    api_key=os.getenv("TURBOPUFFER_API_KEY"),
    # Pick the right region: https://turbopuffer.com/docs/regions
    region="gcp-us-central1",
)

ns = tpuf.namespace(f'hybrid-example-py')

# Create an embedding with OpenAI, could be {Cohere, Voyage, Mixed Bread, ...}
# Requires OPENAI_API_KEY to be set (https://platform.openai.com/settings/organization/api-keys)
def openai_or_rand_vector(text: str) -> List[float]:
    if not os.getenv("OPENAI_API_KEY"): print("OPENAI_API_KEY not set, using random vectors"); return [__import__('random').random()]*2
    try: return __import__('openai').embeddings.create(model="text-embedding-3-small",input=text).data[0].embedding
    except ImportError: return [__import__('random').random()]*2

# Upsert documents with both FTS and vector search capabilities
ns.write(
    upsert_columns={
        'id': [1, 2, 3, 4, 5],
        'vector': [
            openai_or_rand_vector('Muesli: A mix of raw oats, nuts and dried fruit served with cold milk'),
            openai_or_rand_vector('Classic chia seed pudding is a cold breakfast that takes 5 minutes to prepare'),
            openai_or_rand_vector('Overnight oats: Mix oats with milk, refrigerate overnight for a delicious chilled breakfast'),
            openai_or_rand_vector('Hot oatmeal is a quick and healthy breakfast'),
            openai_or_rand_vector("Breakfast sandwich: A little extra prep, but worth it on Sunday mornings!"),
        ],
        'content': [
            'Muesli: A quick mix of raw oats, nuts and dried fruit served with cold milk',
            'Classic chia seed pudding is a cold breakfast that takes 5 minutes to prepare',
            'Overnight oats: Mix oats with milk, refrigerate overnight for a delicious chilled breakfast',
            'Hot oatmeal is a quick and healthy breakfast',
            'Breakfast sandwich: A little extra prep, but worth it on Sunday mornings!',
        ],
    },
    distance_metric="cosine_distance",
    schema={ "content": { "type": "string", "full_text_search": True } }
)
query = "quick breakfast like oatmeal but cold"
print("Ideal:", [1, 2, 3, 4, 5])

# ===============================================
# FTS and Vector Search
# ===============================================
with ThreadPoolExecutor() as executor: # concurrent, could add more
    fts_future = executor.submit(
        ns.query,
        rank_by=("content", "BM25", query),
        include_attributes=['content'],
        top_k=10
    )
    vector_future = executor.submit(
        ns.query,
        rank_by=("vector", "ANN", openai_or_rand_vector(query)),
        include_attributes=['content'],
        top_k=10
    )
    # FTS:    [4, 1, 2, 5, 3], matches Muesli well (NDCG: 0.72)
    # Vector: [4, 3, 2, 1, 5], picks up on overnight oats, but not Muesli! (NDCG: 0.63)
    # Ideal:  [1, 2, 3, 4, 5]
    fts_result, vector_result = fts_future.result().rows, vector_future.result().rows
    print("FTS:", [item.id for item in fts_result])
    print("Vector:", [item.id for item in vector_result])

# ===============================================
# Rank Fusion
# ===============================================
# There are many ways to fuse the results, see https://github.com/AmenRa/ranx?tab=readme-ov-file#fusion-algorithms

# That's why it's not built into turbopuffer (yet), as you may otherwise not be
# able to express the fusing you need.
def reciprocal_rank_fusion(result_lists, k = 60): # simple way to fuse results based on position
    scores = {} 
    all_results = {} 
    for results in result_lists:
        for rank, item in enumerate(results, start=1):
            scores[item.id] = scores.get(item.id, 0) + 1.0 / (k + rank)
            all_results[item.id] = item
    return [
        setattr(all_results[doc_id], '$dist', score) or all_results[doc_id]
        for doc_id, score in sorted(scores.items(), key=lambda x: x[1], reverse=True)
    ]

# Better than FTS or Vector alone, but still weighs the "hot oatmeal" highly.
# To fix that, we need a re-ranker to bring some more FLOPS to the table.
# Ideal: [1, 2, 3, 4, 5]
# Fused: [4, 1, 2, 3, 5] (NDCG: 0.73)
fused_results = reciprocal_rank_fusion([fts_result, vector_result])
print("Fused:", [item.id for item in fused_results])

# ===============================================
# Reranking
# ===============================================
# See alternative re-rankers turbopuffer.com/docs/hybrid
def cohere_rerank_or_unranked(results, query, k = None): 
    if not os.getenv("COHERE_API_KEY"):
        print("Warning: COHERE_API_KEY not set (https://dashboard.cohere.com/api-keys), returning unranked results")
        return results
    try:
        co = __import__('cohere').Client(os.getenv("COHERE_API_KEY"))
        reranked = co.rerank(query=query, documents=[r.content for r in results], top_n=k or len(results)).results
        for r in reranked:
            results[r.index]['$dist'] = r.relevance_score
        return [results[r.index] for r in reranked]
    except ImportError:
        print("Warning: cohere package not installed (`pip install cohere`), returning unranked results")
        return results

# Weighs the slow overnight oats higher than the chia pudding, but not bad!
# Cohere: [1, 3, 2, 4, 5] (NDCG: 0.97)
# Ideal: [1, 2, 3, 4, 5]
reranked_results = cohere_rerank_or_unranked(fused_results, query)
print("Reranked:", [item.id for item in reranked_results])
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
