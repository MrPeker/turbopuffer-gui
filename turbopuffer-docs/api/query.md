Query documents

===============

[Now open for all, let's get you puffin'turbopuffer is generally available, let's get you puffin'](https://turbopuffer.com/join)

Navigation
----------

[![Image 1: Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

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

*   [Request](https://turbopuffer.com/docs/query#request)
*   [Response](https://turbopuffer.com/docs/query#response)
*   [Examples](https://turbopuffer.com/docs/query#examples)
*   [Vector Search](https://turbopuffer.com/docs/query#vector-search)
*   [Filters](https://turbopuffer.com/docs/query#filters)
*   [Ordering by Attributes](https://turbopuffer.com/docs/query#ordering-by-attributes)
*   [Lookups](https://turbopuffer.com/docs/query#lookups)
*   [Aggregations](https://turbopuffer.com/docs/query#aggregations)
*   [Multi-queries](https://turbopuffer.com/docs/query#multi-queries)
*   [Full-Text Search](https://turbopuffer.com/docs/query#full-text-search)
*   [FTS operators](https://turbopuffer.com/docs/query#fts-operators)
*   [Field weights/boosts](https://turbopuffer.com/docs/query#field-weightsboosts)
*   [Phrase matching](https://turbopuffer.com/docs/query#phrase-matching)
*   [Filtering](https://turbopuffer.com/docs/query#filtering)
*   [Filtering Parameters](https://turbopuffer.com/docs/query#filtering-parameters)
*   [Complex Example](https://turbopuffer.com/docs/query#complex-example)
*   [Pagination](https://turbopuffer.com/docs/query#pagination)

POST /v2/namespaces/:namespace/query
------------------------------------

Query, filter, full-text search and vector search documents.

Latency

warm cold

1M docs

Percentile

Latency

p50

16ms

p90

21ms

p99

33ms

A query retrieves documents in a single [namespace](https://turbopuffer.com/docs/write), returning the ordered or highest-ranked documents that match the query's filters.

turbopuffer supports the following types of queries:

*   [Vector search](https://turbopuffer.com/docs/query#vector-search): find the documents closest to a query vector
*   [Full-text search](https://turbopuffer.com/docs/query#full-text-search): find documents with the highest [BM25 score](https://en.wikipedia.org/wiki/Okapi_BM25), a classic text search algorithm that considers query term frequency and document length
*   [Ordering by attributes](https://turbopuffer.com/docs/query#ordering-by-attributes): find all documents matching filters in order of an attribute
*   [Lookups](https://turbopuffer.com/docs/query#lookups): find all documents matching filters when order isn't important
*   [Aggregations](https://turbopuffer.com/docs/query#aggregations): aggregate attribute values across all documents matching filters
*   [Multi-queries](https://turbopuffer.com/docs/query#multi-queries): send multiple queries to the same namespace used for hybrid searches.

turbopuffer is fast by default. See [Performance](https://turbopuffer.com/docs/performance) for how you can influence performance.

### [](https://turbopuffer.com/docs/query#request)Request

[](https://turbopuffer.com/docs/query#param-rank_by)

**rank_by**array required unless aggregate_by is set

How to rank the documents in the namespace. Supported ranking functions:

*   [ANN](https://turbopuffer.com/docs/query#vector-search) ("approximate nearest neighbor")
*   [BM25](https://turbopuffer.com/docs/query#full-text-search) (combine with [Sum](https://turbopuffer.com/docs/query#fts-operators), [Max](https://turbopuffer.com/docs/query#fts-operators))
*   [Order by attribute](https://turbopuffer.com/docs/query#ordering-by-attributes)

For [hybrid search](https://turbopuffer.com/docs/hybrid-search), you can use [multi-queries](https://turbopuffer.com/docs/query#multi-queries) (e.g. BM25 + vector) and combine the results client-side with e.g. reciprocal-rank fusion. We encourage users to write a strong query layer abstraction, as it's not uncommon to do several turbopuffer queries per user query.

**Vector example:**`["vector", "ANN", [0.1, 0.2, 0.3, ..., 76.8]]`

**BM25:**`["text", "BM25", "fox jumping"]`

**Order by attribute example:**`["timestamp", "desc"]`

**BM25 with multiple, weighted fields:**

```json
["Sum", [
    ["Product", [2, ["title", "BM25", "fox jumping"]]],
    ["content", "BM25", "fox jumping"]
  ]
]
```

* * *

[](https://turbopuffer.com/docs/query#param-top_k)

**top_k**number required 

Number of documents to return.

Maximum: 1200 (adjustable upon request)

* * *

[](https://turbopuffer.com/docs/query#param-filters)

**filters**array optional

Exact filters for attributes to refine search results for. Think of it as a SQL WHERE clause.

See [Filtering Parameters](https://turbopuffer.com/docs/query#filtering-parameters) below for details.

When combined with a vector, the query planner will automatically combine the attribute index and the approximate nearest neighbor index for best performance and recall. See our post on [Native Filtering](https://turbopuffer.com/blog/native-filtering) for details.

For the best performance, separate documents into namespaces instead of filtering where possible. See also [Performance](https://turbopuffer.com/docs/performance).

**Example:**`["And", [["id", "Gte", 1000], ["permissions", "In", ["3d7a7296-3d6a-4796-8fb0-f90406b1f621", "92ef7c95-a212-43a4-ae4e-0ebc96a65764"]]]]`

* * *

[](https://turbopuffer.com/docs/query#param-include_attributes)

**include_attributes**array[string] | boolean default: id

List of attribute names to return in the response. Can be set to `true` to return all attributes. Return only the ones you need for best performance.

* * *

[](https://turbopuffer.com/docs/query#param-aggregate_by)

**aggregate_by**object required unless rank_by is set

[Aggregations](https://turbopuffer.com/docs/query#aggregations) to compute over all documents in the namespace that match the [filters](https://turbopuffer.com/docs/query#param-filters).

Cannot be specified with [rank_by](https://turbopuffer.com/docs/query#param-rank_by), [top_k](https://turbopuffer.com/docs/query#param-top_k), or [include_attributes](https://turbopuffer.com/docs/query#param-include_attributes). We plan to lift these restrictions soon.

Each entry in the object maps a label for the aggregation to an aggregate function. Supported aggregate functions:

*   `["Count", "attr"]`: counts the number of documents with a non-null value for the `attr` attribute. **Limitation:** currently only the `id` attribute is supported.

Example: `{"my_count_of_ids": ["Count", "id"]}`

* * *

[](https://turbopuffer.com/docs/query#param-queries)

**queries**array

Send an array of query objects to be executed simultaneously and atomically.

Currently, up to 2 queries can be sent per request, but this limit will be increased _soon_. Each sub-query will count against the [concurrent query limit](https://turbopuffer.com/docs/limits) for the namespace.

The provided array should consist of query objects, including every field except for `vector_encoding` or `consistency` which should be set on the root object.

The `queries` field is mutually exclusive with other query object fields, a request can contain either a multi-query or an ordinary query.

* * *

[](https://turbopuffer.com/docs/query#param-vector_encoding)

**vector_encoding**string default: float

The encoding to use for the vectors in the response. The supported encodings are `float` and `base64`.

If `float`, vectors are returned as arrays of numbers.

If `base64`, vectors are returned as base64-encoded strings representing the vectors serialized in little-endian float32 binary format.

This parameter has no effect if the `vector` attribute is not included in the response (see the [include_attributes](https://turbopuffer.com/docs/query#include_attributes) parameter).

* * *

[](https://turbopuffer.com/docs/query#param-consistency)

**consistency**object default: {'level': 'strong'}

Choose between strong and eventual read-after-write consistency.

*   Strong (default): `{"level": "strong"}`
*   Eventual: `{"level": "eventual"}` (<= 60s stale)

Queries always fetch and cache the latest set of writes from object storage. Strongly consistent queries wait for this fetch to complete before returning results. Eventually consistent queries can return results earlier if the node has a recent cache entry (<= 60s stale).

~99.9923% of production eventually consistent queries are fully consistent (same node handles reads & writes, barring rare routing changes).

Eventually consistent queries will search up to 128MiB of unindexed writes.

### [](https://turbopuffer.com/docs/query#response)Response

[](https://turbopuffer.com/docs/query#responsefield-rows)

**rows**array

An array of the [top_k](https://turbopuffer.com/docs/query#param-top_k) documents that matched the query, ordered by the ranking function. Only present if [rank_by](https://turbopuffer.com/docs/query#param-rank_by) is specified.

Each document is an object containing the [requested attributes](https://turbopuffer.com/docs/query#param-include_attributes). The `id` attribute is always included. The special attribute `$dist` is set to the ranking function's score for the document (distance from the query vector for `ANN`; BM25 score for `BM25`; omitted when ordering by an attribute).

**Example:**

```json
[
  {"$dist": 1.7, "id": 8, "extra_attr": "puffer"},
  {"$dist": 3.1, "id": 20, "extra_attr": "fish"}
]
```

[](https://turbopuffer.com/docs/query#responsefield-aggregations)

**aggregations**object

An object mapping the label for each [requested aggregation](https://turbopuffer.com/docs/query#param-aggregate_by) to the computed value. Only present if [aggregate_by](https://turbopuffer.com/docs/query#param-aggregate_by) is specified.

**Example:**

```json
{ "my_count_of_ids": 42 }
```

[](https://turbopuffer.com/docs/query#responsefield-billing)

**billing**object

The billable resources consumed by the query. The object contains the following fields:

*   `billable_logical_bytes_queried` (uint): the number of logical bytes processed by the query
*   `billable_logical_bytes_returned` (uint): the number of logical bytes returned by the query

[](https://turbopuffer.com/docs/query#responsefield-performance)

**performance**object

The performance metrics for the query. The object currently contains the following fields, but these fields may change name, type, or meaning in the future:

*   `cache_hit_ratio` (float): the ratio of cache hits to total cache lookups
*   `cache_temperature` (string): a qualitative description of the cache hit ratio (`hot`, `warm`, or `cold`)
*   `server_total_ms` (uint): request time measured on the server, including time spent waiting for other queries to complete if the namespace was at its [concurrency limit](https://turbopuffer.com/docs/limits)
*   `query_execution_ms` (uint): request time measured on the server, excluding time spent waiting due to the namespace concurrency limit
*   `exhaustive_search_count` (uint): the number of unindexed documents processed by the query
*   `approx_namespace_size` (uint): the approximate number of documents in the namespace

[Contact the turbopuffer team](https://turbopuffer.com/contact) if you need help interpreting these metrics.

### [](https://turbopuffer.com/docs/query#examples)Examples

#### [](https://turbopuffer.com/docs/query#vector-search)Vector Search

The query vector must have the same dimensionality as the vectors in the namespace being queried.

json curl python typescript go

Copy

```python
# $ pip install turbopuffer
import turbopuffer
import os

tpuf = turbopuffer.Turbopuffer(
    # API tokens are created in the dashboard: https://turbopuffer.com/dashboard
    api_key=os.getenv("TURBOPUFFER_API_KEY"),
    # Pick the right region: https://turbopuffer.com/docs/regions
    region="gcp-us-central1",
)

ns = tpuf.namespace('query-vector-example-py')

# If an error occurs, this call raises a turbopuffer.APIError if a retry was not successful.
result = ns.query(
    rank_by=("vector", "ANN", [0.1, 0.1]),
    top_k=10
)
print(result.rows)

# Prints a list of row-oriented documents:
# [
#   Row(id=1, vector=None, $dist=0.0),
#   Row(id=2, vector=None, $dist=2.0)
# ]
```

#### [](https://turbopuffer.com/docs/query#filters)Filters

When you need to filter documents, you can combine filters with vector search or use them alone. Here's an example of finding recent public documents:

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-filters-example-py')

result = ns.query(
    filters=('And', (
        ('timestamp', 'Gte', 1709251200),  # Documents after March 1, 2024
        ('public', 'Eq', True)
    )),
    rank_by=("vector", "ANN", [0.1, 0.2, 0.3]),  # Optional: include vector to combine with filters
    top_k=10,
    include_attributes=['title', 'timestamp']
)
print(result.rows)

# Prints a list of row-oriented documents:
# [
#   Row(id=1, vector=None, $dist=0.15, title='Getting Started Guide', timestamp=1709337600),
#   Row(id=2, vector=None, $dist=0.28, title=Advanced Features', timestamp=1709424000),
# ]
```

#### [](https://turbopuffer.com/docs/query#ordering-by-attributes)Ordering by Attributes

You can specify a `rank_by` parameter to order results by a specific attribute (i.e. SQL `ORDER BY`). For example, to order by timestamp in descending order:

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-ordering-example-py')

result = ns.query(
    filters=('timestamp', 'Lt', 1709251200),  # Documents before March 1, 2024
    rank_by=('timestamp', 'desc'),  # Order by timestamp in descending order
    top_k=1000,
    include_attributes=['title', 'timestamp']
)
print(result.rows)

# Prints a list of row-oriented documents:
# [
#   Row(id=6, vector=None, $dist=0.15, title='Roadmap', timestamp=1709020800),
#   Row(id=4, vector=None, $dist=0.28, title='Performance Guide', timestamp=1708761600),
# ]
```

Ordering by multiple attributes isn't yet implemented.

Similar to SQL, the ordering of results is not guaranteed when multiple documents have the same attribute value for the `rank_by` parameter. Array attributes aren't supported.

#### [](https://turbopuffer.com/docs/query#lookups)Lookups

To find all documents matching filters when order isn't important to you, rank by the `id` attribute, which is guaranteed to be present in every namespace:

```json
"filters": [...],
"rank_by": ["id", "asc"],
"top_k": ...
```

If you expect more than `top_k` results, see [Pagination](https://turbopuffer.com/docs/query#pagination).

#### [](https://turbopuffer.com/docs/query#aggregations)Aggregations

You can aggregate attribute values across all documents in the namespace that match the query's filters using the [aggregate_by parameter](https://turbopuffer.com/docs/query#param-aggregate_by).

For example, to count the number of documents in a namespace:

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-count-example-py')

result = ns.query(
    aggregate_by={'my_cool_count': ('Count', 'id')},
    filters=('cool_score', 'Gt', 7),
)
print(result.aggregations['my_cool_count'])
```

You cannot currently combine aggregations with [rank_by](https://turbopuffer.com/docs/query#param-rank_by). We plan to lift this restriction soon.

#### [](https://turbopuffer.com/docs/query#multi-queries)Multi-queries

You can provide multiple query objects to be executed simultaneously on a namespace. Individual subqueries can be one of any other primitive query type, simplifying complex retrieval workflows. Multi-queries offer better performance than issuing independent queries to the same namespace.

For example, a standard hybrid query combining full-text and vector searches executed together through a multi-query:

json curl python typescript go

Copy

```python
import turbopuffer as tpuf

tpuf = tpuf.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-multi-example-py')

response = ns.multi_query(queries = [
    { 'rank_by': ['vector', 'ANN', [1.0, 0.0]],  'top_k': 1 },
    { 'rank_by': ['attr1', 'BM25', 'quick fox'], 'top_k': 1 }
])
print(response.results)
```

Individual sub-queries can vary their parameters independently including different `filters`, `top_k`, `rank_by` or `aggregate_by`.

### [](https://turbopuffer.com/docs/query#full-text-search)Full-Text Search

The FTS attribute must be configured with `full_text_search` set in the schema when writing documents. See [Schema documentation](https://turbopuffer.com/docs/write#schema) and the [Full-Text Search guide](https://turbopuffer.com/docs/fts) for more details.

For an example of hybrid search (combining both vector and BM25 results), see [Hybrid Search](https://turbopuffer.com/docs/hybrid-search).

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-fts-basic-example-py')

result = ns.query(
    rank_by=('content', 'BM25', 'quick fox'),
    top_k=10,
    include_attributes=['title', 'content']
)
print(result.rows)
```

You can combine BM25 full-text search with filters to limit results to a specific subset of documents.

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-fts-example-ts')

result = ns.query(
    rank_by=('content', 'BM25', 'quick fox'),
    filters=('And', (
        ('timestamp', 'Gte', 1709251200),  # Documents after March 1, 2024
        ('public', 'Eq', True),
    )),
    top_k=10,
    include_attributes=['title', 'content', 'timestamp']
)
print(result.rows)

# Prints a list of row-oriented documents:
# [
#   Row(id=1, vector=None, $dist=0.85, title='Animal Stories', content='The quick brown fox...', timestamp=1709337600),
#   Row(id=2, vector=None, $dist=1.28, title='Forest Tales', content='A quick red fox...', timestamp=1709424000),
# ]
```

#### [](https://turbopuffer.com/docs/query#fts-operators)FTS operators

FTS operators combine the results of multiple sub-queries into a single score. Specifically, the following operators are supported:

*   `Sum`: Sum the scores of the sub-queries.
*   `Max`: Use the maximum score of sub-queries as the score.

Operators can be nested. For example:

```json
"rank_by": ["Sum", [
  ["Max", [
    ["title", "BM25", "whale facts"],
    ["description", "BM25", "whale facts"]
  ]],
  ["content", "BM25", "huge whale"]
]]
```

#### [](https://turbopuffer.com/docs/query#field-weightsboosts)Field weights/boosts

You can specify a weight / boost per-field by using the `Product` operator inside a `rank_by`. For example, to apply a 2x score multiplier on the `title` sub-query:

```json
"rank_by": ["Sum", [
  ["Product", [2, ["title", "BM25", "quick fox"]]],
  ["content", "BM25", "quick fox"]
]]
```

#### [](https://turbopuffer.com/docs/query#phrase-matching)Phrase matching

A simple form of phrase matching is supported with the `ContainsAllTokens` filter. This filter matches documents that contain all the tokens present in the filter input string:

```json
"filters": ["text", "ContainsAllTokens", "lazy walrus"]
```

Specifically, this filter would match a document containing "walrus is super lazy", but not a document containing only "lazy." Combining this with a `Not` filter can help exclude unwanted results:

```json
"filters": ["Not", ["text", "ContainsAllTokens", "polar bear"]]
```

Full phrase matching, i.e. requiring the exact phrase "lazy walrus", with the terms adjacent and in that order, is not yet supported.

### [](https://turbopuffer.com/docs/query#filtering)Filtering

Filters allow you to narrow down results by applying exact conditions to attributes. Conditions are arrays with an attribute name, operation, and value, for example:

*   `["attr_name", "Eq", 42]`
*   `["page_id", "In", ["page1", "page2"]]`
*   `["user_migrated_at", "NotEq", null]`

Values must have the same type as the attribute's value, or an array of that type for operators like `In`.

Filters are evaluated against an inverted index, which makes even large intersects fast. turbopuffer's [filtering is recall-aware for vector queries](https://turbopuffer.com/blog/native-filtering).

Conditions can be combined using `{And,Or}` operations:

```json
// basic And condition
"filters": ["And", [
  ["attr_name", "Eq", 42],
  ["page_id", "In", ["page1", "page2"]]
]]

// conditions can be nested
"filters": ["And", [
  ["page_id", "In", ["page1", "page2"]],
  ["Or", [
    ["public", "Eq", 1],
    ["permission_id", "In", ["3iQK2VC4", "wzw8zpnQ"]]
  ]]
]]
```

Filters can also be applied to the `id` field, which refers to the document ID.

#### [](https://turbopuffer.com/docs/query#filtering-parameters)Filtering Parameters

[](https://turbopuffer.com/docs/query#param-And)

**And**array[filter]

Matches if all of the filters match.

[](https://turbopuffer.com/docs/query#param-Or)

**Or**array[filter]

Matches if at least one of the filters matches.

[](https://turbopuffer.com/docs/query#param-Not)

**Not**filter

Matches if the filter does not match.

* * *

[](https://turbopuffer.com/docs/query#param-Eq)

**Eq**id or value

Exact match for `id` or `attributes` values. If value is `null`, matches documents missing the attribute.

[](https://turbopuffer.com/docs/query#param-NotEq)

**NotEq**value

Inverse of `Eq`, for `attributes` values. If value is `null`, matches documents with the attribute.

* * *

[](https://turbopuffer.com/docs/query#param-In)

**In**array[id] or array[value]

Matches any `id` or `attributes` values contained in the provided list. If both the provided value and the target document field are arrays, then this checks if any elements of the two sets intersect.

[](https://turbopuffer.com/docs/query#param-NotIn)

**NotIn**array[value]

Inverse of `In`, matches any `attributes` values not contained in the provided list.

* * *

[](https://turbopuffer.com/docs/query#param-Lt)

**Lt**value

For ints, this is a numeric less-than on `attributes` values. For strings, lexicographic less-than. For datetimes, numeric less-than on millisecond representation.

[](https://turbopuffer.com/docs/query#param-Lte)

**Lte**value

For ints, this is a numeric less-than-or-equal on `attributes` values. For strings, lexicographic less-than-or-equal. For datetimes, numeric less-than-or-equal on millisecond representation.

[](https://turbopuffer.com/docs/query#param-Gt)

**Gt**value

For ints, this is a numeric greater-than on `attributes` values. For strings, lexicographic greater-than. For datetimes, numeric greater-than on millisecond representation.

[](https://turbopuffer.com/docs/query#param-Gte)

**Gte**value

For ints, this is a numeric greater-than-or-equal on `attributes` values. For strings, lexicographic greater-than-or-equal. For datetimes, numeric greater-than-or-equal on millisecond representation.

* * *

[](https://turbopuffer.com/docs/query#param-Glob)

**Glob**globset

Unix-style glob match against string `attributes` values. The full syntax is described in the [globset](https://docs.rs/globset/latest/globset/#syntax) documentation. Glob patterns with a concrete prefix like "foo*" internally compile to efficient range queries

[](https://turbopuffer.com/docs/query#param-NotGlob)

**NotGlob**globset

Inverse of `Glob`, Unix-style glob filters against string `attributes` values. The full syntax is described in the [globset](https://docs.rs/globset/latest/globset/#syntax) documentation.

[](https://turbopuffer.com/docs/query#param-IGlob)

**IGlob**globset

Case insensitive version of `Glob`.

[](https://turbopuffer.com/docs/query#param-NotIGlob)

**NotIGlob**globset

Case insensitive version of `NotGlob`.

* * *

[](https://turbopuffer.com/docs/query#param-ContainsAllTokens)

**ContainsAllTokens**string

Matches if all tokens in the input string are present in the `attributes` value. Requires that the attribute is configured for [full-text search](https://turbopuffer.com/docs/fts).

#### [](https://turbopuffer.com/docs/query#complex-example)Complex Example

Using nested `And` and `Or` filters:

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-complex-filter-example-py')

# If an error occurs, this call raises a turbopuffer.APIError if a retry was not successful.
result = ns.query(
    rank_by=("vector", "ANN", [0.1, 0.1]),
    top_k=10,
    include_attributes=["key1"],
    filters=('And', (
        ('id', 'In', [1, 2, 3]),
        ('key1', 'Eq', 'one'),
        ('filename', 'NotGlob', '/vendor/**'),
        ('Or', [
            ('filename', 'Glob', '**.tsx'),
            ('filename', 'Glob', '**.js'),
        ]),
    ))
)
print(result.rows) # Returns a row-oriented VectorResult
```

### [](https://turbopuffer.com/docs/query#pagination)Pagination

When [Ordering by Attributes](https://turbopuffer.com/docs/query#ordering-by-attributes), you can page through results by advancing a filter on the order attribute. For example, to paginate by ID, advance a greater-than filter on ID:

python typescript go

Copy

```python
import turbopuffer
from turbopuffer.types import Filter
from typing import List

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('query-pagination-example-py')

last_id = None
while True:
    filters: List[Filter] = [('timestamp', 'Gte', 1)]

    if last_id is not None:
        filters.append(('id', 'Gt', last_id))

    result = ns.query(
        rank_by=('id', 'asc'),
        top_k=1000,
        filters=('And', filters),
    )
    print(result)

    if len(result.rows) < 1000:
        break
    last_id = result.rows[-1].id
```

Currently paginating beyond the first page for full-text search and vector search is not supported. Pass a larger `top_k` value to get more results and paginate client-side. If you need a higher limit, please [contact us](https://turbopuffer.com/contact).

![Image 2: turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about)[Pricing](https://turbopuffer.com/pricing)[Press & media](https://turbopuffer.com/press)[System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-2bro3fb5j-6Ys5st9UFDrm7qXQw_S9Rw)[Docs](https://turbopuffer.com/docs)[Email](https://turbopuffer.com/contact/support)[Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

[](https://x.com/turbopuffer)[](https://www.linkedin.com/company/turbopuffer/)[](https://bsky.app/profile/turbopuffer.bsky.social)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service)[Data Processing Agreement](https://turbopuffer.com/dpa)[Privacy Policy](https://turbopuffer.com/privacy-policy)[Security & Compliance](https://turbopuffer.com/docs/security)

[* SOC2 Type 2 certified * HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")
