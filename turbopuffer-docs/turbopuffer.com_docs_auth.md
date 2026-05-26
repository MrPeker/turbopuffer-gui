---
url: "https://turbopuffer.com/docs/auth"
title: "API Overview"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# API Overview

## Authentication

All API calls require authenticating with your API key. You can create and expire tokens in the [dashboard](https://turbopuffer.com/dashboard).

The HTTP API expects the API key to be formatted as a standard Bearer token and passed in the Authorization header:

```http
Authorization: Bearer <API_KEY>
```

## Encoding

The API uses JSON encoding for both request and response payloads.

## Compression

The API supports standard HTTP compression headers.

However, for most workloads, disabling compression offers the best performance.
turbopuffer clients are typically CPU constrained, not network bandwidth
constrained.

The official client libraries disable request and response compression by default.

## Error responses

If an error occurs for your request, all endpoints will return a JSON payload in the format:

Response

```json
{
  "status": "error",
  "error": "an error message"
}
```

You may encounter an `HTTP 429` if you query or write too quickly. See [limits](https://turbopuffer.com/docs/limits) for more information.

## Specification

The API has a public OpenAPI specification available at:

[https://github.com/turbopuffer/turbopuffer-openapi](https://github.com/turbopuffer/turbopuffer-openapi)

copy page

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Pricing](https://turbopuffer.com/pricing) [Store](https://turbopuffer.supply/) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-3v27t102a-3RynqZ5A9vuOuAo68X_wFQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml) [Events](https://turbopuffer.com/events)

[turbopuffer on Twitter](https://x.com/turbopuffer)[turbopuffer on LinkedIn](https://www.linkedin.com/company/turbopuffer/)[turbopuffer on BlueSky](https://bsky.app/profile/turbopuffer.bsky.social)[turbopuffer on YouTube](https://www.youtube.com/@turbopufferdb)

© 2026 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa.pdf) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)

Docs search

esc

## Guides

[Quickstart\\
\\
Get started with turbopuffer in minutes](https://turbopuffer.com/docs/quickstart)

[Vector Search\\
\\
Perform approximate nearest neighbor searches](https://turbopuffer.com/docs/vector)

[Full-Text Search\\
\\
Learn how to use BM25 full-text search](https://turbopuffer.com/docs/fts)

[Hybrid Search\\
\\
Combine vector and full-text search strategies](https://turbopuffer.com/docs/hybrid)

## API Docs

[Write\\
\\
Create, update, or delete documents](https://turbopuffer.com/docs/write)

[Query\\
\\
Query documents with filters and ranking](https://turbopuffer.com/docs/query)

[Auth & Encoding\\
\\
Authentication, headers, and request encoding](https://turbopuffer.com/docs/auth)

[Namespace metadata\\
\\
Get metadata about a namespace](https://turbopuffer.com/docs/metadata)