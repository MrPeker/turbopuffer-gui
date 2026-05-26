---
url: "https://turbopuffer.com/docs/audit-logs"
title: "Audit Logs"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Audit Logs

turbopuffer provides audit logs for customers on Scale and Enterprise plans.
[Contact us](https://turbopuffer.com/contact) to enable audit logs for your organization.

## Retention

Audit logs have a 30-day retention period by default, which can be extended on request.

## Log Streams

Audit log events can be streamed to an external destination. Supported destinations include SIEM providers (Datadog,
Splunk, Microsoft Sentinel), object storage (AWS S3, Google Cloud Storage), and custom HTTPS endpoints. Log streaming is available on [Scale and Enterprise](https://turbopuffer.com/pricing) plans and can be configured from the
customer settings page.

## Events

| Action | Actor | Target |
| --- | --- | --- |
| `invitation-created` | [User](https://turbopuffer.com/docs/audit-logs#user) | [Invitation](https://turbopuffer.com/docs/audit-logs#invitation) |
| `invitation-accepted` | [User](https://turbopuffer.com/docs/audit-logs#user) | [Invitation](https://turbopuffer.com/docs/audit-logs#invitation) |
| `invitation-revoked` | [User](https://turbopuffer.com/docs/audit-logs#user) | [Invitation](https://turbopuffer.com/docs/audit-logs#invitation) |
| `user-added` | [System](https://turbopuffer.com/docs/audit-logs#system) | [User](https://turbopuffer.com/docs/audit-logs#user) |
| `user-removed` | [User](https://turbopuffer.com/docs/audit-logs#user) | [User](https://turbopuffer.com/docs/audit-logs#user) |
| `api-key-created` | [User](https://turbopuffer.com/docs/audit-logs#user) | [API Key](https://turbopuffer.com/docs/audit-logs#api-key) |
| `api-key-marked-as-expired` | [User](https://turbopuffer.com/docs/audit-logs#user) | [API Key](https://turbopuffer.com/docs/audit-logs#api-key) |
| `session-created` | [User](https://turbopuffer.com/docs/audit-logs#user) | [Session](https://turbopuffer.com/docs/audit-logs#session) |
| `session-revoked` | [User](https://turbopuffer.com/docs/audit-logs#user) | [Session](https://turbopuffer.com/docs/audit-logs#session) |

### Examples

A user creates an API key:

```json
{
  "action": "api-key-created",
  "occurred_at": "2026-04-13T14:22:08Z",
  "actor": {
    "type": "user",
    "id": "V1StGXR8_Z5jdHi6B-myTq",
    "name": "ada@example.com"
  },
  "targets": [\
    {\
      "type": "api-key",\
      "id": "8fW3zNcY6tRo1kGpLvAe2b/production",\
      "name": "production",\
      "metadata": { "suffix": "a1b2" }\
    }\
  ],
  "context": { "location": "203.0.113.42" },
  "metadata": {
    "session_id": "sess_lK9eT0vB3xYq2pNwA4fJ7"
  }
}
```

A user marks an API key as expired:

```json
{
  "action": "api-key-marked-as-expired",
  "occurred_at": "2026-04-13T14:25:11Z",
  "actor": {
    "type": "user",
    "id": "V1StGXR8_Z5jdHi6B-myTq",
    "name": "ada@example.com"
  },
  "targets": [\
    {\
      "type": "api-key",\
      "id": "8fW3zNcY6tRo1kGpLvAe2b/production",\
      "name": "production",\
      "metadata": { "suffix": "a1b2" }\
    }\
  ],
  "context": { "location": "203.0.113.42" },
  "metadata": {
    "session_id": "sess_lK9eT0vB3xYq2pNwA4fJ7"
  }
}
```

## Schemas

Each audit log event includes the `action` that was taken, the time it `occurred_at`, the
`actor` who performed it, the `targets` that were affected, the client IP
in `context.location`, and optional `metadata` about the session.

```typescript
type AuditLogEvent = {
  action: string;
  occurred_at: string;             // ISO 8601 datetime
  actor: Actor;
  targets: Target[];
  context: {
    location: string;              // client IP address
  };
  metadata: {
    session_id?: string;
    impersonator?: string;         // email of turbopuffer admin acting on behalf of
                                   // the customer (requires customer authorization)
    impersonation_reason?: string;
  };
};

type Actor = User | System;

type Target = User | ApiKey | Invitation | Session;
```

### User

```typescript
type User = {
  type: "user";
  id: string;
  name: string;                    // email address
};
```

### API Key

```typescript
type ApiKey = {
  type: "api-key";
  id: string;
  name: string;                    // display name of the key
  metadata: {
    suffix: string;                // last 4 characters of the key
  };
};
```

### Invitation

```typescript
type Invitation = {
  type: "invitation";
  id: string;
  name: string;                    // email address of invited user
  metadata?: {
    invited_user_id: string;
  };
};
```

### Session

```typescript
type Session = {
  type: "session";
  id: string;
  name: string;                    // session ID
  metadata: {
    user_agent: string;
    impersonator?: string;         // email of turbopuffer admin acting on behalf of
                                   // the customer (requires customer authorization)
    impersonation_reason?: string;
  };
};
```

### System

A special actor representing actions performed automatically rather than by a specific user.

```typescript
type System = {
  type: "system";
  id: "system";
  name: "System";
};
```

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