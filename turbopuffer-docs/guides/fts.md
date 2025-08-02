# Full-Text Search Guide

turbopuffer supports BM25 full-text search for string and []string types. This guide shows how to configure and use full-text search with different options.

turbopuffer's full-text search engine has been written from the ground up for the turbopuffer storage engine for low latency searches directly on object storage.

For hybrid search combining both vector and BM25 results, see Hybrid Search.

For all available full-text search options, see the Schema documentation.

### Basic example

The simplest form of full-text search is on a single field of type string.

### Advanced example

You can use full-text search operators like Sum and Product to perform a full-text search across multiple attributes simultaneously.

### Custom tokenization

When turbopuffer's built-in tokenizers aren't sufficient, use the pre\_tokenized\_array tokenizer to perform client side tokenization using arbitrary logic.