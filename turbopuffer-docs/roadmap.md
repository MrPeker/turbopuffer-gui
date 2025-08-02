# Roadmap & Changelog

Last updated: July 22, 2025

### Up Next

* 📉 Query and indexing performance, always
* 📕 More full-text search features
* 📊 Dashboard improvements
* ∑ More aggregate functions (count, group by, min, max, sum, ..)

### Changelog

#### July 2025

* 🇸🇬 Singapore region
* 🇨🇦 Canada region
* 🎈 float type
* 🕳️ exclude\_attributes query parameter
* 🪢 Regex filter operator
* 📋 Listing namespaces is now consistent
* 💎 Ruby API client GA release

#### June 2025

* 👩🏽⚖️ Conditional writes
* 🔣 Multi-query API
* 📝 Contains and ContainsAny filter operators
* 🐍 Python async API client
* ☕ Java API client GA release (with improved ergonomics)
* 🦫 Go API client GA release
* 💸 Discount queries on large namespaces (80% discount after 32GB)

#### May 2025

* 🐡 turbopuffer is generally available
* 🎊 v2 query API (unifies vector and full-text ranking)
* ✌️ Count aggregate function
* 🦫 Go API client beta release
* ⏩ Up to 4x faster filtering and full-text search ranking

#### April 2025

* 🥳 v2 write API (includes patch support)
* 💾 Up to 33% reduction in p90 query latency by using Direct I/O for local SSD cache
* 🔼 Max operator for full-text search
* 🙅 Not filtering parameter
* ☀️ Warm cache endpoint
* ☁️ AWS us-east-2 region

#### March 2025

* ☁️ Public AWS regions
* 🐜 f16 vector type (50% reduced storage and query cost compared to f32)
* 🔢 i64 type (alongside existing u64)
* ⏰ datetime type
* 🔤 Custom tokenizers for full-text search
* 📝 ContainsAllTokens filter operator for full-text indexed attributes
* 📉 Up to 50% faster vector bulk upserts with client-side base64-encoding (default in new API clients)

#### February 2025

* ❌ delete\_by\_filter
* ⚖️ Product operator for weighted/boosted full-text search queries
* 🌊 Add or update full-text indexes on existing attributes
* 🦾 ARM support on GCP (increases end-to-end indexing throughput by 70%)
* 🤖 Java API client beta release

#### January 2025

* 🧮 Type checking for query filters against the namespace schema
* 📝 Blog post on Native filtering
* ⏰ Configurable consistency (strong or eventual) on queries (21ms -> 11ms p90 for 1M vectors)
* 🔒 Per-namespace Customer-Managed Encryption Key (CMEK) support

#### December 2024

* 🔢 Order by attributes
* 🔄 /v1/vectors deprecated in favor of /v1/namespaces

#### November 2024

* ✨ Support for Eq null and NotEq null filters
* 📑 All filter operators now supported in Filter-Only Search
* 📉 Faster queries during high write throughput (<100ms p90 consistent reads during 200+ WPS)
* 📉 Faster large namespaces (<100ms p50 on namespaces with 10M+ documents)
* 📉 Faster filters with 10-100K ids (50ms for 100K ids)
* 📕 Rewritten API docs, and new performance guide!

#### October 2024

* 📈 Improved write throughput, up to 10x faster in some cases
* 📊 Time-series data in dashboard (and faster!)
* 📜 Allow schema changes in upsert

#### September 2024

* 🔒 SOC 2 Type 2
* 📝 Blog post on Continuous Recall Measurement
* 🦣 8 MiB attribute value limit (up from 64 KiB)
* 🚁 Add copy\_from\_namespace to create a namespace by copying another namespace (50% discount relative to upserting from scratch)
* 🔳 Add uuid type (55% discount from string) and bool type

#### August 2024

* 📑 Support for range operators (Lt, Lte, Gt, Gte) within Filter-Only Search
* 📉 Faster queries with the TypeScript client (Observed 40% faster P99, 25% faster P90)
* 📉 2-3x RTT faster queries on high-latency links from TCP tuning (e.g. dev machines, edge devices, AltClouds, co-los)
* 📜 Schema endpoint
* 🔄 Allow certain schema updates (e.g. marking field as non-filterable for 50% discount)
* 📉 Dashboard faster for filtering millions of namespaces

#### July 2024

* 📉 Up to 10-100x faster document exporting
* 🏥 HIPAA compliance
* 🌐 More public regions (us-west, us-east, europe-west)
* 📑 Mark attributes as unindexed in the schema for a 50% discount
* 📉 2x faster P90 for id queries
* 📉 2-10x higher maximum write throughput

#### May 2024

* 🔍 BM25/Hybrid Search
* 📉 Up to 2x faster queries on large namespaces with lots of attributes (zero-copy storage)
* 📉 Up to 2x faster filtering for large namespaces (faster zero-copy bitmaps)
* 💰 Updated pricing to take attributes into account
* 🤖 Typescript client v0.5 with better connection pooling
* 📊 Dashboard and API support for prefix filtering of namespaces
* 📊 Named API Keys

#### April 2024

* 🔒 SOC2 Type 1 certification
* 📉 50% drop in all latency p50, p90, p99
* 🐡 Media kit

#### March 2024

* 📉 Faster cache fills and up to ~70% faster cold queries
* 📉 Faster range queries
* 🔍 Complex {And,Or,Range,Intersection} queries via new query planner
* 🔢 Number and Array attribute types
* 🌐 Official TypeScript Client
* 🔑 API Key read/write permissions
* 📐 Automatic recall measurement and evaluation

#### February 2024

* 🔍 And and Or filters
* 🤖 Row-based upsert API
* 🤖 Namespace list
* 📊 Web dashboard

#### January 2024

* 📉 <= 1s P99 cold query performance on 1M vectors
* 🤖 String IDs
* 🔍 Pre-filtering
* 🔍 Case insensitive filtering globs

#### December 2023

* 🤖 Python client
* 🔍 Filter by id
* 🌐 Architectural improvements for scalability
* 📚 Better docs

#### November 2023

* 🤖 String attributes
* 🔍 Filters (Glob, Exact)
* 🤖 Mutable Namespaces
* 🌐 New Website

#### October 2023

* 📉 Improved performance by 30-80%
* 🚀 Launch