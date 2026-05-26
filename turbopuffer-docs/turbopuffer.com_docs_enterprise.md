---
url: "https://turbopuffer.com/docs/enterprise"
title: "Enterprise"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Enterprise

```
           ╔═══(0): Multitenancy (default)═════════════════╗
           ║┏━tpuf's cloud━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║░
           ║┃ ┌──────────────┐           ┌──────────────┐┃ ║░
           ║┃ │    shared    │           │    shared    │┃ ║░
 ─nw fees──╬╋▶│   compute    │──────────▶│    bucket    │┃ ║░
           ║┃ └──────────────┘           └──────────────┘┃ ║░
           ║┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
           ╚═══════════════════════════════════════════════╝░
            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
╔═(0): Multitenancy (default)══╗
║┏━tpuf's cloud━━━━━━━━━━━━━━┓ ║
║┃ ┌──────────┐ ┌──────────┐ ┃ ║
║┃ │  shared  │ │  shared  │ ┃ ║
║┃ │ compute  │▶│  bucket  │ ┃ ║
║┃ └──────────┘ └──────────┘ ┃ ║
║┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
╚══════════════════════════════╝
```

```
           ╔═══(1): Bring Your Own Bucket (BYOB)═══════════╗
           ║┏━tpuf's cloud━━━━┓        ┏━your cloud━━━━━┓ ║░
           ║┃ ┌──────────────┐ ┃        ┃                ┃ ║░
           ║┃ │    shared    │ ┃        ┃┌──────────────┐┃ ║░
──nw fees──╬╋▶│   compute    │◀╋────────▶│    bucket    │┃ ║░
           ║┃ └──────────────┘ ┃        ┃└──────────────┘┃ ║░
           ║┗━━━━━━━━━━━━━━━━━━┛        ┗━━━━━━━━━━━━━━━━┛ ║░
           ╚═══════════════════════════════════════════════╝░
            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
╔═(1): BYOB════════════════════╗
║┏━tpuf━━┓     ┏━your cloud━━┓ ║
║┃       ┃     ┃             ┃ ║
║┃shared ┃     ┃   bucket    ┃ ║
║┃compute◀─────▶             ┃ ║
║┃       ┃     ┃             ┃ ║
║┗━━━━━━━┛     ┗━━━━━━━━━━━━━┛ ║
╚══════════════════════════════╝
```

```
           ╔═══(2): Single-Tenancy Hosted══════════════════╗
           ║┏━tpuf's cloud━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ║░
           ║┃ ┌──────────────┐           ┌──────────────┐┃ ║░
           ║┃ │   isolated   │           │   isolated   │┃ ║░
───nw fees─╬╋─▶   compute    │──────────▶│    bucket    │┃ ║░
           ║┃ └──────────────┘           └──────────────┘┃ ║░
           ║┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║░
           ╚═══════════════════════════════════════════════╝░
            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
╔═(2): Single-Tenancy Hosted═══╗
║┏━tpuf's cloud━━━━━━━━━━━━━━┓ ║
║┃ ┌──────────┐ ┌──────────┐ ┃ ║
║┃ │ isolated │ │ isolated │ ┃ ║
║┃ │ compute  │▶│  bucket  │ ┃ ║
║┃ └──────────┘ └──────────┘ ┃ ║
║┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ║
╚══════════════════════════════╝
```

```
           ╔═══(3): Bring Your Own Cloud (BYOC)══════════════════════╗
           ║┏━tpuf's cloud━┓  ┏━your cloud (we are oncall)━━━━━━━━━━┓║░
           ║┃              ┃  ┃                                     ┃║░
           ║┃┌────────────┐┃  ┃ ┌──────────────┐    ┌──────────────┐┃║░
           ║┃│ telemetry  │◀──╋─│   compute    │───▶│    bucket    │┃║░
           ║┃└────────────┘┃  ┃ └──────────────┘    └──────────────┘┃║░
           ║┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛║░
           ╚═════════════════════════════════════════════════════════╝░
            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

```
╔═(3): BYOC════════════════════╗
║┏━tpuf━━┓ ┏━your cloud━━━━━━┓ ║
║┃       ┃ ┃                 ┃ ║
║┃ tele- ◀─┼─compute─▶bucket ┃ ║
║┃ metry ┃ ┃                 ┃ ║
║┗━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━┛ ║
╚══════════════════════════════╝
```

## PoC Process

01. **Suitability.** You will meet with the team to discuss your use case and
    determine if it is a good fit for the PoC. We will review the [Limits\\
    together.](https://turbopuffer.com/docs/limits) If there's a good fit, we will
    do a follow-up kick-off meeting.
02. **Pricing.** If it is a good match and you want to move forward with a PoC,
    we will send you a ballpark quote estimate that we will update further as we
    have data from the PoC.
03. **PoC Kick-off.** We will meet with you to discuss the details of the PoC,
    including the following:
04. What is the scope of the PoC?
05. What metrics are required to hit?
06. Timeline for the PoC
07. Can we do the PoC without extensive security review, e.g. with scrubbed data?
    Otherwise, we will need to do a security review and legal review.
08. **Weekly PoC Meetings.** We will meet with you weekly to discuss progress of
    the PoC.
09. **Procurement.** We send you an MSA, DPA, and final order form to sign.
10. **Launch.** We're in production!

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