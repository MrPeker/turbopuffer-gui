# Turbopuffer Documentation

This folder contains the complete documentation for Turbopuffer, a fast search engine that combines vector and full-text search using object storage.

## Documentation Structure

### Core Concepts
- [Introduction](./introduction.md) - Overview of Turbopuffer
- [Architecture](./architecture.md) - System architecture and design
- [Guarantees](./guarantees.md) - Consistency, durability, and reliability guarantees
- [Tradeoffs](./tradeoffs.md) - Design decisions and when to use Turbopuffer
- [Limits](./limits.md) - Current system limits and quotas
- [Regions](./regions.md) - Available regions and deployment options
- [Security](./security.md) - Security features and compliance
- [Performance](./performance.md) - Performance optimization guide
- [Roadmap](./roadmap.md) - Development roadmap and changelog

### Guides
- [Quickstart](./guides/quickstart.md) - Get started with Turbopuffer
- [Vector Search](./guides/vector.md) - Vector search capabilities
- [Full-Text Search](./guides/fts.md) - BM25 full-text search guide
- [Hybrid Search](./guides/hybrid.md) - Combining vector and text search
- [Testing](./guides/testing.md) - Testing strategies
- [CMEK Encryption](./guides/cmek.md) - Customer-managed encryption keys

### API Reference
- [Authentication & Encoding](./api/auth.md) - API authentication and data encoding
- [Write Documents](./api/write.md) - Document creation, updates, and deletes
- [Query Documents](./api/query.md) - Search, filter, and retrieve documents
- [Schema Management](./api/schema.md) - Namespace schema configuration
- [Export Documents](./api/export.md) - Data export functionality
- [Warm Cache](./api/warm-cache.md) - Cache warming hints
- [List Namespaces](./api/namespaces.md) - Namespace management
- [Delete Namespace](./api/delete-namespace.md) - Namespace deletion
- [Evaluate Recall](./api/recall.md) - Vector search recall evaluation

## Getting Started

1. Start with the [Introduction](./introduction.md) to understand what Turbopuffer is
2. Review the [Architecture](./architecture.md) to understand how it works
3. Follow the [Quickstart Guide](./guides/quickstart.md) to begin using the API
4. Explore the [API Reference](./api/) for detailed endpoint documentation

## Key Features

- **Vector Search**: Approximate nearest neighbor search with SPFresh indexing
- **Full-Text Search**: BM25 text search with custom tokenization
- **Hybrid Search**: Combine vector and text search results
- **Scalability**: Handle billions of documents across millions of namespaces
- **Cost-Effective**: Object storage architecture with smart caching
- **High Performance**: p50=16ms queries for cached data
- **Security**: SOC2 Type 2, HIPAA compliance, optional CMEK encryption