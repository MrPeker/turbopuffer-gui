---
url: "https://turbopuffer.com/docs/vdp"
title: "Vulnerability Disclosure"
---

[100B vectors @ 200ms p99NEW: 100B vectors @ 200ms p99 latency (opt-in beta)](https://turbopuffer.com/docs/roadmap)

## Navigation

[![Logo](https://turbopuffer.com/_next/static/media/logo_header_darkbg.435dd040.svg)turbopuffer](https://turbopuffer.com/)

[Customers](https://turbopuffer.com/customers) [Pricing](https://turbopuffer.com/pricing) [Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Blog](https://turbopuffer.com/blog) [Docs](https://turbopuffer.com/docs) [Contact](https://turbopuffer.com/contact) [Dashboard](https://turbopuffer.com/dashboard) [Sign up](https://turbopuffer.com/join)

[Introduction](https://turbopuffer.com/docs)

[Architecture](https://turbopuffer.com/docs/architecture)

[Guarantees](https://turbopuffer.com/docs/guarantees)

[Tradeoffs](https://turbopuffer.com/docs/tradeoffs)

[Limits](https://turbopuffer.com/docs/limits)

[Regions](https://turbopuffer.com/docs/regions)

[Roadmap & Changelog](https://turbopuffer.com/docs/roadmap)

[Security](https://turbopuffer.com/docs/security)

[Encryption](https://turbopuffer.com/docs/cmek)

[Private Networking](https://turbopuffer.com/docs/private-networking)

[Performance](https://turbopuffer.com/docs/performance)

Guides

[Quickstart](https://turbopuffer.com/docs/quickstart)

[Vector Search](https://turbopuffer.com/docs/vector)

[Full-Text Search](https://turbopuffer.com/docs/fts)

[Hybrid Search](https://turbopuffer.com/docs/hybrid)

[Testing](https://turbopuffer.com/docs/testing)

API

[Auth & Encoding](https://turbopuffer.com/docs/auth)

[Write](https://turbopuffer.com/docs/write)

[Query](https://turbopuffer.com/docs/query)

[Namespace metadata](https://turbopuffer.com/docs/metadata)

[Export](https://turbopuffer.com/docs/export)

[Warm cache](https://turbopuffer.com/docs/warm-cache)

[List namespaces](https://turbopuffer.com/docs/namespaces)

[Delete namespace](https://turbopuffer.com/docs/delete-namespace)

[Recall](https://turbopuffer.com/docs/recall)

# Vulnerability Disclosure

### In Scope

turbopuffer is seeking vulnerability reports for:

- Dashboard: the website hosted at [https://turbopuffer.com/dashboard](https://turbopuffer.com/dashboard), including
the authentication process and the process of managing API keys.
- Database: the turbopuffer database API.
- Client SDKs: the turbopuffer client libraries, which can be found on [our GitHub](https://github.com/orgs/turbopuffer/repositories).

Our focus is on unauthorized access to user data.

### Out of Scope

The following issues are considered out of scope:

- Clickjacking on pages with no sensitive actions.
- CSRF on forms that are available to anonymous users or forms with no sensitive actions.
- Flags on cookies that are not sensitive.
- TLS, DNS, and security header configuration suggestions on the marketing website.
- Any activity that could lead to denial of service (DoS) by sending a flood of requests.

### How to Report

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

### Program Policy

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

### Safe Harbor

Activities conducted in a manner consistent with this policy will be considered
authorized conduct and we will not initiate legal action against you. If legal
action is initiated by a third party against you in connection with activities
conducted under this policy, we will take steps to make it known that your
actions were conducted in compliance with this policy.

On this page

- [In Scope](https://turbopuffer.com/docs/vdp#in-scope)
- [Out of Scope](https://turbopuffer.com/docs/vdp#out-of-scope)
- [How to Report](https://turbopuffer.com/docs/vdp#how-to-report)
- [Program Policy](https://turbopuffer.com/docs/vdp#program-policy)
- [Safe Harbor](https://turbopuffer.com/docs/vdp#safe-harbor)

![turbopuffer logo](https://turbopuffer.com/_next/static/media/lockup_transparent.6092c7ef.svg)

[Company](https://turbopuffer.com/about) [Jobs](https://turbopuffer.com/jobs) [Pricing](https://turbopuffer.com/pricing) [Press & media](https://turbopuffer.com/press) [System status](https://status.turbopuffer.com/)

Support

[Slack](https://join.slack.com/t/turbopuffer-community/shared_invite/zt-24vaw9611-7E4RLNVeLXjcVatYpEJTXQ) [Docs](https://turbopuffer.com/docs) [Email](https://turbopuffer.com/contact/support) [Sales](https://turbopuffer.com/contact/sales)

Follow

[Blog](https://turbopuffer.com/blog)

© 2025 turbopuffer Inc.

[Terms of service](https://turbopuffer.com/terms-of-service) [Data Processing Agreement](https://turbopuffer.com/dpa) [Privacy Policy](https://turbopuffer.com/privacy-policy) [Security & Compliance](https://turbopuffer.com/docs/security)

[- SOC2 Type 2 certified\\
- HIPAA compliant](https://turbopuffer.com/docs/security "Learn more about our security practices")