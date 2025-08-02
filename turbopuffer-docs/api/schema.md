# Schema

## {GET, POST} /v1/namespaces/:namespace/schema

Reads or updates the namespace schema.

turbopuffer maintains a schema for each namespace with type and indexing behaviour for each attribute.

The schema can be modified as you write documents.

A basic schema will be automatically inferred from the upserted data. You can explicitly configure a schema to specify types that can't be inferred (e.g. UUIDs) or to control indexing behaviour (e.g. enabling full-text search for an attribute).

### Parameters

Every attribute can have the following fields in its schema specified at write time:

**type** string (required)

The data type of the attribute. Supported types:

* `string`: String
* `int`: Signed integer (i64)
* `uint`: Unsigned integer (u64)
* `float`: Floating-point number (f64)
* `uuid`: 128-bit UUID
* `datetime`: Date and time
* `bool`: Boolean
* `[]string`: Array of strings
* `[]int`: Array of signed integers
* `[]uint`: Array of unsigned integers
* `[]float`: Array of floating-point numbers
* `[]uuid`: Array of UUIDs
* `[]datetime`: Array of dates and times

All attribute types are nullable by default, except id and vector which are required.

**vector** object (default: {'type': [dims]f32, 'ann': true})

Whether the upserted vectors are of type f16 or f32.

To use f16 vectors, this field needs to be explicitly specified in the schema when first creating the namespace.

Example: `"vector": {"type": "[512]f16", "ann": true}`

**filterable** boolean (default: true)

Whether or not the attribute can be used in filters/WHERE clauses. Filtered attributes are indexed into an inverted index.

Unfiltered attributes don't have an index built for them, and are thus billed at a 50% discount.

**regex** boolean (default: false)

Whether to enable Regex filters on this attribute. If set, filterable defaults to false.

**full_text_search** boolean | object (default: false)

Whether this attribute can be used as part of a BM25 full-text search. Requires the string or []string type.

Can either be a boolean for default settings, or an object with the following optional fields:

* `language` (string): The language of the text. Defaults to english.
* `stemming` (boolean): Language-specific stemming for the text. Defaults to false.
* `remove_stopwords` (boolean): Removes common words from the text based on language. Defaults to true.
* `case_sensitive` (boolean): Whether searching is case-sensitive. Defaults to false.
* `tokenizer` (string): How to convert the text to a list of tokens. Defaults to word_v1.
* `k1` (float): Term frequency saturation parameter for BM25 scoring. Defaults to 1.2.
* `b` (float): Document length normalization parameter for BM25 scoring. Defaults to 0.75.
* `max_token_length` (integer): Maximum length of a token in bytes. Defaults to 39.

### Adding new attributes

New attributes can be added with a write or an explicit schema update. All documents prior to the schema update will have the attribute set to null.

### Changing existing attributes

We support online, in-place changes of the filterable and full_text_search settings, by setting the schema in a write or by sending an explicit schema update.

Other index settings changes, attribute type changes, and attribute deletions currently cannot be done in-place.

### Languages for full-text search

turbopuffer currently supports language-aware stemming and stopword removal for full-text search. The following languages are supported:

* arabic, danish, dutch, english (default), finnish, french, german, greek, hungarian, italian, norwegian, portuguese, romanian, russian, spanish, swedish, tamil, turkish

### Tokenizers for full-text search

* `word_v2`: Forms tokens from ideographic codepoints, contiguous sequences of alphanumeric codepoints, and sequences of emoji codepoints
* `word_v1` (default): Like word_v2, except ideographic codepoints are treated as alphanumeric
* `word_v0`: Like word_v1, except emoji codepoints are discarded
* `pre_tokenized_array`: Special tokenizer for custom tokenization using []string arrays

### Advanced tuning for full-text search

The BM25 scoring algorithm involves two parameters:

* `k1`: Controls how quickly the impact of term frequency saturates (default: 1.2)
* `b`: Controls document length normalization (default: 0.75)

The default values are suitable for most applications.