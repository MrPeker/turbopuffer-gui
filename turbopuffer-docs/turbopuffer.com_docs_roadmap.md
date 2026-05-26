---
url: "https://turbopuffer.com/docs/roadmap"
title: "Roadmap & Changelog"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Roadmap & Changelog

**Last updated:** May 15, 2026

## Up Next

- ⚡ Faster & smarter cache warming
- 📊 Major dashboard improvements
- 📉 Query and indexing performance, _always_
- 📕 More full-text search features ( [~~rank by attribute~~](https://turbopuffer.com/docs/roadmap#february-2026), [~~rank by distance~~](https://turbopuffer.com/docs/roadmap#february-2026), highlighting, [~~fuzzy search~~](https://turbopuffer.com/docs/roadmap#may-2026), native
search-as-you-type, ...)
- ∑ More aggregate functions ( [~~count~~](https://turbopuffer.com/docs/roadmap#may-2025), [~~group by~~](https://turbopuffer.com/docs/roadmap#august-2025), [~~sum~~](https://turbopuffer.com/docs/roadmap#november-2025), distinct, min, max...)
- ⏱️ Late interaction support
- 🗂️ [~~Multiple vector columns~~](https://turbopuffer.com/docs/roadmap#march-2026)
- 🪆 Nested attributes
- 🌿 [~~Namespace branching~~](https://turbopuffer.com/docs/roadmap#may-2026)

## Changelog

### May 2026

- 🌿 [Namespace branching](https://turbopuffer.com/docs/branching): instant copy-on-write namespace cloning \[opt-in, beta\]
- ✏️ Typo-tolerant string matching with the [Fuzzy filter](https://turbopuffer.com/docs/fts#fuzzy-matching)

### April 2026

- 📌 [Pin a namespace to cache](https://turbopuffer.com/docs/pinning) for lower cost at high QPS
- 🕸️ Support for [sparse vector search](https://turbopuffer.com/docs/query/#sparse-vector-search)
- ↔️ GCP <-> AWS namespace copies with [`copy_from_namespace`](https://turbopuffer.com/docs/write#param-copy_from_namespace)
- 🔎 [Search](https://x.com/turbopuffer/status/2049175568621650275) the turbopuffer docs (type cmd+K!)
- 🏃‍♂️ Faster commit cadence on AWS for [2.5x lower write latency](https://x.com/turbopuffer/status/2042256535989125461)
- 💗 Increased full-text query length limit to [8,192 chars](https://turbopuffer.com/docs/limits)
- 🦣 Increased attributes per namespace limit to [1,024](https://turbopuffer.com/docs/limits)
- 🌎 3 new [regions](https://turbopuffer.com/docs/regions) (São Paulo, South Carolina, Belgium)
- 🧱 Drop #002 (lil block puff) now live on [turbopuffer.supply](https://turbopuffer.supply/)

### March 2026

- 🗂️ [Multiple vectors per document](https://turbopuffer.com/docs/write#multiple-vector-columns) now available for everyone
- 🔐 [Audit logs](https://turbopuffer.com/docs/audit-logs) with SIEM integration \[opt-in, beta\]
- ⚡️ [Up to 30% faster AND queries](https://x.com/turbopuffer/status/2029580228121800909)
- 📄 [Copy docs as markdown](https://x.com/turbopuffer/status/2036458185591234891) with token counts
- 3️⃣ Control term frequency's influence on BM25 scores with [k3](https://turbopuffer.com/docs/fts#advanced-tuning)

### February 2026

- 💵 [Query pricing reduced by up to 94%](https://turbopuffer.com/docs/pricing-log)
- 🔤 [Regex index](https://x.com/turbopuffer/status/2031097396743336409) for much faster `Regex`, `Glob`, and `IGlob` filters
- 🍵 [Up to 20% faster filtered FTS queries](https://x.com/turbopuffer/status/2023783644704452759)
- 💎 [Use attribute values](https://turbopuffer.com/docs/query#rank-by-attribute) to influence full-text search ranking
- 📐 Boost result recency with [distance ranking](https://turbopuffer.com/docs/query#rank-by-distance) in full-text search
- 🗂️ Store and query multiple vectors per document \[opt-in, beta\]
- 🇬🇧 [AWS eu-west-2 (London) region](https://turbopuffer.com/docs/regions)
- 🐡 [turbopuffer.supply](https://turbopuffer.supply/) \- the official tpuf store

### January 2026

- 🔡 [FTS v2](https://turbopuffer.com/blog/fts-v2): up to 20x faster full-text search, now live for everyone
- ☯️ Up to 26% faster FTS queries on high-frequency terms with [dynamic bit set encoding](https://x.com/turbopuffer/status/2012205150669086892)
- 🔌 [turbopuffer MCP Server](https://github.com/turbopuffer/turbopuffer-typescript/tree/main/packages/mcp-server) \[beta\]
- 🏷️ Match documents on any token with [`ContainsAnyToken`](https://turbopuffer.com/docs/query#param-ContainsAnyToken)
- 🔐 [Permissions guide](https://turbopuffer.com/docs/permissions) for document-level access control using filters
- 📝 [`remove_stopwords`](https://turbopuffer.com/docs/write#param-full_text_search) now defaults to `false` for more predictable FTS behavior
- 📊 Increase aggregate [`group_by` limit](https://turbopuffer.com/docs/query#param-group_by) to 10k

### December 2025

- 🧱 [Redesigned inverted index structure](https://turbopuffer.com/blog/fts-v2-postings) for faster
full-text search queries
- 📤 New
[object storage-native indexing queue](https://x.com/turbopuffer/status/2003504825817006549)
for up to 10x faster queue time
- 🔦 [`kNN` exact search](https://turbopuffer.com/docs/query#knn-exact-search) for 100% recall on
filtered vector search queries
- 🪣 Return a max number of search results per attribute value using
[`limit.per`](https://turbopuffer.com/docs/query#param-limit)
- 🇨🇦 [AWS ca-central-1 (Montreal) region](https://turbopuffer.com/docs/regions)
- 🌏 [Cross-region backups guide](https://turbopuffer.com/docs/backups)
- 🤝 Link multiple orgs to a single account for unified billing, SSO, and roles
\[opt-in, beta\]

### November 2025

- 🏎️ [FTS v2](https://turbopuffer.com/blog/fts-v2): up to 20x faster full-text search \[opt-in, beta\]
- 🔑 `copy_from_namespace` can now
[encrypt with a different key into the destination](https://turbopuffer.com/docs/cmek#does-turbopuffer-support-key-rotation)
- ✈️
[Cross-region, cross-org `copy_from_namespace`](https://turbopuffer.com/docs/write#param-copy_from_namespace)
for testing, backups, branching
- ⬆️ Max [limit.total](https://turbopuffer.com/docs/query#param-limit) raised from 1,200 to 10,000
- ➕ [`Sum` aggregate function](https://turbopuffer.com/docs/query#aggregations)
- 🔗 [`ContainsTokenSequence` filter](https://turbopuffer.com/docs/query#phrase-matching) for full-text
phrase matching
- 🔡 [`word_v3` tokenizer](https://turbopuffer.com/docs/fts#tokenizers) with Unicode-aware segmentation
- 🪭 [`ascii_folding` option](https://turbopuffer.com/docs/write#param-full_text_search) for full-text
search

### October 2025

- ⏫ [Rank by filter](https://turbopuffer.com/docs/query#rank-by-filter) for full-text search
- 🧩 [`patch_by_filter`](https://turbopuffer.com/docs/write#param-patch_by_filter)
- 🔘 [`[]bool` support](https://turbopuffer.com/docs/write#schema)
- 🏎️
[Improved performance](https://x.com/turbopuffer/status/1989306083517804937)
for [order-by queries](https://turbopuffer.com/docs/query#ordering-by-attributes)
- 👁️ View [indexing state](https://turbopuffer.com/docs/metadata#responsefield-index) in metadata API
- 📚 [Read replicas](https://turbopuffer.com/docs/limits) for scalable read throughput (opt-in)
- 🔐 Cross-region [PrivateLink connectivity](https://turbopuffer.com/docs/security#private-networking)
- 🏛️ [FIPS-compliant AWS endpoints](https://aws.amazon.com/compliance/fips/)
available for BYOC deployments

### September 2025

- 🧮 [ANN v3](https://x.com/turbopuffer/status/1978173877571441135): query 100B+
vectors with p99 of 200ms \[opt-in, beta\]
- 🚀
[5x object storage throughput](https://x.com/turbopuffer/status/1977751292891234453)
for faster cold queries and indexing
- 🔍 [Prefix queries](https://turbopuffer.com/docs/query#prefix-queries) for full-text search
- 💧 [Disable backpressure](https://turbopuffer.com/docs/write#param-disable_backpressure) for large
scale ingestions
- 🔐 Org-level option to
[enforce private networking](https://turbopuffer.com/docs/private-networking#enforcement)
- 💎 Ruby client gem renamed from `turbopuffer-ruby` to
[turbopuffer](https://rubygems.org/gems/turbopuffer)
- 📝 [2025 SOC 2 Type 2 audit report](https://turbopuffer.com/docs/security#soc2)
- 🇮🇪 [Ireland region](https://turbopuffer.com/docs/regions)

### August 2025

- 🟰 [`Eq` operator](https://turbopuffer.com/docs/query#filtering) for array attributes
- 🗂️ [Grouped aggregates](https://turbopuffer.com/docs/query#group-by) (facets)
- 🇰🇷 [South Korea region](https://turbopuffer.com/docs/regions)
- 🇮🇳 [India region](https://turbopuffer.com/docs/regions)
- 🔀 [`Any*` filter operators](https://turbopuffer.com/docs/query#filtering) for array attributes (e.g.
`AnyLt`, `AnyLte`, `AnyGt`, `AnyGte`)

### July 2025

- 🇸🇬 [Singapore region](https://turbopuffer.com/docs/regions)
- 🇨🇦 [Canada region](https://turbopuffer.com/docs/regions)
- 🕵️‍♀️ [Private Service Connect + PrivateLink support](https://turbopuffer.com/pricing)
- 🎈 [`float` type](https://turbopuffer.com/docs/write#param-type)
- 🕳️
[`exclude_attributes` query parameter](https://turbopuffer.com/docs/query#param-exclude_attributes)
- 🪢 [`Regex` filter operator](https://turbopuffer.com/docs/query#param-Regex)
- 📋 [Listing namespaces](https://turbopuffer.com/docs/namespaces) is now consistent
- 💎 [Ruby API client](https://github.com/turbopuffer/turbopuffer-ruby) GA
release

### June 2025

- 👩🏽‍⚖️ [Conditional writes](https://turbopuffer.com/docs/write#conditional-writes)
- 🔣 [Multi-query API](https://turbopuffer.com/docs/query#multi-queries)
- 📝 [`Contains` and `ContainsAny` filter operators](https://turbopuffer.com/docs/query#param-Contains)
- 🐍
[Python async API client](https://github.com/turbopuffer/turbopuffer-python?tab=readme-ov-file#async-usage)
- ☕ [Java API client](https://github.com/turbopuffer/turbopuffer-java) GA
release (with improved ergonomics)
- 🦫 [Go API client](https://github.com/turbopuffer/turbopuffer-go) GA release
- 💸 [Discount](https://turbopuffer.com/docs/pricing-log) queries on large namespaces (80% discount after 32GB)

### May 2025

- 🐡 [turbopuffer is generally available](https://x.com/turbopuffer/status/1922658719231562151)
- 🎊 [v2 query API](https://turbopuffer.com/docs/query) (unifies vector and full-text ranking)
- ✌️ `Count` [aggregate function](https://turbopuffer.com/docs/query#aggregations)
- 🦫 [Go API client](https://github.com/turbopuffer/turbopuffer-go) beta release
- ⏩ [Up to 4x faster filtering and full-text search ranking](https://x.com/turbopuffer/status/1930274776779530393)

### April 2025

- 🥳 [v2 write API](https://turbopuffer.com/docs/write) (includes
[patch support](https://turbopuffer.com/docs/write#param-patch_columns))
- 💾 [Up to 33% reduction in p90 query latency by using Direct I/O for local SSD\\
cache](https://x.com/turbopuffer/status/1919869269623316631)
- 🔼 `Max` [operator](https://turbopuffer.com/docs/query#fts-operators) for full-text search
- 🙅 `Not` [filtering parameter](https://turbopuffer.com/docs/query#filtering-parameters)
- ☀️ [Warm cache](https://turbopuffer.com/docs/warm-cache) endpoint
- ☁️ [AWS us-east-2 region](https://turbopuffer.com/docs/regions)

### March 2025

- ☁️ [Public AWS regions](https://turbopuffer.com/docs/regions)
- 🐜 [`f16` vector type](https://turbopuffer.com/docs/upsert#param-vectors) (50% reduced storage and
query cost compared to `f32`)
- 🔢 [`i64` type](https://turbopuffer.com/docs/write#param-type) (alongside existing `u64`)
- ⏰ [`datetime` type](https://turbopuffer.com/docs/write#param-type)
- 🔤 [Custom tokenizers](https://turbopuffer.com/docs/fts#tokenizers) for full-text search
- 📝 [`ContainsAllTokens` filter operator](https://turbopuffer.com/docs/query#param-ContainsAllTokens)
for full-text indexed attributes
- 📉 Up to 50% faster vector bulk upserts with client-side
[base64-encoding](https://turbopuffer.com/docs/upsert#param-vectors) (default in new API clients)

### February 2025

- ❌ [delete\_by\_filter](https://turbopuffer.com/docs/upsert#delete-by-filter)
- ⚖️ `Product` operator for weighted/boosted
[full-text search queries](https://turbopuffer.com/docs/query#full-text-search)
- 🌊
[Add or update full-text indexes on existing attributes](https://turbopuffer.com/docs/upsert#schema)
- 🦾 ARM support on GCP
( [increases end-to-end indexing throughput by 70%](https://x.com/turbopuffer/status/1894871601633800276))
- 🤖 [Java API client](https://github.com/turbopuffer/turbopuffer-java) beta
release

### January 2025

- 🧮 Type checking for query filters against the namespace
[schema](https://turbopuffer.com/docs/write#schema)
- 📝 Blog post on [Native filtering](https://turbopuffer.com/blog/native-filtering)
- ⏰ Configurable consistency (strong or eventual) on [queries](https://turbopuffer.com/docs/query)
(21ms -> 11ms p90 for 1M vectors)
- 🔒 Per-namespace Customer-Managed Encryption Key (CMEK) support

### December 2024

- 🔢
[Order by attributes](https://turbopuffer.com/docs/query#ordering-by-attributes)
- 🔄 `/v1/vectors` deprecated in favor of `/v1/namespaces`

### November 2024

- ✨
[Support for `Eq null` and `NotEq null` filters](https://turbopuffer.com/docs/query)
- 📑
[All filter operators now supported in Filter-Only Search](https://turbopuffer.com/docs/query)
- 📉 Faster queries during high write throughput (<100ms p90 consistent reads
during 200+ WPS)
- 📉 Faster large namespaces (<100ms p50 on namespaces with 10M+ documents)
- 📉 Faster filters with 10-100k ids (50ms for 100k ids)
- 📕
[Rewritten API docs, and new performance guide!](https://turbopuffer.com/docs/performance)

### October 2024

- 📈 Improved write throughput, up to 10x faster in some cases
- 📊 Time-series data in dashboard (and faster!)
- 📜 Allow [schema changes](https://turbopuffer.com/docs/upsert#schema) in upsert

### September 2024

- 🔒 [SOC 2 Type 2](https://turbopuffer.com/docs/security)
- 📝 Blog post on [Continuous Recall Measurement](https://turbopuffer.com/blog/continuous-recall)
- 🦣 8 MiB attribute value limit (up from 64 KiB)
- 🚁 Add [`copy_from_namespace`](https://turbopuffer.com/docs/upsert) to create a namespace by copying
another namespace (50% discount relative to upserting from scratch)
- 🔳
[Add `uuid` type (55% discount from string) and `bool` type](https://turbopuffer.com/docs/write#schema)

### August 2024

- 📑 Support for range operators (Lt, Lte, Gt, Gte) within
[Filter-Only Search](https://turbopuffer.com/docs/query#lookups)
- 📉
[Faster queries with the TypeScript client](https://github.com/turbopuffer/turbopuffer-typescript/pull/26)
(Observed 40% faster P99, 25% faster P90)
- 📉 2-3x RTT faster queries on high-latency links from TCP tuning (e.g. dev
machines, edge devices, AltClouds, co-los)
- 📜 [Schema endpoint](https://turbopuffer.com/docs/write#schema)
- 🔄 Allow certain schema updates (e.g. marking field as
[non-filterable for 50% discount](https://turbopuffer.com/docs/write#passing-a-schema))
- 📉 Dashboard faster for filtering millions of namespaces

### July 2024

- 📉 Up to
[10-100x faster document exporting](https://turbopuffer.com/docs/export)
- 🏥 HIPAA compliance
- 🌐 More [public regions](https://turbopuffer.com/docs/regions) (us-west, us-east, europe-west)
- 📑 Mark attributes as unindexed in the [schema](https://turbopuffer.com/docs/upsert#schema) for a 50%
discount
- 📉 2x faster
[P90 for id queries](https://x.com/turbopuffer/status/1814727719281692979)
- 📉 2-10x higher maximum write throughput

### May 2024

- 🔍 [BM25/Hybrid Search](https://turbopuffer.com/docs/hybrid-search)
- 📉
[Up to 2x faster queries on large namespaces with lots of attributes](https://x.com/pushrax/status/1799156380059967856)
(zero-copy storage)
- 📉 Up to 2x faster filtering for large namespaces (faster zero-copy bitmaps)
- 💰 [Updated pricing to take attributes into account](https://turbopuffer.com/)
- 🤖
[Typescript client v0.5 with better connection pooling](https://github.com/turbopuffer/turbopuffer-typescript/pull/12)
- 📊 [Dashboard](https://share.cleanshot.com/g6nRqjMx) and
[API](https://turbopuffer.com/docs/namespaces) support for prefix filtering of namespaces
- 📊 [Named API Keys](https://share.cleanshot.com/swgFTcfD)

### April 2024

- 🔒 SOC2 Type 1 certification
- 📉 [50% drop in all latency p50, p90, p99](https://x.com/turbopuffer/status/1781337784977850645)
- 🐡 [Media kit](https://turbopuffer.com/press)

### March 2024

- 📉 [Faster cache fills and up to ~70% faster cold queries](https://x.com/pushrax/status/1772374078709530724)
- 📉 [Faster range queries](https://x.com/Bojan93112526/status/1773412444355829952)
- 🔍 [Complex {And,Or,Range,Intersection} queries via new query\\
planner](https://turbopuffer.com/docs/query)
- 🔢 [Number and Array attribute types](https://turbopuffer.com/docs/upsert)
- 🌐 [Official TypeScript Client](https://www.npmjs.com/package/@turbopuffer/turbopuffer)
- 🔑 [API Key read/write permissions](https://x.com/turbopuffer/status/1772717717545426997)
- 📐 [Automatic recall measurement and evaluation](https://x.com/turbopuffer/status/1773111405924741194)

### February 2024

- 🔍 [And and Or filters](https://x.com/Bojan93112526/status/1754952458898383012)
- 🤖 [Row-based upsert API](https://x.com/Bojan93112526/status/1754905892267405464)
- 🤖 [Namespace list](https://turbopuffer.com/docs/reference/namespaces)
- 📊 [Web dashboard](https://x.com/turbopuffer/status/1756057099698631103)

### January 2024

- 📉 [`<= 1s` P99 cold query performance on 1M vectors](https://x.com/Sirupsen/status/1742617541099573635)
- 🤖 String IDs
- 🔍 Pre-filtering
- 🔍 Case insensitive filtering globs

### December 2023

- 🤖 [Python client](https://pypi.org/project/turbopuffer/)
- 🔍 Filter by id
- 🌐 Architectural improvements for scalability
- 📚 Better docs

### November 2023

- 🤖 String attributes
- 🔍 Filters (Glob, Exact)
- 🤖 Mutable Namespaces
- 🌐 New Website

### October 2023

- 📉 [Improved performance by 30-80%](https://x.com/pushrax/status/1719419280788189645)
- 🚀 Launch

copy page

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Pricing](https://turbopuffer.com/pricing) [Store](https://turbopuffer.supply/) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-3v27t102a-3RynqZ5A9vuOuAo68X_wFQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml) [Events](https://turbopuffer.com/events)

[turbopuffer on Twitter](https://x.com/turbopuffer)[turbopuffer on LinkedIn](https://www.linkedin.com/company/turbopuffer/)[turbopuffer on BlueSky](https://bsky.app/profile/turbopuffer.bsky.social)[turbopuffer on YouTube](https://www.youtube.com/@turbopufferdb)

© 2026 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa.pdf) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)

Docs search

esc

## Guides

[Quickstart\\
\\
Get started with turbopuffer in minutes](https://turbopuffer.com/docs/quickstart)

[Vector Search\\
\\
Perform approximate nearest neighbor searches](https://turbopuffer.com/docs/vector)

[Full-Text Search\\
\\
Learn how to use BM25 full-text search](https://turbopuffer.com/docs/fts)

[Hybrid Search\\
\\
Combine vector and full-text search strategies](https://turbopuffer.com/docs/hybrid)

## API Docs

[Write\\
\\
Create, update, or delete documents](https://turbopuffer.com/docs/write)

[Query\\
\\
Query documents with filters and ranking](https://turbopuffer.com/docs/query)

[Auth & Encoding\\
\\
Authentication, headers, and request encoding](https://turbopuffer.com/docs/auth)

[Namespace metadata\\
\\
Get metadata about a namespace](https://turbopuffer.com/docs/metadata)