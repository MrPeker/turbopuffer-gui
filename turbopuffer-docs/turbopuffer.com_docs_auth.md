---
url: "https://turbopuffer.com/docs/auth"
title: "API Overview"
---

[We've doubled down with Lachy Groom, added ThriveWe've doubled down with Lachy Groom and added Thrive to the team](https://tpuf.link/comms)

# API Overview

The API currently doesn't have a public OpenAPI spec, but we maintain a draft
spec for internal use. [Contact us](https://turbopuffer.com/contact) to request early access.

## Authentication

All API calls require authenticating with your API key. You can create and expire tokens in the [dashboard](https://turbopuffer.com/dashboard).

The HTTP API expects the API key to be formatted as a standard Bearer token and passed in the Authorization header:

```http
Authorization: Bearer <API_KEY>
```

## Encoding

The API uses JSON encoding for both request and response payloads.

## Compression

JSON encoded document payloads can be quite large. To save on networking costs,
we recommend compressing your requests, and accepting compressed responses.
The API supports standard HTTP compression headers.

Compress your request payload and include `Content-Encoding: gzip` to enable compressed requests.

Include `Accept-Encoding: gzip` to enable compressed responses.

The official client libraries will use compression by default.

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

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog) [RSS](https://turbopuffer.com/blog/rss.xml)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)