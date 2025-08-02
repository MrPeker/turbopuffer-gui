# Tradeoffs

Every technology has tradeoffs. This document outlines turbopuffer's key design choices to help inform your evaluation:

* **High latency, high throughput writes.** turbopuffer prioritizes simplicity, durability, and scalability by using object storage as a write-ahead log, keeping nodes stateless. While this means writes take up to 200ms to commit, the system supports thousands of writes per second per namespace. Despite this latency, our consistent read model makes documents visible to queries faster than eventually consistent search engines. This architecture choice enables our cost-effective scaling and is particularly well-suited for search workloads.
* **Focused on first-stage retrieval.** turbopuffer focuses on efficient first-stage retrieval, providing a simple API to filter millions of documents down to a smaller candidate set. In a 2nd stage, you can then refine and rerank results using familiar programming languages, making your search logic easier to develop and maintain. Learn more about this approach in our Hybrid Search guide. We've found that it's difficult to maintain search applications in mountains of idiosyncratic query language.
* **Optimized for accuracy.** turbopuffer delivers high recall out of the box, maintaining this quality even with complex filters. We prioritize consistent, accurate results over configurable performance optimizations.
* **Consistent reads have a ~10ms latency floor.** turbopuffer's reads are consistent by default, requiring object storage checks for the latest writes. This baseline latency aligns with object storage's GET IF-NOT-MATCH latency and should improve as object storage technology advances. For workloads requiring sub-10ms latency, you can enable eventual consistency. S3's metadata p50=10ms p90=17ms, GCS's metadata p50=12-18ms p90=15-25ms (more region-dependent).
* **Occasional cold queries.** Since all data is not always in memory or disk, turbopuffer will occasionally do cold queries directly on object storage and rehydrate the cache. This means that e.g. P999 queries may be in the 100s of milliseconds range (see cold/hot performance on the landing page). Our storage layer is optimized for this use-case, and does direct ranged reads on object storage in the fewest round-trips possible for the fastest cold queries. Many applications can prewarm namespaces so users never observe cold latency.
* **Scales to millions of namespaces.** turbopuffer scales to trillions of documents across hundreds of millions of namespaces. While you can create unlimited namespaces, individual namespaces have ever-expanding size guidelines. Namespacing your data means benefiting natural data partitioning (e.g. tenancy) for performance and cost.
* **Focused on paid customers.** For the current phase of our company we have chosen a commercial-only model to maintain high-quality support and rapid development. While we don't offer a free tier or open source version, you can run turbopuffer in your own cloud--contact us for details.

| turbopuffer excels at | turbopuffer may not currently be the best fit for |
| --- | --- |
| Large scale (1B+ documents/vectors) with lots of namespaces (tens of millions) | 🔜 Large namespaces (250M+) |
| Naturally sharded data (e.g. B2B where each tenant's data is isolated in its own namespace) | Low scale, free tier |
| Cost-effectiveness | 🔜 Aggregation (e.g. group by, sums, explore clusters, ...) |
| Fast cold starts | Extensive 1st-stage ranking (we encourage generating a candidate set with hybrid search and refining/re-ranking further in your own 2nd stage) |
| Reliability | Built-in 2nd-stage re-ranking (we encourage you to do it in {search.py,search.ts,..}) |
| Hybrid search (BM25 + vector search) | Built-in embedding (ditto) |
| Support from DB Engineers | Open Source |
| Deploy into your VPC (BYOC) |
| Heavy writes (Appends, Updates and Deletes) |

For more details, see Guarantees, Limits, and Architecture pages.