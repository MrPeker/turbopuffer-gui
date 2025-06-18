![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Roadmap & Changelog

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

On this page

*   [Up Next](https://turbopuffer.com/docs/roadmap#up-next)
*   [Changelog](https://turbopuffer.com/docs/roadmap#changelog)
*   [June 2025](https://turbopuffer.com/docs/roadmap#june-2025)
*   [May 2025](https://turbopuffer.com/docs/roadmap#may-2025)
*   [April 2025](https://turbopuffer.com/docs/roadmap#april-2025)
*   [March 2025](https://turbopuffer.com/docs/roadmap#march-2025)
*   [February 2025](https://turbopuffer.com/docs/roadmap#february-2025)
*   [January 2025](https://turbopuffer.com/docs/roadmap#january-2025)
*   [December 2024](https://turbopuffer.com/docs/roadmap#december-2024)
*   [November 2024](https://turbopuffer.com/docs/roadmap#november-2024)
*   [October 2024](https://turbopuffer.com/docs/roadmap#october-2024)
*   [September 2024](https://turbopuffer.com/docs/roadmap#september-2024)
*   [August 2024](https://turbopuffer.com/docs/roadmap#august-2024)
*   [July 2024](https://turbopuffer.com/docs/roadmap#july-2024)
*   [May 2024](https://turbopuffer.com/docs/roadmap#may-2024)
*   [April 2024](https://turbopuffer.com/docs/roadmap#april-2024)
*   [March 2024](https://turbopuffer.com/docs/roadmap#march-2024)
*   [February 2024](https://turbopuffer.com/docs/roadmap#february-2024)
*   [January 2024](https://turbopuffer.com/docs/roadmap#january-2024)
*   [December 2023](https://turbopuffer.com/docs/roadmap#december-2023)
*   [November 2023](https://turbopuffer.com/docs/roadmap#november-2023)
*   [October 2023](https://turbopuffer.com/docs/roadmap#october-2023)

Roadmap & Changelog
===================

**Last updated:** Jun 10, 2025

### [](https://turbopuffer.com/docs/roadmap#up-next)Up Next

*   📉 Query and indexing performance, always
*   🔣 Multi-query API
*   🦣 < 250ms p90 for 100M+ documents in a namespace w/ 90% recall
*   📕 More full-text search features
*   ∑ More aggregate functions (min, max, sum, ..)
*   🐜 ~~f16~~/int8/binary vectors

### [](https://turbopuffer.com/docs/roadmap#changelog)Changelog

#### [](https://turbopuffer.com/docs/roadmap#june-2025)June 2025

*   🐍 [Python async API client](https://github.com/turbopuffer/turbopuffer-python?tab=readme-ov-file#async-usage)

#### [](https://turbopuffer.com/docs/roadmap#may-2025)May 2025

*   🐡 [turbopuffer is generally available](https://x.com/turbopuffer/status/1922658719231562151)
*   🎊 [v2 query API](https://turbopuffer.com/docs/query) (unifies vector and full-text ranking)
*   ✌️ `Count`[aggregate function](https://turbopuffer.com/docs/query#aggregations)
*   🦫 [Go API client](https://github.com/turbopuffer/turbopuffer-go) beta release
*   ⏩ [Up to 4x faster filtering and full-text search ranking](https://x.com/turbopuffer/status/1930274776779530393)

#### [](https://turbopuffer.com/docs/roadmap#april-2025)April 2025

*   🥳 [v2 write API](https://turbopuffer.com/docs/write) (includes [patch support](https://turbopuffer.com/docs/write#param-patch_columns))
*   💾 [Up to 33% reduction in p90 query latency by using Direct I/O for local SSD cache](https://x.com/turbopuffer/status/1919869269623316631)
*   🔼 `Max`[operator](https://turbopuffer.com/docs/query#fts-operators) for full-text search
*   🙅 `Not`[filtering parameter](https://turbopuffer.com/docs/query#filtering-parameters)
*   ☀️ [Warm cache](https://turbopuffer.com/docs/warm-cache) endpoint
*   ☁️ [AWS us-east-2 region](https://turbopuffer.com/docs/regions)

#### [](https://turbopuffer.com/docs/roadmap#march-2025)March 2025

*   ☁️ [Public AWS regions](https://turbopuffer.com/docs/regions)
*   🐜 [`f16` vector type](https://turbopuffer.com/docs/upsert#param-vectors) (50% reduced storage and query cost compared to `f32`)
*   🔢 [`i64` type](https://turbopuffer.com/docs/schema#param-type) (alongside existing `u64`)
*   ⏰ [`datetime` type](https://turbopuffer.com/docs/schema#param-type)
*   🔤 [Custom tokenizers](https://turbopuffer.com/docs/schema#tokenizers-for-full-text-search) for full-text search
*   📝 [`ContainsAllTokens` filter operator](https://turbopuffer.com/docs/query#param-ContainsAllTokens) for full-text indexed attributes
*   📉 Up to 50% faster vector bulk upserts with client-side [base64-encoding](https://turbopuffer.com/docs/upsert#param-vectors) (default in new API clients)

#### [](https://turbopuffer.com/docs/roadmap#february-2025)February 2025

*   ❌ [delete_by_filter](https://turbopuffer.com/docs/upsert#delete-by-filter)
*   ⚖️ `Product` operator for weighted/boosted [full-text search queries](https://turbopuffer.com/docs/query#full-text-search)
*   🌊 [Add or update full-text indexes on existing attributes](https://turbopuffer.com/docs/upsert#schema)
*   🦾 ARM support on GCP ([increases end-to-end indexing throughput by 70%](https://x.com/turbopuffer/status/1894871601633800276))
*   🤖 [Java API client](https://github.com/turbopuffer/turbopuffer-java)

#### [](https://turbopuffer.com/docs/roadmap#january-2025)January 2025

*   🧮 Type checking for query filters against the namespace [schema](https://turbopuffer.com/docs/schema)
*   📝 Blog post on [Native filtering](https://turbopuffer.com/blog/native-filtering)
*   ⏰ Configurable consistency (strong or eventual) on [queries](https://turbopuffer.com/docs/query) (21ms -> 11ms p90 for 1M vectors)
*   🔒 Per-namespace Customer-Managed Encryption Key (CMEK) support

#### [](https://turbopuffer.com/docs/roadmap#december-2024)December 2024

*   🔢 [Order by attributes](https://turbopuffer.com/docs/query#ordering-by-attributes)
*   🔄 `/v1/vectors` deprecated in favor of `/v1/namespaces`

#### [](https://turbopuffer.com/docs/roadmap#november-2024)November 2024

*   ✨ [Support for `Eq null` and `NotEq null` filters](https://turbopuffer.com/docs/query)
*   📑 [All filter operators now supported in Filter-Only Search](https://turbopuffer.com/docs/query)
*   📉 Faster queries during high write throughput (<100ms p90 consistent reads during 200+ WPS)
*   📉 Faster large namespaces (<100ms p50 on namespaces with 10M+ documents)
*   📉 Faster filters with 10-100K ids (50ms for 100K ids)
*   📕 [Rewritten API docs, and new performance guide!](https://turbopuffer.com/docs/performance)

#### [](https://turbopuffer.com/docs/roadmap#october-2024)October 2024

*   📈 Improved write throughput, up to 10x faster in some cases
*   📊 Time-series data in dashboard (and faster!)
*   📜 Allow [schema changes](https://turbopuffer.com/docs/upsert#schema) in upsert

#### [](https://turbopuffer.com/docs/roadmap#september-2024)September 2024

*   🔒 [SOC 2 Type 2](https://turbopuffer.com/docs/security)
*   📝 Blog post on [Continuous Recall Measurement](https://turbopuffer.com/blog/continuous-recall)
*   🦣 8 MiB attribute value limit (up from 64 KiB)
*   🚁 Add [`copy_from_namespace`](https://turbopuffer.com/docs/upsert) to create a namespace by copying another namespace (50% discount relative to upserting from scratch)
*   🔳 [Add `uuid` type (55% discount from string) and `bool` type](https://turbopuffer.com/docs/schema)

#### [](https://turbopuffer.com/docs/roadmap#august-2024)August 2024

*   📑 Support for range operators (Lt, Lte, Gt, Gte) within [Filter-Only Search](https://turbopuffer.com/docs/query#filter-only-search)
*   📉 [Faster queries with the TypeScript client](https://github.com/turbopuffer/turbopuffer-typescript/pull/26) (Observed 40% faster P99, 25% faster P90)
*   📉 2-3x RTT faster queries on high-latency links from TCP tuning (e.g. dev machines, edge devices, AltClouds, co-los)
*   📜 [Schema endpoint](https://turbopuffer.com/docs/schema)
*   🔄 Allow certain schema updates (e.g. marking field as [non-filterable for 50% discount](https://turbopuffer.com/docs/schema#update-the-schema-of-a-namespace))
*   📉 Dashboard faster for filtering millions of namespaces

#### [](https://turbopuffer.com/docs/roadmap#july-2024)July 2024

*   📉 Up to [10-100x faster document exporting](https://turbopuffer.com/docs/export)
*   🏥 HIPAA compliance
*   🌐 More [public regions](https://turbopuffer.com/docs/regions) (us-west, us-east, europe-west)
*   📑 Mark attributes as unindexed in the [schema](https://turbopuffer.com/docs/upsert#schema) for a 50% discount
*   📉 2x faster [P90 for id queries](https://x.com/turbopuffer/status/1814727719281692979)
*   📉 2-10x higher maximum write throughput

#### [](https://turbopuffer.com/docs/roadmap#may-2024)May 2024

*   🔍 [BM25/Hybrid Search](https://turbopuffer.com/docs/hybrid-search)
*   📉 [Up to 2x faster queries on large namespaces with lots of attributes](https://x.com/pushrax/status/1799156380059967856) (zero-copy storage)
*   📉 Up to 2x faster filtering for large namespaces (faster zero-copy bitmaps)
*   💰 [Updated pricing to take attributes into account](https://turbopuffer.com/)
*   🤖 [Typescript client v0.5 with better connection pooling](https://github.com/turbopuffer/turbopuffer-typescript/pull/12)
*   📊 [Dashboard](https://share.cleanshot.com/g6nRqjMx) and [API](https://turbopuffer.com/docs/namespaces) support for prefix filtering of namespaces
*   📊 [Named API Keys](https://share.cleanshot.com/swgFTcfD)

#### [](https://turbopuffer.com/docs/roadmap#april-2024)April 2024

*   🔒 SOC2 Type 1 certification
*   📉 [50% drop in all latency p50, p90, p99](https://x.com/turbopuffer/status/1781337784977850645)
*   🐡 [Media kit](https://turbopuffer.com/press)

#### [](https://turbopuffer.com/docs/roadmap#march-2024)March 2024

*   📉 [Faster cache fills and up to ~70% faster cold queries](https://x.com/pushrax/status/1772374078709530724)
*   📉 [Faster range queries](https://x.com/Bojan93112526/status/1773412444355829952)
*   🔍 [Complex {And,Or,Range,Intersection} queries via new query planner](https://turbopuffer.com/docs/query)
*   🔢 [Number and Array attribute types](https://turbopuffer.com/docs/upsert)
*   🌐 [Official TypeScript Client](https://www.npmjs.com/package/@turbopuffer/turbopuffer)
*   🔑 [API Key read/write permissions](https://x.com/turbopuffer/status/1772717717545426997)
*   📐 [Automatic recall measurement and evaluation](https://x.com/turbopuffer/status/1773111405924741194)

#### [](https://turbopuffer.com/docs/roadmap#february-2024)February 2024

*   🔍 [And and Or filters](https://x.com/Bojan93112526/status/1754952458898383012)
*   🤖 [Row-based upsert API](https://x.com/Bojan93112526/status/1754905892267405464)
*   🤖 [Namespace list](https://turbopuffer.com/docs/reference/namespaces)
*   📊 [Web dashboard](https://x.com/turbopuffer/status/1756057099698631103)

#### [](https://turbopuffer.com/docs/roadmap#january-2024)January 2024

*   📉 [`<= 1s` P99 cold query performance on 1M vectors](https://x.com/Sirupsen/status/1742617541099573635)
*   🤖 String IDs
*   🔍 Pre-filtering
*   🔍 Case insensitive filtering globs

#### [](https://turbopuffer.com/docs/roadmap#december-2023)December 2023

*   🤖 [Python client](https://pypi.org/project/turbopuffer/)
*   🔍 Filter by id
*   🌐 Architectural improvements for scalability
*   📚 Better docs

#### [](https://turbopuffer.com/docs/roadmap#november-2023)November 2023

*   🤖 String attributes
*   🔍 Filters (Glob, Exact)
*   🤖 Mutable Namespaces
*   🌐 New Website

#### [](https://turbopuffer.com/docs/roadmap#october-2023)October 2023

*   📉 [Improved performance by 30-80%](https://x.com/pushrax/status/1719419280788189645)
*   🚀 Launch

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
