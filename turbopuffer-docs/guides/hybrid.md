# Hybrid Search

```
┌─{search.py,search.ts}─────────────────────────────────────────────────┐ │ ┌─turbopuffer queries────┐ │ │ │ ┌───────────────────┐ │ │ │ ├─▶│ Vector Query 1 │─┤ │ │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ │ └───────────────────┘ │ ┌──────┐ │ ┌──────────┐ │ Query Rewriting │ │ ┌───────────────────┐ │ │ Rank │ ┌ ─ ─ ─ ─ ┐ │ │User Query│─┼▶│(Language Model) ─┼─▶│ Vector Query 2 │─┼─▶│ Fuse │──▶ Re-Rank │ └──────────┘ │ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │ └───────────────────┘ │ └──────┘ └ ─ ─ ─ ─ ┘ │ │ │ ┌───────────────────┐ │ │ │ ├─▶│ Text Query 1 │─┤ │ │ │ └───────────────────┘ │ │ │ └────────────────────────┘ │ └───────────────────────────────────────────────────────────────────────┘
```

To improve search quality, multiple strategies can be used together. This is commonly referred to as hybrid search.

turbopuffer supports vector search and BM25 full-text search. Combining them produces semantically relevant search results (vectors), as well as results matching specific words or strings (i.e. product SKUs, email addresses, weighing exact keywords highly).

Keep search logic in {search.py, search.ts}. Use turbopuffer for initial retrieval to narrow millions of results to dozens for rank fusion and re-ranking.

To improve search results further, we suggest:

* Using a re-ranker (such as Cohere, MixedBread, or Voyage)
* Building a test suite of queries and ideal results, and evaluate NDCG (blog post)
* Building a query rewriting layer (LlamaIndex resource)
* Trying various chunking strategies (LangChain resource)
* Trying contextual retrieval, or otherwise rewriting the chunks to be embedded
* Adding additional multi-modal data to query, e.g. embeddings of the images (Cohere image model, Voyage image model)