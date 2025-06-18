![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Optimizing Performance

===============

[Now open for all, let's get you puffin'turbopuffer is generally available, let's get you puffin'](https://turbopuffer.com/join)

Navigation
----------

[![Image 4: Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

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

Optimizing Performance
======================

turbopuffer is designed to be performant by default, but there are ways to optimize performance further. These suggestions aren't requirements for good performance--rather, they highlight opportunities for improvement when you have the flexibility to choose.

For example, while a single namespace with 10M documents works fine, splitting it into 10 namespaces of 1M documents each will yield better query performance if there's a natural way to group the documents.

*   **Choose the [region](https://turbopuffer.com/docs/regions) closest to your backend.** We can't beat the speed of light. If there isn't a region close to us and the latency is paramount, [contact us.](https://turbopuffer.com/contact)
*   **U64 or UUID IDs**: The smaller the IDs, the faster the puffin'. A UUID encoded as a string is 36 bytes, whereas the [UUID-native type is 16 bytes](https://turbopuffer.com/docs/schema). A u64 is even smaller at 8 bytes.
*   **Inverted index.** Attribute values that are filterable are indexed into an inverted index. Inverted indexes means large intersects can be much faster than on a traditional B-Tree index.
*   **filterable: false**. For attributes you never intend to filter on, marking [attributes as filterable: false](https://turbopuffer.com/docs/schema) will improve indexing performance and grant you a 50% discount. For large attribute values, e.g. storing a raw text chunk or image, this can improve performance and cost significantly.
*   **Use small namespaces.** The rule of thumb is to make the namespaces as small as they can be without having to routinely query more than one at a time. If documents have significantly different schemas, it's also worth splitting them. Don't try to be too clever. Smaller namespaces will be faster to query and index.
*   **Prewarm namespaces.** If your application is latency-sensitive, consider [warming the cache](https://turbopuffer.com/docs/warm-cache) for the namespace before the user interacts with it (e.g. when they open the search or chat dialog).
*   **Smaller vectors are faster.** Smaller vectors will be faster to search, e.g. 512 dimensions will be faster than 1536 dimensions. [f16](https://turbopuffer.com/docs/schema#param-vector) will be faster than f32. With smaller vectors, the tradeoff is lower search precision. Consider the cost/performance vs precision tradeoff with your own evals.
*   **Batch writes.** If you're writing a lot of documents, consider batching them into fewer writes. This will improve performance and [leverages batch discounts up to 50%](https://turbopuffer.com/#pricing). Each individual write batch request can be a maximum of 256MB.
*   **Concurrent writes.** If you're writing a lot of documents, consider using multiple processes to write batches in parallel. Especially for single-threaded runtimes like Node.js or Python, this can be a significant performance boost as upserting is generally bottlenecked by serialization and compression.
*   **Control include_attributes.** The more data we have to return, the slower it will be. Make sure to only specify the attributes you need.

![Image 5: turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about)[Pricing](https://turbopuffer.com/pricing)[Press & media](https://turbopuffer.com/press)[System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-2bro3fb5j-6Ys5st9UFDrm7qXQw_S9Rw)[Docs](https://turbopuffer.com/docs)[Email](https://turbopuffer.com/contact/support)[Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

[](https://x.com/turbopuffer)[](https://www.linkedin.com/company/turbopuffer/)[](https://bsky.app/profile/turbopuffer.bsky.social)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service)[Data Processing Agreement](https://turbopuffer.com/dpa)[Privacy Policy](https://turbopuffer.com/privacy-policy)[Security & Compliance](https://turbopuffer.com/docs/security)

[* SOC2 Type 2 certified * HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")
