# Limits

There isn't a limit or performance metric we can't improve by an order of magnitude when prioritized. If you expect to brush up against a limit or you are limited by present performance, contact us. Often can be fixed in days.

| Metric | Observed in production | Production limits (current) | (upcoming) |
| --- | --- | --- | --- |
| Max documents (global) | 500B+ @ 1PB | Unlimited |
| Max documents (queried simultaneously) | 1B+ @ 10TB | Unlimited |
| Max documents (per namespace) | 500M+ @ 1TB | 250M @ 512GB | 1B+ |
| Max number of namespaces | 100M+ | Unlimited |
| Max dimensions | 10,752 |
| Max inactive time in cache | ~3 days | Contact us for custom |
| Max write throughput (global) | 10M+ writes/s @ 32GB/s | Unlimited |
| Max write throughput (per namespace) | 32K+ writes/s @ 64MB/s | 10K writes/s @ 32 MB/s |
| Max upsert batch request size | 256 MB |
| Max write batch rate (per namespace) | 1 batch/s | 4 batches/s |
| Max rows affected by delete by filter | 5M |
| Max ingested, unindexed data | 2 GB |
| Max queries (global) | 10K+ queries/s | Unlimited |
| Max queries (per namespace) | 1K+ queries/s | 1K+ queries/s | 10K queries/s |
| Max queries in a multi-query request | 16 | 32 |
| Max concurrent queries per namespace | 16 (100s of queries/s) | 32 |
| Vector search recall@10 | 90-100% | 90-100% | Configurable |
| Max attribute value size | 8 MiB |
| Max document size | 64 MiB |
| Max id size | 128 bytes | 64 bytes |
| Max attribute name length | 128 bytes |
| Max attribute names per namespace | 256 |
| Max namespace name length | 128 bytes |
| Max full-text query length | 8,192 | 1,024 |
| Max topk | 10K | 1.2K |