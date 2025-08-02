# API Overview

The API currently doesn't have a public OpenAPI spec, but we maintain a draft spec for internal use. Contact us to request early access.

## Authentication

All API calls require authenticating with your API token. You can create and expire tokens in the dashboard.

The HTTP API expects the API token to be formatted as a standard Bearer token and passed in the Authorization header:

```
Authorization: Bearer <API_TOKEN>
```

## Encoding

The API uses JSON encoding for both request and response payloads.

## Compression

JSON encoded document payloads can be quite large. To save on networking costs, we recommend compressing your requests, and accepting compressed responses. The API supports standard HTTP compression headers.

Compress your request payload and include Content-Encoding: gzip to enable compressed requests.

Include Accept-Encoding: gzip to enable compressed responses.

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

You may encounter an HTTP 429 if you query or write too quickly. See limits for more information.