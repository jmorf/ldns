# Changelog

## [2.0.0] - 2026-04-28

Major rewrite: real `/api/*` proxy endpoints, full Server + Security tab functionality, factory.ai-inspired editorial redesign, and `@ldns/core` workspace extraction.

### Added: API endpoints (SvelteKit `/api/*`)
- `GET /api/server`: full HEAD/GET + redirect trace + tech stack + security-headers audit + Alt-Svc detection
- `GET /api/headers`: raw response headers
- `GET /api/tls`: certificate via crt.sh CT logs (free, unlimited)
- `GET /api/asn`: origin AS via Team Cymru DoH
- `GET /api/geo`, IP geolocation via ipwho.is
- `GET /api/security/headers`: HSTS / CSP / X-Frame-Options / Referrer-Policy / Permissions-Policy audit
- `GET /api/security/hsts-preload`: HSTS preload list status
- `GET /api/security/probes`: well-known files (security.txt / robots.txt / ads.txt / humans.txt / sitemap.xml)
- `GET /api/subdomains`: edge-cached crt.sh wrapper with retry
- `GET /api/dkim`: 22-selector DKIM probe
- All endpoints share a `createHandler` wrapper enforcing origin allow-list, per-IP-per-endpoint rate limit, post-resolution SSRF guard (rejects RFC 1918 / loopback / link-local / CGNAT / `.local` / `.internal` / `.test` / `.example`)

### Added: 13 new tool routes
- `/[domain]/aaaa`, `/cname`, `/caa`, `/soa`, record-type SEO pages built on a shared [`RecordTypePage`](src/lib/components/RecordTypePage.svelte) shell
- `/[domain]/dkim`, DKIM selector probe results
- `/[domain]/headers`, filterable raw response-header viewer
- `/[domain]/security-headers`, dedicated security-headers audit page
- `/[domain]/tls`, certificate hero block + SAN list
- `/[domain]/asn`, per-IP AS info table
- `/[domain]/geo`, per-IP geolocation with OpenStreetMap link
- `/[domain]/server` and `/[domain]/security`, full rebuilds (were broken / placeholder)

### Changed, Server / Security pages
- **Server** tab now actually works for arbitrary domains (was "CORS Protected" for ~90% of sites). Hero stat block, tech badges, security-headers row, IP block with inline ASN, redirect chain, cache info, full-headers detail.
- **Security** tab now driven by real signals: TLS cert, headers audit, HSTS preload, well-known probes, email summary. Removed the fake "reputation via Phishtank/Safe Browsing" placeholder.
- **Subdomains** tab uses the proxy with retry; added live filter input + CSV export.
- **Reverse-DNS** tab uses the shared `lookupPtrBatch` (IPv6 supported, parallel) plus inline ASN.
- **IP** page shows inline ASN for each address.

### Changed: Design system
- **CSS variables** now drive every surface: `--surface`, `--surface-2`, `--surface-3`, `--line`, `--fg`, `--fg-muted`, `--fg-subtle`, plus an emerald/amber/rose ok/warn/bad triad. Mirrors the v1.7 extension's tokens.
- **Theme switch** with system / light / dark, persisted to localStorage, live `prefers-color-scheme` listening, flash-of-wrong-theme prevention via inline early-paint script in [`app.html`](src/app.html).
- **Editorial chrome**: numbered `01: Section name` headers, mono `// eyebrow` labels, tabular numerals on all numeric data.
- **Homepage** rewritten, asymmetric hero (left text + right [`TerminalDemo`](src/lib/components/TerminalDemo.svelte) cycling through real-looking lookups), 5 alternating numbered feature blocks, API strip, extension strip, trust strip.
- **Sidebar** rebuilt with grouped "More tools" (records / ip / email / server / other) and integrated theme toggle.
- **Footer** rebuilt as 4-column structure with mono eyebrows.
- **Empty / loading states**: skeleton-shimmer loaders, composed empty states with stylized DNS glyph.
- **OG image generator** at `/og/[...path]` returning a 1200×630 SVG. The [`SEO`](src/lib/components/SEO.svelte) component auto-derives a per-page OG URL.

### Changed, Architecture
- **`@ldns/core` workspace package** extracted at [`packages/core/`](../packages/core/). Pure-TypeScript runtime-agnostic modules (DNS, RDAP, email, server, security, TLS, ASN, PTR, subdomain, DKIM, parsers). Both `ldns2` and `ldns-ext` now depend on `@ldns/core` instead of maintaining duplicate copies.
- **Imports** moved from `$lib/shared/*` to `@ldns/core/*` everywhere.
- **`/api/whois` and `/api/forsale`** rewritten on the shared `createHandler` (KV-ready rate limit, cleaner CORS).
- **Sitemap** updated to include all 13 new routes plus the previously-omitted `/extension` and `/extension/privacy` static pages.

### Removed
- Dead `src/lib/components/ui/data-table` (used the old `@tanstack/svelte-table` API; never referenced)
- Dummy reputation panel (Phishtank + Safe Browsing, required an API key we don't have)
- Browser-side `cloudflare-dns.com` PTR fetch loop in `/reverse-dns` (now uses the shared `lookupPtrBatch`)
- Duplicate `src/lib/shared/` folder

### Fixed
- 26 pre-existing TypeScript errors across `Footer`, `ContentNav`, `RecordSummary`, `ForSaleBadge`, `ui/table`, `extension/+page.svelte`, `reverse-dns/+page.svelte`. All `@icons-pack/svelte-simple-icons` props converted from `class="…"` to `size={n}` (the actual prop type).
- Pre-existing forsale null-narrowing.
- The shadcn `Badge` color palette extended to include `lime / amber / emerald / teal / violet / rose / fuchsia` so `RecordSummary` no longer fails type-check.

### Tests
- 502 tests passing across the workspace (137 in `@ldns/core`, 365 in `ldns2`).
- New: `ssrf.test.ts`, `cors.test.ts`, `ratelimit.test.ts`, `tls-query.test.ts`, integration tests for `/api/server`, `/api/security/*`, `/api/asn`, `/api/geo`, `/api/tls`, `/api/headers`.

## [0.1.0] - 2026-02-08

### Added
- **DNS Propagation Check**: New `/propagation` tool page: compare DNS records across Cloudflare, Google, and DNS.SB with mismatch detection
- **Reverse DNS Lookup**: New `/reverse-dns` tool page: PTR record lookup for domain A record IPs
- **Subdomain Discovery**: New `/subdomains` tool page: discover subdomains via Certificate Transparency logs (crt.sh)
- Added `propagation`, `reverse-dns`, `subdomains` to sidebar "More Tools" section
- Added SEO content configs for all 3 new tool pages
- Added `lookupPropagation()`, `lookupReverseDns()`, `lookupSubdomains()` methods to DomainName state
- Added `PropagationResult` and `SubdomainToolResult` types

### Fixed
- Fixed pre-existing test failures (quad9 endpoint references removed, AAAA mock pattern matching)

### Tests
- Updated seoContent tests to cover new page configs
- Fixed queryConfig endpoint tests to match current providers
- Fixed DNS multi-type query mock to properly separate A/AAAA responses
- Total: 172 tests passing

## [0.0.1] - Previous release

### Features
- DNS lookups (A, AAAA, MX, NS, TXT, SOA, CAA, DNSKEY, HTTPS)
- RDAP/WHOIS registration data
- Email security analysis with SPF/DMARC parsing
- Server info with CORS-aware fallback
- Security analysis (SSL from CAA, email security, reputation)
- Subdomain discovery from CT logs (security page)
- For-sale domain detection
- SEO-optimized tool pages with programmatic content
