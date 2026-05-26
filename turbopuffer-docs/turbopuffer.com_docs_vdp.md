---
url: "https://turbopuffer.com/docs/vdp"
title: "Vulnerability Disclosure"
---

[Pin high-QPS namespaces to cacheNEW: Pin namespaces for predictable cost and latency on high QPS workloads](https://turbopuffer.com/docs/pinning)

# Vulnerability Disclosure

## In Scope

turbopuffer is seeking vulnerability reports for:

- Dashboard: the website hosted at [https://turbopuffer.com/dashboard](https://turbopuffer.com/dashboard), including
the authentication process and the process of managing API keys.
- Database: the turbopuffer database API.
- Client SDKs: the turbopuffer client libraries, which can be found on [our GitHub](https://github.com/orgs/turbopuffer/repositories).

Our focus is on unauthorized access to user data.

## Out of Scope

The following issues are considered out of scope:

- Clickjacking on pages with no sensitive actions.
- CSRF on forms that are available to anonymous users or forms with no sensitive actions.
- Flags on cookies that are not sensitive.
- TLS, DNS, and security header configuration suggestions on the marketing website.
- Any activity that could lead to denial of service (DoS) by sending a flood of requests.

## How to Report

If you believe you have found a vulnerability, please submit your findings to [security@turbopuffer.com](mailto:security@turbopuffer.com).

To expedite triage and resolution, please include:

- A detailed description of the vulnerability.
- How you found the vulnerability, including any relevant software you used.
- Steps to reproduce the vulnerability, or a working proof-of-concept.

If your report is clear and in scope, you can expect a timely
response. We will update you when the vulnerability has been validated, when
more information is needed from you, or when you have qualified for a bounty.
We do not yet have a standardized framework for determining monetary rewards,
and are currently assessing rewards on a case-by-case basis.

## Program Policy

To promote the security of our platform, we ask that you:

- Allow us reasonable time to respond to the report before disclosing any
information about it publicly, and collaborate with us to make reports
public.
- Do not access or modify our data or our users' data, unless you have explicit
permission of the owner. Only interact with your own accounts for security
research purposes.
- If you do inadvertently encounter user data, contact us immediately. Do not
view, alter, save, store, transfer, or otherwise access the data, and
immediately purge the data from your machine.
- Act in good faith to avoid violating privacy, destroying data, or otherwise
disrupting our services.
- Do not attempt any form of social engineering (e.g. phishing, smishing).
- Comply with all applicable laws.

## Safe Harbor

Activities conducted in a manner consistent with this policy will be considered
authorized conduct and we will not initiate legal action against you. If legal
action is initiated by a third party against you in connection with activities
conducted under this policy, we will take steps to make it known that your
actions were conducted in compliance with this policy.

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