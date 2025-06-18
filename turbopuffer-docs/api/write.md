![Image 1](https://aorta.clickagy.com/pixel.gif?clkgypv=jstag)![Image 2](https://aorta.clickagy.com/channel-sync/4?clkgypv=jstag)![Image 3](https://aorta.clickagy.com/channel-sync/114?clkgypv=jstag)Write Documents

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

*   [Parameters](https://turbopuffer.com/docs/write#parameters)
*   [Attributes](https://turbopuffer.com/docs/write#attributes)
*   [Vectors](https://turbopuffer.com/docs/write#vectors)
*   [Examples](https://turbopuffer.com/docs/write#examples)
*   [Column-based writes](https://turbopuffer.com/docs/write#column-based-writes)
*   [Row-based writes](https://turbopuffer.com/docs/write#row-based-writes)
*   [Delete by filter](https://turbopuffer.com/docs/write#delete-by-filter)
*   [Schema](https://turbopuffer.com/docs/write#schema)

POST /v2/namespaces/:namespace
------------------------------

Creates, updates, or deletes documents.

Latency

Upsert latency

500kb docs

Percentile

Latency

p50

285ms

p90

370ms

p99

688ms

A `:namespace` is an isolated set of documents and is implicitly created when the first document is inserted. Within a namespace, documents are uniquely referred to by their ID. Upserting a document will overwrite any existing document with the same ID.

A namespace name can only contain ASCII alphanumeric characters, plus the `-`, `_`, and `.` special characters, and cannot be longer than 128 characters (i.e. must match `[A-Za-z0-9-_.]{1,128}`).

For performance, we recommend creating a namespace per isolated document space instead of filtering when possible. See [Performance](https://turbopuffer.com/docs/performance).

If a write request returns OK, data is guaranteed to be atomically and durably written to object storage. By default, writes are immediately visible to queries. You can read more about how upserts work on the [Architecture page](https://turbopuffer.com/architecture).

Each write request can have a maximum payload size of 256 MB. To maximize throughput and minimize cost, we recommend writing in large batches.

Every write must be associated with a document ID. Document IDs are unsigned 64-bit integers, 128-bit UUIDs, or strings. Mixing ID types in a namespace is not supported.

turbopuffer supports the following types of writes:

*   [Upserts](https://turbopuffer.com/docs/write#param-upsert_columns): creates or overwrites an entire document.
*   [Patches](https://turbopuffer.com/docs/write#param-patch_columns): updates one or more attributes of an existing document.
*   [Deletes](https://turbopuffer.com/docs/write#param-deletes): deletes an entire document by ID.
*   [Delete by filter](https://turbopuffer.com/docs/write#param-delete_by_filter): deletes documents that match a filter.
*   [Copy from namespace](https://turbopuffer.com/docs/write#param-copy_from_namespace): copies all documents from another namespace.

### [](https://turbopuffer.com/docs/write#parameters)Parameters

[](https://turbopuffer.com/docs/write#param-upsert_columns)

**upsert_columns**object

Upserts documents in a column-based format. This field is an object, where each key is the name of a column, and each value is an array of values for that column.

The `id` key is required, and must contain an array of document IDs.

The `vector` key is required if the namespace has a vector index. For non-vector namespaces, this key should be omitted. If present, it must contain an array of [vectors](https://turbopuffer.com/docs/write#vectors).

Any other keys will be stored as [attributes](https://turbopuffer.com/docs/write#attributes).

Each column must be the same length. When a document doesn't have a value for a given column, pass `null`.

**Example:**`{"id": [1, 2], "vector": [[1, 2, 3], [4, 5, 6]], "name": ["foo", "bar"]}`

Note: the v1 write API used null vectors to represent deletes. This is no longer the case in the v2 API - use the `deletes` field instead.

* * *

[](https://turbopuffer.com/docs/write#param-upsert_rows)

**upsert_rows**array

Upserts documents in a row-based format. Each row is an object with an `id` key, and a number of other keys.

The `id` key is required, and must contain a document ID.

The `vector` key is required if the namespace has a vector index. For non-vector namespaces, this key should be omitted. If present, it must contain a [vector](https://turbopuffer.com/docs/write#vectors).

Any other keys will be stored as [attributes](https://turbopuffer.com/docs/write#attributes).

**Example:**`[{"id": 1, "vector": [1, 2, 3], "name": "foo"}, {"id": 2, "vector": [4, 5, 6], "name": "bar"}]`

* * *

[](https://turbopuffer.com/docs/write#param-patch_columns)

**patch_columns**object

Patches documents in a column-based format. Identical to [`upsert_columns`](https://turbopuffer.com/docs/write#param-upsert_columns), but instead of overwriting entire documents, only the specified keys are written.

The `vector` key currently cannot be patched.

Any patches to IDs that don't already exist in the namespace will be ignored; patches will not create any missing documents.

**Example:**`{"id": [1, 2], "name": ["baz", "qux"]}`

* * *

[](https://turbopuffer.com/docs/write#param-patch_rows)

**patch_rows**array

Patches documents in a row-based format. Identical to [`upsert_rows`](https://turbopuffer.com/docs/write#param-upsert_rows), but instead of overwriting entire documents, only the specified keys are written.

The `vector` key currently cannot be patched.

Any patches to IDs that don't already exist in the namespace will be ignored; patches will not create any missing documents.

**Example:**`[{"id": 1, "name": "baz"}, {"id": 2, "name": "qux"}]`

* * *

[](https://turbopuffer.com/docs/write#param-deletes)

**deletes**array

Deletes documents by ID. Must be an array of document IDs.

**Example:**`[1, 2, 3]`

* * *

[](https://turbopuffer.com/docs/write#param-delete_by_filter)

**delete_by_filter**object

You can delete documents that match a filter using [`delete_by_filter`](https://turbopuffer.com/docs/write#delete-by-filter). It has the same syntax as the [`filters` parameter in the query API](https://turbopuffer.com/docs/query#filtering).

If `delete_by_filter` is used in the same request as other write operations, `delete_by_filter` will be applied before the other operations. This allows you to delete rows that match a filter before writing new row with overlapping IDs. Note that patches to any deleted rows are ignored.

**Example:**`['page_id', 'Eq', '123']`

* * *

[](https://turbopuffer.com/docs/write#param-distance_metric)

**distance_metric**cosine_distance | euclidean_squared required unless copy_from_namespace is set or no vector is set

The function used to calculate vector similarity. Possible values are `cosine_distance` or `euclidean_squared`.

`cosine_distance` is defined as `1 - cosine_similarity` and ranges from 0 to 2. Lower is better.

`euclidean_squared` is defined as `sum((x - y)^2)`. Lower is better.

* * *

[](https://turbopuffer.com/docs/write#param-copy_from_namespace)

**copy_from_namespace**string

Copy all documents from a namespace into this namespace. This operation is currently limited to copying within the same region and organization. The initial request currently cannot make schema changes or contain documents. Contact us if you need any of this.

Copying is billed at a 50% write discount which stacks with the up to 50% discount for batched writes. This is a faster, cheaper alternative to re-upserting documents for backups and namespaces that share documents.

**Example:**`"source-namespace"`

* * *

[](https://turbopuffer.com/docs/write#param-schema)

**schema**object

By default, the schema is inferred from the passed data. See [Defining the Schema](https://turbopuffer.com/docs/write#schema) below for details.

There are cases where you want to manually specify the schema because turbopuffer can't automatically infer it. For example, to specify UUID types, configure full-text search for an attribute, or disable filtering for an attribute.

**Example:**`{"permissions": "[]uuid", "text": {"type": "string", "full_text_search": true}, "encrypted_blob": {"type": "string", "filterable": false}}`

* * *

[](https://turbopuffer.com/docs/write#param-encryption)

**encryption**object optional

Only available as part of our enterprise offerings. [Contact us](https://turbopuffer.com/contact/sales).

Setting a Customer Managed Encryption Key (CMEK) will encrypt all data in a namespace using a secret coming from your cloud KMS. Once set, all subsequent writes to this namespace will be encrypted, but data written prior to this upsert will be unaffected.

Currently, turbopuffer does not re-encrypt data when you rotate key versions, meaning old data will remain encrypted using older key verisons, while fresh writes will be encrypted using the latest versions. **Revoking old key versions will cause data loss.** To re-encrypt your data using a more recent key, use the [export](https://turbopuffer.com/docs/export) API to re-upsert into a new namespace.

**Example (GCP):**`{ "cmek": { "key_name": "projects/myproject/locations/us-central1/keyRings/EXAMPLE/cryptoKeys/KEYNAME"  } }`

**Example (AWS):**`{ "cmek": { "key_name": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"  } }`

### [](https://turbopuffer.com/docs/write#attributes)Attributes

Documents can optionally include attributes, which can be used to [filter search results](https://turbopuffer.com/docs/query#filtering), for [FTS indexes](https://turbopuffer.com/docs/query#full-text-search), or simply to store additional data.

Attribute names can be up to 128 characters in length and must not start with a `$` character.

Attributes must have consistent value types. For example, if a document is upserted containing attribute key `foo` with a string value, all future documents that specify `foo` must also use a string value (or null).

The schema is automatically inferred, but can be [configured](https://turbopuffer.com/docs/write#schema) to control type and indexing behavior. Some attribute types, such as the `uuid` or `datetime` type, cannot be inferred automatically, and must be specified in the schema.

If a new attribute is added, this attribute will default to `null` for any documents that existed before the attribute was added. If you would like to backfill values for existing documents, use [`patch_columns`](https://turbopuffer.com/docs/write#param-patch_columns).

By default, all attributes are indexed into an inverted index. An inverted index allows filters to be fast, even for large intersects.

To disable indexing for an attribute, set the `filterable` field to `false` in the schema, for a 50% discount and improved indexing performance. The attribute can still be returned, but not filtered.

Some limits apply to attribute sizes and number of attribute names per namespace. See [Limits](https://turbopuffer.com/docs/limits).

### [](https://turbopuffer.com/docs/write#vectors)Vectors

Vectors are arrays of f32 or f16 values, and are encoded in the API as an array of JSON numbers or as a base64-encoded string.

To use `f16` vectors, the [`vector` field must be explicitly specified in the `schema`](https://turbopuffer.com/docs/schema#param-vector) when first creating the namespace.

Each vector in the namespace must have the same number of dimensions.

If using the base64 encoding, the vector must be serialized in little-endian float32 or float16 binary format, then base64-encoded. The base64 string encoding can be more efficient on both the client and server.

A namespace can be created without vectors. In this case, the `vector` key must be omitted from all write requests.

### [](https://turbopuffer.com/docs/write#examples)Examples

#### [](https://turbopuffer.com/docs/write#column-based-writes)Column-based writes

Bulk document operations should use a column-oriented layout for best performance. You can pass any combination of `upsert_columns`, `patch_columns`, `deletes`, and `delete_by_filter` to the write request.

If the same document ID appears multiple times in the request, the request will fail with an HTTP 400 error.

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('write-upsert-columns-example-py')
# If an error occurs, this call raises a turbopuffer.APIError if a retry was not successful.
ns.write(
    upsert_columns={
        'id': [1, 2, 3, 4],
        'vector': [[0.1, 0.1], [0.2, 0.2], [0.3, 0.3], [0.4, 0.4]],
        'my-string': ['one', None, 'three', 'four'],
        'my-uint': [12, None, 84, 39],
        'my-bool': [True, None, False, True],
        'my-string-array': [['a', 'b'], ['b', 'd'], [], ['c']]
    },
    patch_columns={
        'id': [5, 6],
        'my-bool': [True, False],
    },
    deletes=[7, 8],
    distance_metric='cosine_distance'
)
```

#### [](https://turbopuffer.com/docs/write#row-based-writes)Row-based writes

Row-based writes may be more convenient than column-based writes. You can pass any combination of `upsert_rows`, `patch_rows`, `deletes`, and `delete_by_filter` to the write request.

If the same document ID appears multiple times in the request, the request will fail with an HTTP 400 error.

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('write-upsert-row-py-example')
# If an error occurs, this call raises a turbopuffer.APIError if a retry was not successful.
ns.write(
    upsert_rows=[
        {
            'id': 1,
            'vector': [0.1, 0.1],
            'my-string': 'one',
            'my-uint': 12,
            'my-bool': True,
            'my-string-array': ['a', 'b']
        },
        {
            'id': 2,
            'vector': [0.2, 0.2],
            'my-string-array': ['b', 'd']
        },
    ],
    patch_rows=[
        {
            'id': 3,
            'my-bool': True
        },
    ],
    deletes=[4],
    distance_metric='cosine_distance'
)
```

#### [](https://turbopuffer.com/docs/write#delete-by-filter)Delete by filter

To delete documents that match a filter, use `delete_by_filter`. This operation will return the actual number of documents removed.

Because the operation internally issues a query to determine which documents to delete, this operation is billed as both a query and a write operation.

If `delete_by_filter` is used in the same request as other write operations, `delete_by_filter` will be applied before the other operations. This allows you to delete rows that match a filter before writing new row with overlapping IDs. Note that patches to any deleted rows are ignored.

`delete_by_filter` has the same syntax as the [`filters` parameter in the query API](https://turbopuffer.com/docs/query#filtering).

curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('write-delete-by-filter-example-py')

ns.write(
    upsert_columns={
        'id': [101, 102],
        'vector': [[0.2, 0.8], [0.4, 0.4]],
        'title': ['LISP Guide for Beginners', 'AI for Practitioners'],
        'views': [10, 2500]
    },
    distance_metric='cosine_distance'
)

# Delete posts with titles that include the word "guide"
# and have 1000 or less views
result = ns.write(
    delete_by_filter=('And', [
        ('title', 'IGlob', '*guide*'),
        ('views', 'Lte', 1000)
    ])
)
print(result.rows_affected) # 1

results = ns.query(aggregate_by={"count": ("Count", "id")})
print(len(results.aggregations)) # 1
```

#### [](https://turbopuffer.com/docs/write#schema)Schema

The schema is optionally set on upsert to configure type and indexing behavior. By default, types are automatically inferred from the passed data and every attribute is indexed. To see what types were inferred, you can [inspect the schema](https://turbopuffer.com/docs/schema#inspect).

[The schema documentation](https://turbopuffer.com/docs/schema) lists all supported attribute types and indexing options. A few examples where manually configuring the schema is needed:

1.   **UUID** values serialized as strings can be stored in turbopuffer in an optimized format
2.   **Full-text search** for a string attribute
3.   **Disabling indexing/filtering** (`filterable:false`) for an attribute, for a 50% discount and improved indexing performance.

You can choose to pass the schema on every upsert, or only the first. There's no performance difference. If a new attribute is added, this attribute will default to `null` for any documents that existed before the attribute was added.

An example of (1), (2), and (3) on upsert:

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('write-schema-example-py')

ns.write(
    upsert_columns={
        'id': ["769c134d-07b8-4225-954a-b6cc5ffc320c", "3ad8c7b2-9c49-4ae5-819a-e014aef5c1ba", "611ea878-ed54-462b-82f2-10e5bb6e2110", "793afe55-ff77-4c64-9b9f-d26afd9faebe"],
        'vector': [[0.1, 0.1], [0.2, 0.2], [0.3, 0.3], [0.4, 0.4]],
        'text': ['the fox is quick and brown', 'fox jumped over the lazy dog', 'the dog is lazy and brown', 'the dog is a fox'],
        'string': ['fox', 'fox', 'dog', 'narwhal'],
        'permissions': [
            ['ee1f7c89-a3aa-43c1-8941-c987ee03e7bc', '95cdf8be-98a9-4061-8eeb-2702b6bbcb9e'],
            ['bfa20d1c-d8bc-4ec3-b2c3-d8b5d3e034e0'],
            ['ee1f7c89-a3aa-43c1-8941-c987ee03e7bc', 'bfa20d1c-d8bc-4ec3-b2c3-d8b5d3e034e0', 'ee1f7c89-a3aa-43c1-8941-c987ee03e7bc', '95cdf8be-98a9-4061-8eeb-2702b6bbcb9e'],
            ['95cdf8be-98a9-4061-8eeb-2702b6bbcb9e'],
        ]
    },
    distance_metric='cosine_distance',
    schema={
        'id': 'uuid',
        'text': {
            'type': 'string',
            'full_text_search': True # sets filterable: false, and enables FTS with default settings
        },
        'permissions': {
            'type': '[]uuid', # otherwise inferred as slower/more expensive []string
        }
    }
)
```

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
