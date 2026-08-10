# LDNS

DNS lookup and domain analysis tool at **[ldns.com](https://ldns.com)** — SvelteKit 5 on Cloudflare Workers, sharing its lookup logic with the [LDNS browser extension](../ldns-ext) via the `@ldns/core` workspace package.

## Features

### DNS Lookups
- Query A, AAAA, MX, TXT, NS, SOA, CAA, DNSKEY, HTTPS records
- DNS-over-HTTPS via Cloudflare, Google, and DNS.SB
- **DNS Propagation Comparison** — Compare results across all 3 providers with mismatch detection
- **Reverse DNS (PTR)** — Lookup PTR records for domain A record IPs
- **IP-to-ASN** — Origin AS number, name, and country via Team Cymru

### RDAP/WHOIS
- Domain registration details via RDAP protocol
- Registrar, nameservers, DNSSEC status
- Creation, update, and expiration dates

### Email Security
- MX record analysis with provider detection
- SPF record parsing and validation
- DMARC policy analysis
- DKIM selector probing
- BIMI and MTA-STS detection

### Server Info
- HTTP response headers analysis
- Server software and technology-stack detection
- Redirect chain tracing
- Cache and IP information

### Security Analysis
- Security-headers audit (HSTS, CSP, X-Frame-Options, …)
- HSTS preload status, security.txt and robots.txt probes
- TLS certificate details from Certificate Transparency logs

### Subdomain Discovery
- Scan Certificate Transparency logs via crt.sh
- Deduplicated, sorted results with certificate details

## Architecture

Most lookups run **client-side** (DoH and RDAP are called straight from the browser). A set of server-side `/api/*` endpoints handles the cases the browser can't do itself — CORS-blocked upstreams and raw TCP WHOIS:

| Endpoint | Purpose |
|---|---|
| `/api/server`, `/api/headers`, `/api/security/headers` | Fetch a domain's HTTP headers and redirect chain |
| `/api/security/probes`, `/api/security/hsts-preload` | security.txt / robots.txt existence, HSTS preload status |
| `/api/whois` | Port-43 WHOIS (browsers can't open raw TCP) |
| `/api/subdomains`, `/api/tls` | Certificate Transparency queries (crt.sh) |
| `/api/dkim`, `/api/asn`, `/api/geo` | DKIM selector probing, ASN lookup, IP geolocation |

Every `/api/*` route goes through `src/lib/server/handler.ts`, which applies an origin allow-list, a per-IP rate limit, edge caching, and a standard JSON envelope. Endpoints that fetch a user-supplied host run the SSRF guard in `src/lib/server/ssrf.ts` first — **see [SECURITY.md](../SECURITY.md) before self-hosting on a non-Cloudflare runtime.**

## Quick Start

```bash
# Install from the REPOSITORY ROOT — this is an npm workspace and the site
# depends on the local @ldns/core package.
npm install

# Then, in ldns2/:
npm run dev          # dev server
npm run build        # production build
npm run check        # svelte-check + tsc
npm run test         # vitest (391 tests)
npm run deploy       # build + wrangler deploy → ldns.com
```

## Tech Stack

- **Framework**: [SvelteKit 5](https://kit.svelte.dev/) with TypeScript (strict mode)
- **Reactivity**: Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- **UI**: shadcn-style components in `src/lib/components/ui/` + custom components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with surface-token CSS variables
- **Shared logic**: `@ldns/core` workspace package (DNS, RDAP, email, server, security, TLS, ASN, PTR, subdomains, DKIM)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) via `adapter-cloudflare`

## Privacy

No analytics, no telemetry, no accounts, no tracking scripts. Lookups go directly to public DNS, registry, and Certificate Transparency services; the `/api/*` endpoints exist only where the browser cannot make the request itself.

## Project Structure

```
src/
├── routes/
│   ├── (content)/           # Static pages (/, /about, /tools, /extension)
│   ├── (tools)/[domain]/    # Domain analysis tool pages (~25 routes)
│   └── api/                 # Server-side endpoints (see Architecture)
├── lib/
│   ├── components/          # Reusable UI components
│   ├── server/              # handler, ssrf, cors, ratelimit (server-only)
│   ├── utils/               # Helpers (seoContent, navigation, useToolPage)
│   └── state.svelte.ts      # Centralized state management
└── styles/                  # Tailwind entry + design tokens
```

## Contributing

See [AGENTS.md](./AGENTS.md) for development guidelines and architecture notes, and [CONTRIBUTING.md](../CONTRIBUTING.md) for the PR process.

## License

[MIT](./LICENSE) — with a brand exception: the LDNS name, wordmark, and logo are not covered. See [LICENSE-BRAND](../LICENSE-BRAND).
