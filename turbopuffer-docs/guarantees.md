# Guarantees

This document serves as a brief reference of turbopuffer's guarantees:

* **Durable Writes.** Writes are committed to object storage upon successful return by turbopuffer's API.
* **Consistent Reads.** Queries return the latest data by default but can be configured for performance at the cost of read consistency. Most updates are visible immediately since queries usually hit the writing node. Over 99.99% of queries return consistent data, however in rare cases (e.g. during scaling), reads may be briefly stale (typically limited to ~100ms, with a strict upper bound of 1 minute). The cache refreshes on every query, ensuring the latest writes appear next request.
* **Atomic Batches.** All writes in an upsert are applied simultaneously.
* **Any node can serve queries for any namespace.** HA does not come as a cost/reliability trade-off. Our HA is the number of query nodes we run.
* **Object storage is the only stateful dependency.** This means there is no separate consensus plane that needs to be maintained and scaled independently, simplifying the system's operations and thus reliability. All concurrency control is delegated to object storage.
* **Compute-Compute Separation.** Query nodes handle queries and writes to object storage and the write-through cache. All expensive computation happens on separate, auto-scaled indexing nodes.
* **Smart Caching.** After a cold query, data is cached on NVMe SSD and frequently accessed namespaces are stored in memory. turbopuffer does not need to load the entire namespace into cache, and then query it. The storage engine is designed to perform small, ranged reads directly to object storage for fast cold queries. Cache warming hints can eliminate user-visible cold query latency in many applications.
* **Autoscaling.** Query and indexing nodes are automatically scale with demand.

Regarding ACID properties: turbopuffer provides Atomicity, Consistency, and Durability. Isolation is not applicable as transactions are not supported.

For CAP theorem: turbopuffer prioritizes consistency over availability when object storage is unreachable. You can adjust this to favor availability through query configuration.

For more details, see Tradeoffs, Limits, and Architecture.