# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Report privately via [GitHub Security Advisories](https://github.com/jmorf/ldns/security/advisories/new), or contact [@jmorf on X](https://x.com/jmorf). We aim to acknowledge within 72 hours.

Please include: what the issue is, how to reproduce it, and what an attacker could achieve. If you have a suggested fix, even better.

## Scope

In scope: the browser extension (`ldns-ext/`), the shared core (`packages/core/`), the website (`ldns2/`), and the live ldns.com API endpoints.

Out of scope: vulnerabilities in the upstream services we query (Cloudflare DoH, Google DNS, DNS.SB, rdap.org, crt.sh, hstspreload.org, Team Cymru), and findings that require a compromised local machine or browser.

## Threat model notes for self-hosters

Two design decisions are worth understanding before you deploy this yourself.

### 1. The SSRF guards assume Cloudflare's egress restriction

Several `/api/*` endpoints (`server`, `headers`, `security/headers`, `security/probes`, `forsale`) fetch a **user-supplied host** server-side. That is the product working as intended — it's how you inspect a domain's headers — but it means the server makes requests to arbitrary addresses on request.

`ldns2/src/lib/server/ssrf.ts` defends this by resolving the domain over DoH and rejecting private/loopback/link-local/CGNAT answers, and by re-validating **every redirect hop** against the same rules before the socket is opened.

What it does **not** do is re-resolve hostnames on each redirect hop, so a hostname whose DNS answer changes between the check and the connection (DNS rebinding), or a redirect to a hostname that resolves to a private address, is a residual risk. **On Cloudflare Workers this is contained** because the runtime itself refuses to route to RFC1918 / loopback addresses.

**If you deploy this on a runtime without that restriction — the SvelteKit Node adapter, a VPS, a container — that containment is gone and these endpoints become a working SSRF vector into your internal network and cloud metadata service (`169.254.169.254`).** If you self-host off Cloudflare, you must add your own egress controls: resolve-and-pin to the verified IP, an egress firewall/proxy that blocks internal ranges, or a network-isolated worker.

### 2. The origin allow-list is not a rate limit

`ldns2/src/lib/server/cors.ts` treats a missing `Origin` header as same-origin and allows it — necessary for same-origin browser fetches, but it means non-browser clients (`curl`, scripts) are not gated by it. It is CSRF/embedding protection, not abuse protection.

Abuse control is the per-IP rate limit in `ldns2/src/lib/server/handler.ts` plus edge caching. Note the limiter is **in-memory per isolate**, so on Cloudflare the effective ceiling is a multiple of the configured value. If you run this at any scale, put a durable counter (KV / Durable Object) or a platform rate-limiting rule in front of it — particularly for any endpoint that spends money or hits a keyed upstream.

## Supported versions

Fixes land on the latest release. The extension auto-updates through the Chrome Web Store and addons.mozilla.org; older versions are not patched.
