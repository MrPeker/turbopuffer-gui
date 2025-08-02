# Optimizing Performance

turbopuffer is designed to be performant by default, but there are ways to optimize performance further. These suggestions aren't requirements for good performance--rather, they highlight opportunities for improvement when you have the flexibility to choose.

For example, while a single namespace with 10M documents works fine, splitting it into 10 namespaces of 1M documents each will yield better query performance if there's a natural way to group the documents.

* **Choose the region closest to your backend.** We can't beat the speed of light. If there isn't a region close to us and the latency is paramount, contact us.
* **U64 or UUID IDs:** The smaller the IDs, the faster the puffin'. A UUID encoded as a string is 36 bytes, whereas the UUID-native type is 16 bytes. A u64 is even smaller at 8 bytes.
* **Inverted index.** Attribute values that are filterable are indexed into an inverted index. Inverted indexes means large intersects can be much faster than on a traditional B-Tree index.
* **filterable: false.** For attributes you never intend to filter on, marking attributes as filterable: false will improve indexing performance and grant you a 50% discount. For large attribute values, e.g. storing a raw text chunk or image, this can improve performance and cost significantly.
* **Use small namespaces.** The rule of thumb is to make the namespaces as small as they can be without having to routinely query more than one at a time. If documents have significantly different schemas, it's also worth splitting them. Don't try to be too clever. Smaller namespaces will be faster to query and index.
* **Prewarm namespaces.** If your application is latency-sensitive, consider warming the cache for the namespace before the user interacts with it (e.g. when they open the search or chat dialog).
* **Smaller vectors are faster.** Smaller vectors will be faster to search, e.g. 512 dimensions will be faster than 1536 dimensions. f16 will be faster than f32. With smaller vectors, the tradeoff is lower search precision. Consider the cost/performance vs precision tradeoff with your own evals.
* **Batch writes.** If you're writing a lot of documents, consider batching them into fewer writes. This will improve performance and leverages batch discounts up to 50%. Each individual write batch request can be a maximum of 256MB.
* **Concurrent writes.** If you're writing a lot of documents, consider using multiple processes to write batches in parallel. Especially for single-threaded runtimes like Node.js or Python, this can be a significant performance boost as upserting is generally bottlenecked by serialization and compression.
* **Control include\_attributes.** The more data we have to return, the slower it will be. Make sure to only specify the attributes you need.