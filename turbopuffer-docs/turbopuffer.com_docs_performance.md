---
url: "https://turbopuffer.com/docs/performance"
title: "Optimizing Performance"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

# Optimizing Performance

turbopuffer is designed to be performant by default, but there are ways to
optimize performance further. These suggestions aren't requirements for good
performance--rather, they highlight opportunities for improvement when you have
the flexibility to choose.

For example, while a single namespace with 10M documents works fine, splitting
it into 10 namespaces of 1M documents each will yield better query performance
if there's a natural way to group the documents.

- **Choose the [region](https://turbopuffer.com/docs/regions) closest to your backend.** We can't beat the
speed of light. If there isn't a region close to us and the latency is
paramount, [contact us.](https://turbopuffer.com/contact)
- **U64 or UUID IDs**: The smaller the IDs, the faster the puffin'. A UUID
encoded as a string is 36 bytes, whereas the [UUID-native type is 16\\
bytes](https://turbopuffer.com/docs/write#schema). A u64 is even smaller at 8 bytes.
- **Inverted index.** Attribute values that are filterable are indexed into an inverted
index. Inverted indexes means large intersects can be much faster than on a
traditional B-Tree index.
- **filterable: false**. For attributes you never intend to filter on, marking
[attributes as filterable: false](https://turbopuffer.com/docs/write#schema) will improve indexing performance and
grant you a 50% discount. For large attribute values, e.g. storing a raw text
chunk or image, this can improve performance and cost significantly.
- **Use small namespaces.** The rule of thumb is to make the namespaces as
small as they can be without having to routinely query more than one at a time.
If documents have significantly different schemas, it's also worth splitting
them. Don't try to be too clever. Smaller namespaces will be faster to query and index.
- **Prewarm namespaces.** If your application is latency-sensitive, consider
[warming the cache](https://turbopuffer.com/docs/warm-cache) for the namespace before the user interacts with it
(e.g. when they open the search or chat dialog).
- **Smaller vectors are faster.** Smaller vectors will be faster to search, e.g.
512 dimensions will be faster than 1536 dimensions.
[f16](https://turbopuffer.com/docs/write#param-vector) will be faster than f32. With smaller vectors,
the tradeoff is lower search precision. Consider the cost/performance vs
precision tradeoff with your own evals.
- **Batch writes.** If you're writing a lot of documents, consider batching
them into fewer writes. This will improve performance and [leverages batch\\
discounts up to 50%](https://turbopuffer.com/#pricing). Each individual write batch request can be a
maximum of 256MB.
- **Concurrent writes.** If you're writing a lot of documents, consider using
multiple processes to write batches in parallel. Especially for single-threaded
runtimes like Node.js or Python, this can be a significant performance boost as
upserting is generally bottlenecked by serialization and compression.
- **Control include\_attributes.** The more data we have to
return, the slower it will be. Make sure to only specify the attributes you
need.
- **Glob filters and regexes can be expensive.**`Glob tpuf*` is compiled down to an optimized prefix
scan, whereas `Glob *tpuf*` or `IGlob` will potentially scan at every document
in the namespace. [Contact us](https://turbopuffer.com/contact) if you're seeing performance issues
for your workload, we can likely suggest alternatives (e.g. using full-text
search or a different filter). This is not a fundamental limitations, and we
plan to introduce indexes for these types of queries soon.
- **Use eventual consistency.** If you need higher query throughput and can tolerate
slightly stale results, consider using [eventual consistency](https://turbopuffer.com/docs/query#param-consistency)
for your queries.

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)