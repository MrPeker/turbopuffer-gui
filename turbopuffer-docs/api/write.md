# Write Documents

## POST /v2/namespaces/:namespace

Creates, updates, or deletes documents.

### Latency

**Upsert latency** (500kb docs)

| Percentile | Latency |
|------------|---------|
| p50        | 285ms   |
| p90        | 370ms   |
| p99        | 688ms   |

A `:namespace` is an isolated set of documents and is implicitly created when the first document is inserted. Within a namespace, documents are uniquely referred to by their ID. Upserting a document will overwrite any existing document with the same ID.

A namespace name can only contain ASCII alphanumeric characters, plus the -, \_, and . special characters, and cannot be longer than 128 characters (i.e. must match [A-Za-z0-9-\_.]{1,128}).

For performance, we recommend creating a namespace per isolated document space instead of filtering when possible. See Performance.

If a write request returns OK, data is guaranteed to be atomically and durably written to object storage. By default, writes are immediately visible to queries. You can read more about how upserts work on the Architecture page.

Each write request can have a maximum payload size of 256 MB. To maximize throughput and minimize cost, we recommend writing in large batches.

Every write must be associated with a document ID. Document IDs are unsigned 64-bit integers, 128-bit UUIDs, or strings. Mixing ID types in a namespace is not supported.

turbopuffer supports the following types of writes:

* **Upserts**: creates or overwrites an entire document.
* **Patches**: updates one or more attributes of an existing document.
* **Deletes**: deletes an entire document by ID.
* **Conditional writes**: upsert, patch, or delete a document only if a condition.
* **Delete by filter**: deletes documents that match a filter.
* **Copy from namespace**: copies all documents from another namespace.

### Parameters

**upsert_rows** array

Upserts documents in a row-based format. Each row is an object with an id key, and a number of other keys.

The id key is required, and must contain a document ID.

The vector key is required if the namespace has a vector index. For non-vector namespaces, this key should be omitted. If present, it must contain a vector.

Any other keys will be stored as attributes.

Example: `[{"id": 1, "vector": [1, 2, 3], "name": "foo"}, {"id": 2, "vector": [4, 5, 6], "name": "bar"}]`

**upsert_columns** object

Upserts documents in a column-based format. This field is an object, where each key is the name of a column, and each value is an array of values for that column.

The id key is required, and must contain an array of document IDs.

The vector key is required if the namespace has a vector index. For non-vector namespaces, this key should be omitted. If present, it must contain an array of vectors.

Any other keys will be stored as attributes.

Each column must be the same length. When a document doesn't have a value for a given column, pass null.

Example: `{"id": [1, 2], "vector": [[1, 2, 3], [4, 5, 6]], "name": ["foo", "bar"]}`

**patch_rows** array

Patches documents in a row-based format. Identical to upsert_rows, but instead of overwriting entire documents, only the specified keys are written.

The vector key currently cannot be patched.

Any patches to IDs that don't already exist in the namespace will be ignored; patches will not create any missing documents.

Example: `[{"id": 1, "name": "baz"}, {"id": 2, "name": "qux"}]`

**deletes** array

Deletes documents by ID. Must be an array of document IDs.

Example: `[1, 2, 3]`

**upsert_condition** object

Makes each write in upsert_rows and upsert_columns conditional on the upsert_condition being satisfied for the document with the corresponding ID.

**delete_by_filter** object

You can delete documents that match a filter using delete_by_filter. It has the same syntax as the filters parameter in the query API.

**distance_metric** cosine_distance | euclidean_squared (required unless copy_from_namespace is set or no vector is set)

The function used to calculate vector similarity. Possible values are cosine_distance or euclidean_squared.

**schema** object

By default, the schema is inferred from the passed data. See Defining the Schema below for details.

### Attributes

Documents can optionally include attributes, which can be used to filter search results, for FTS indexes, or simply to store additional data.

Attribute names can be up to 128 characters in length and must not start with a $ character.

Attributes must have consistent value types. For example, if a document is upserted containing attribute key foo with a string value, all future documents that specify foo must also use a string value (or null).

### Vectors

Vectors are arrays of f32 or f16 values, and are encoded in the API as an array of JSON numbers or as a base64-encoded string.

To use f16 vectors, the vector field must be explicitly specified in the schema when first creating the namespace.

Each vector in the namespace must have the same number of dimensions.

If using the base64 encoding, the vector must be serialized in little-endian float32 or float16 binary format, then base64-encoded. The base64 string encoding can be more efficient on both the client and server.

A namespace can be created without vectors. In this case, the vector key must be omitted from all write requests.