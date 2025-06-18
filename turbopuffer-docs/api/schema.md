Schema

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

*   [Parameters](https://turbopuffer.com/docs/schema#parameters)
*   [Adding new attributes](https://turbopuffer.com/docs/schema#adding-new-attributes)
*   [Changing existing attributes](https://turbopuffer.com/docs/schema#changing-existing-attributes)
*   [Inspect](https://turbopuffer.com/docs/schema#inspect)
*   [Update](https://turbopuffer.com/docs/schema#update)
*   [Languages for full-text search](https://turbopuffer.com/docs/schema#languages-for-full-text-search)
*   [Tokenizers for full-text search](https://turbopuffer.com/docs/schema#tokenizers-for-full-text-search)
*   [Advanced tuning for full-text search](https://turbopuffer.com/docs/schema#advanced-tuning-for-full-text-search)

{GET, POST} /v1/namespaces/:namespace/schema
--------------------------------------------

Reads or updates the namespace schema.

turbopuffer maintains a schema for each namespace with type and indexing behaviour for each attribute.

The schema can be modified as you write documents.

A basic schema will be automatically inferred from the upserted data. You can explicitly configure a schema to specify types that can't be inferred (e.g. UUIDs) or to control indexing behaviour (e.g. enabling full-text search for an attribute). If any parameters are specified for an attribute, the type for that attribute must also be explicitly defined.

### [](https://turbopuffer.com/docs/schema#parameters)Parameters

Every attribute can have the following fields in its schema specified at [write time](https://turbopuffer.com/docs/write#schema):

[](https://turbopuffer.com/docs/schema#param-type)

**type**string required true

The data type of the attribute. Supported types:

*   `string`: String
*   `int`: Signed integer (i64)
*   `uint`: Unsigned integer (u64)
*   `uuid`: 128-bit UUID
*   `datetime`: Date and time
*   `bool`: Boolean
*   `[]string`: Array of strings
*   `[]int`: Array of signed integers
*   `[]uint`: Array of unsigned integers
*   `[]uuid`: Array of UUIDs
*   `[]datetime`: Array of dates and times

All attribute types are nullable by default, except `id` and `vector` which are required. `vector` will become an optional attribute soon. If you need a namespace without a vector, simply set `vector` to a random float.

Most types can be inferred from the write payload, except `uuid`, `datetime`, and their array variants, which all need to be set explicitly in the schema. See [UUID values](https://turbopuffer.com/docs/write#uuid-values) for an example.

By default, integers use a 64-bit signed type (`int`). To use an unsigned type, set the attribute type to `uint` explicitly in the schema.

`datetime` values should be provided as an ISO 8601 formatted string with a mandatory date and optional time and time zone. Internally, these values are converted to UTC (if the time zone is specified) and stored as a 64-bit integer representing milliseconds since the epoch.

**Example:**`["2015-01-20", "2015-01-20T12:34:56", "2015-01-20T12:34:56-04:00"]`

We'll be adding other data types soon. In the meantime, we suggest representing other data types as either strings or integers.

* * *

[](https://turbopuffer.com/docs/schema#param-filterable)

**filterable**boolean default: true (false if full-text search is enabled)

Whether or not the attribute can be used in [filters](https://turbopuffer.com/docs/query#filter-parameters)/WHERE clauses. Filtered attributes are indexed into an inverted index. At query-time, the [filter evaluation is recall-aware](https://turbopuffer.com/blog/native-filtering) when used for vector queries.

Unfiltered attributes don't have an index built for them, and are thus billed at a 50% discount (see [pricing](https://turbopuffer.com/#pricing)).

* * *

[](https://turbopuffer.com/docs/schema#param-full_text_search)

**full_text_search**boolean | object default: false

Whether this attribute can be used as part of a [BM25 full-text search](https://turbopuffer.com/docs/hybrid-search). Requires the `string` or `[]string` type, and by default, BM25-enabled attributes are not filterable. You can override this by setting `filterable: true`.

Can either be a boolean for default settings, or an object with the following optional fields:

*   `language` (string): The language of the text. Defaults to `english`. See: [Supported languages](https://turbopuffer.com/docs/schema#languages-for-full-text-search)
*   `stemming` (boolean): Language-specific stemming for the text. Defaults to `false` (i.e. do not stem).
*   `remove_stopwords` (boolean): Removes [common words](https://snowballstem.org/algorithms/english/stop.txt) from the text based on `language`. Defaults to `true` (i.e. remove common words).
*   `case_sensitive` (boolean): Whether searching is case-sensitive. Defaults to `false` (i.e. case-insensitive).
*   `tokenizer` (string): How to convert the text to a list of tokens. Defaults to `word_v1`. See: [Supported tokenizers](https://turbopuffer.com/docs/schema#tokenizers-for-full-text-search)
*   `k1` (float): Term frequency saturation parameter for BM25 scoring. Must be greater than zero. Defaults to `1.2`. See: [Advanced tuning](https://turbopuffer.com/docs/schema#advanced-tuning-for-full-text-search)
*   `b` (float): Document length normalization parameter for BM25 scoring. Must be in the range `[0.0, 1.0]`. Defaults to `0.75`. See: [Advanced tuning](https://turbopuffer.com/docs/schema#advanced-tuning-for-full-text-search)

If you require other types of full-text search options, please [contact us](https://turbopuffer.com/contact).

* * *

[](https://turbopuffer.com/docs/schema#param-vector)

**vector**object default: {'type': [dims]f32, 'ann': true}

Whether the upserted vectors are of type `f16` or `f32`.

To use `f16` vectors, this field needs to be explicitly specified in the `schema` when first creating (i.e. [writing to](https://turbopuffer.com/docs/write)) a namespace.

Example: `"vector": {"type": [512]f16, "ann": true}`

### [](https://turbopuffer.com/docs/schema#adding-new-attributes)Adding new attributes

New attributes can be added with a [write](https://turbopuffer.com/docs/write#schema) or an explicit [schema update](https://turbopuffer.com/docs/schema#update). All documents prior to the schema update will have the attribute set to `null`.

In most cases, the schema is inferred from the data you write. However, as part of a [write](https://turbopuffer.com/docs/write#schema), you can choose to specify the `schema` for attributes through above parameters (i.e. to use UUID values or enable BM25 full-text indexing).

### [](https://turbopuffer.com/docs/schema#changing-existing-attributes)Changing existing attributes

We support online, in-place changes of the `filterable` and `full_text_search` settings, by [setting the schema in a write](https://turbopuffer.com/docs/write#schema) or by sending an explicit [schema update](https://turbopuffer.com/docs/schema#update).

Other index settings changes, attribute type changes, and attribute deletions currently cannot be done in-place. Consider [exporting](https://turbopuffer.com/docs/export) documents and upserting into a new namespace if you require a schema change.

After enabling the `filterable` setting for an attribute, or adding/updating a full-text index, the index needs time to build before queries that depend on the index can be executed. turbopuffer will respond with HTTP status 202 to queries that depend on an index that is not yet built.

### [](https://turbopuffer.com/docs/schema#inspect)Inspect

To retrieve the current schema for a namespace, make a `GET` request to `/v1/namespaces/:namespace/schema`.

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('schema-inspect-example-py')

schema = ns.schema()
print(schema) # returns a Dict[str, turbopuffer.AttributeSchemaConfig]
```

### [](https://turbopuffer.com/docs/schema#update)Update

To update the schema for a namespace without a write, make a `POST` request to `/v1/namespaces/:namespace/schema`.

For example, to change an attribute called `my-text` to unfilterable:

json curl python typescript go

Copy

```python
import turbopuffer

tpuf = turbopuffer.Turbopuffer(
    region='gcp-us-central1', # pick the right region: https://turbopuffer.com/docs/regions
)

ns = tpuf.namespace('schema-update-example-py')

# Create a namespace with a `my-text` attribute that will default to filterable.
ns.write(
    upsert_columns={
        "id": [1],
        "my-text": ["the quick brown fox"],
    },
)

# Update the schema to make `my-text` unfilterable.
new_schema = ns.update_schema(
    schema={
        "my-text": {
            "type": "string",
            "filterable": False,
        }
    }
)
print(new_schema)
# {
#   'id': AttributeSchemaConfig(type='uint', ...),
#   'my-text': AttributeSchemaConfig(type='string', filterable=False, ...),
# }
```

### [](https://turbopuffer.com/docs/schema#languages-for-full-text-search)Languages for full-text search

turbopuffer currently supports language-aware stemming and stopword removal for full-text search. The following languages are supported:

*   `arabic`
*   `danish`
*   `dutch`
*   `english` (default)
*   `finnish`
*   `french`
*   `german`
*   `greek`
*   `hungarian`
*   `italian`
*   `norwegian`
*   `portuguese`
*   `romanian`
*   `russian`
*   `spanish`
*   `swedish`
*   `tamil`
*   `turkish`

Other languages can be supported by [contacting us](https://turbopuffer.com/contact).

### [](https://turbopuffer.com/docs/schema#tokenizers-for-full-text-search)Tokenizers for full-text search

*   `word_v2`
*   `word_v1` (default)
*   `word_v0`
*   `pre_tokenized_array`

The `word_v2` tokenizer forms tokens from ideographic codepoints, contiguous sequences of alphanumeric codepoints, and sequences of emoji codepoints that form a single glyph. Codepoints that are not alphanumeric, ideographic, or an emoji are discarded. Codepoints are classified according to Unicode v16.0.

The `word_v1` tokenizer works like the `word_v2` tokenizer, except that ideographic codepoints are treated as alphanumeric codepoint. Codepoints are classified according to Unicode v10.0.

The `word_v0` tokenizer works like the `word_v1` tokenizer, except that emoji codepoints are discarded.

The `pre_tokenized_array` tokenizer is a special tokenizer that indicates that you want to perform your own tokenization. This tokenizer can only be used on attributes of type `[]string`; each string in the array is interpreted as a token. When this tokenizer is active, queries using the `BM25` or `ContainsAllTokens` operators must supply a query operand of type `[]string` rather than `string`; each string in the array is interpreted as a token. Tokens are always matched case sensitively, without stemming or stopword removal. You cannot specify `language`, `stemming: true`, `remove_stopwords: true`, or `case_sensitive: false` when using this tokenizer.

Other tokenizers can be supported by [contacting us](https://turbopuffer.com/contact).

### [](https://turbopuffer.com/docs/schema#advanced-tuning-for-full-text-search)Advanced tuning for full-text search

The BM25 scoring algorithm involves two parameters that can be tuned for your workload:

*   `k1` controls how quickly the impact of term frequency saturates. When `k1` is close to zero, term frequency is effectively ignored when scoring a document. When `k1` is close to infinity, term frequency contributes nearly linearly to the score.

The default value, `1.2`, means that increasing term frequency in a document boosts heavily to start but quickly results in diminishing returns.

*   `b` controls document length normalization. When `b` is `0.0`, documents are treated equally regardless of length, which allows long articles tend to dominate due to sheer volume of terms. When `b` is `1.0`, documents are boosted or penalized based on the ratio of their length to the average document length in the corpus.

The default value, `0.75`, controls for length bias without eliminating it entirely (long documents are often legitimately more relevant).

The default values are suitable for most applications. Tuning is typically required only if your corpus consists of extremely short texts like tweets (decrease `k1` and `b`) or extremely long texts like legal documents (increase `k1` and `b`).

To tune these parameters, we recommend an empirical approach: build a set of evals, and choose the parameter values that maximize performance on those evals.

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
