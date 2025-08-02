# Query documents

## POST /v2/namespaces/:namespace/query

Query, filter, full-text search and vector search documents.

### Latency

**1M docs**

| Percentile | Latency |
|------------|---------|
| p50        | 16ms    |
| p90        | 21ms    |
| p99        | 33ms    |

A query retrieves documents in a single namespace, returning the ordered or highest-ranked documents that match the query's filters.

turbopuffer supports the following types of queries:

* **Vector search**: find the documents closest to a query vector
* **Full-text search**: find documents with the highest BM25 score, a classic text search algorithm that considers query term frequency and document length
* **Ordering by attributes**: find all documents matching filters in order of an attribute
* **Lookups**: find all documents matching filters when order isn't important
* **Aggregations**: aggregate attribute values across all documents matching filters
* **Multi-queries**: send multiple queries to the same namespace used for hybrid searches.

### Request Parameters

**rank_by** array (required unless aggregate_by is set)

How to rank the documents in the namespace. Supported ranking functions:

* ANN ("approximate nearest neighbor")
* BM25 (combine with Sum, Max)
* Order by attribute

Vector example: `["vector", "ANN", [0.1, 0.2, 0.3, ..., 76.8]]`

BM25: `["text", "BM25", "fox jumping"]`

Order by attribute example: `["timestamp", "desc"]`

**top_k** number (required)

Number of documents to return. Maximum: 1200 (adjustable upon request)

**filters** array (optional)

Exact filters for attributes to refine search results for. Think of it as a SQL WHERE clause.

Example: `["And", [["id", "Gte", 1000], ["permissions", "ContainsAny", ["3d7a7296-3d6a-4796-8fb0-f90406b1f621"]]]]`

**include_attributes** array[string] | boolean (default: id)

List of attribute names to return in the response. Can be set to true to return all attributes. Return only the ones you need for best performance.

**exclude_attributes** array[string]

List of attribute names to exclude from the response. All other attributes will be included in the response.

**aggregate_by** object (required unless rank_by is set)

Aggregations to compute over all documents in the namespace that match the filters.

**queries** array

Send an array of query objects to be executed simultaneously and atomically. Up to 16 queries can be sent per request.

**consistency** object (default: {'level': 'strong'})

Choose between strong and eventual read-after-write consistency.

* Strong (default): `{"level": "strong"}`
* Eventual: `{"level": "eventual"}` (<= 60s stale)

### Response

**rows** array

An array of the top_k documents that matched the query, ordered by the ranking function.

Example:
```json
[
  {"$dist": 1.7, "id": 8, "extra_attr": "puffer"}, 
  {"$dist": 3.1, "id": 20, "extra_attr": "fish"}
]
```

**aggregations** object

An object mapping the label for each requested aggregation to the computed value.

**billing** object

The billable resources consumed by the query.

**performance** object

The performance metrics for the query.

### Filtering

Filters allow you to narrow down results by applying exact conditions to attributes. Conditions are arrays with an attribute name, operation, and value:

* `["attr_name", "Eq", 42]`
* `["page_id", "In", ["page1", "page2"]]`
* `["user_migrated_at", "NotEq", null]`

#### Filtering Operators

* **And** array[filter] - Matches if all of the filters match
* **Or** array[filter] - Matches if at least one of the filters matches
* **Not** filter - Matches if the filter does not match
* **Eq** id or value - Exact match for id or attributes values
* **NotEq** value - Inverse of Eq
* **In** array[value] - Matches any attributes values contained in the provided list
* **NotIn** array[value] - Inverse of In
* **Contains** value - Checks whether the selected array attribute contains the provided value
* **ContainsAny** array[value] - Checks whether the selected array attribute contains any of the values provided
* **Lt, Lte, Gt, Gte** value - Numeric/lexicographic comparison operators
* **Glob** globset - Unix-style glob match against string or []string attribute values
* **Regex** string - Regular expression match against string attribute values
* **ContainsAllTokens** string - Matches if all tokens in the input string are present in the attributes value

### Full-Text Search

The FTS attribute must be configured with `full_text_search` set in the schema when writing documents.

#### FTS operators

* **Sum**: Sum the scores of the sub-queries
* **Max**: Use the maximum score of sub-queries as the score

Example with field weights:
```json
{
  "rank_by": ["Sum", [
    ["Product", [2, ["title", "BM25", "quick fox"]]], 
    ["content", "BM25", "quick fox"]
  ]]
}
```