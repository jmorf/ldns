# LDNS - DNS & Domain Tools

A fast, privacy-focused Chrome & Firefox extension for DNS records, WHOIS/RDAP data, email security analysis, server information, and subdomain discovery.

## Core Features

| Feature | Description |
|---------|-------------|
| **DNS Records** | A, AAAA, MX, TXT, NS, SOA, CAA, CNAME via encrypted DoH |
| **DNS Propagation** | Compare records across Cloudflare, Google, and DNS.SB |
| **Reverse DNS** | Auto PTR lookups for A and AAAA records (IPv4 + IPv6) |
| **ASN / Origin** | IP-to-ASN lookup via Team Cymru DNS service |
| **WHOIS/RDAP** | Registration, expiry, DNSSEC, domain age countdown |
| **Email Security** | SPF, DMARC, BIMI, MTA-STS, **DKIM** with provider detection |
| **Server Info** | Headers, redirects, response time, tech detection, **security headers**, **HTTP/3** |
| **Subdomains** | Scan Certificate Transparency logs for subdomains |
| **Privacy First** | No accounts, no tracking, all queries direct to public services |

## Features

### DNS Records
- Query A, AAAA, MX, TXT, NS, SOA, CAA records
- Multiple DNS-over-HTTPS providers (Cloudflare, Google, DNS.SB)
- Filter by record type with one-click copy
- **DNS Propagation Comparison** — Toggle to compare results across all 3 providers with mismatch highlighting and per-provider latency
- **Reverse DNS (PTR)** — Auto-lookup PTR records (IPv4 + IPv6) shown inline below A/AAAA records
- **IP-to-ASN** — Origin AS number, name and country shown inline (Team Cymru, no API key)

### WHOIS/RDAP
- Domain registration details, registrar, nameservers
- Creation, update, and expiration dates
- DNSSEC status, DS records and key tag
- **Domain Age & Expiry Countdown** — Color-coded banner (green >90d, yellow 30-90d, red <30d)

### Email Security
- MX record analysis with provider detection (40+ providers)
- SPF record parsing and validation
- DMARC policy analysis
- BIMI and MTA-STS detection
- **DKIM** — Probes 20+ common selectors, displays found keys with algorithm and key length

### Server Info
- HTTP response headers and server software detection
- Response time measurement and redirect chain tracing
- Cache information and IP address display
- **Technology Stack Detection** — CDNs, frameworks, platforms, hosting
- **Security Headers Audit** — HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **HTTP/3 detection** via Alt-Svc header
- **HSTS preload status** check
- **security.txt and robots.txt** indicators

### Subdomain Discovery
- Scan Certificate Transparency logs via crt.sh
- Deduplicated, sorted results with copy buttons
- Live filter input
- CSV export

### User Experience
- Auto-lookup current tab's domain
- Recent searches (last 10)
- Dark/Light theme toggle
- Refresh button on every tab
- JSON export of full lookup
- Quick-action chips: hand off to the detailed report pages on ldns.com
- Settings panel for UI preferences

## Installation

### From Chrome Web Store
The extension is published as "LDNS - DNS & Domain Tools". Visit [ldns.com/extension](https://ldns.com/extension) for the live link.

### From Firefox Add-ons (AMO)
Available on [addons.mozilla.org](https://addons.mozilla.org) — search for "LDNS".

### From Source (Developer Mode)
1. Clone this repository
2. Run `npm install` **from the repository root** (the extension depends on the `@ldns/core` workspace package)
3. Run `npm run build` in `ldns-ext/`
4. Open `chrome://extensions` in Chrome
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `ldns-ext/dist` folder

## Privacy

LDNS is designed with privacy in mind:
- No analytics, telemetry, or accounts
- DNS, RDAP and CT-log queries go directly to public services
- **Nothing is ever sent to LDNS servers** — the extension has no backend
- All preferences and recent searches stay in your local browser storage
- See [PRIVACY.md](PRIVACY.md) for full details

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Read current tab URL for auto-lookup |
| `storage` | Save preferences locally |
| `host_permissions` | Query DNS providers, fetch server info, CT logs |

## Development

```bash
npm install         # from the repository root — installs all workspace packages
npm run dev         # development with hot reload
npm run check       # type checking
npm run build       # Chrome build → dist/
npm run build:firefox  # Firefox build → dist-firefox/
npm test -w @ldns/core   # run the shared-core test suite (137 tests)
npm run generate:description  # regenerate STORE_DESCRIPTION.txt (release prep)
```

## Tech Stack

- Svelte 5
- TypeScript (strict)
- Tailwind CSS v4
- Vite + crxjs
- Chrome Extension Manifest V3

## License

The code is licensed under the [MIT License](LICENSE) — use it, fork it, learn from it.

**Brand exception:** the LDNS name, wordmark, and the extension icons in `public/icons/` are **not** MIT-licensed — all rights reserved, see [LICENSE-BRAND](../LICENSE-BRAND). Forks are welcome, but they must ship under their own name and icons; publishing a fork to an extension store as "LDNS" or with the LDNS icons is not permitted. Referring to LDNS factually ("a fork of LDNS") is of course fine.

## Links

- Website: [ldns.com](https://ldns.com)
- Privacy: [ldns.com/extension/privacy](https://ldns.com/extension/privacy)
- Source & issues: [github.com/jmorf/ldns](https://github.com/jmorf/ldns) or [@jmorf on X](https://x.com/jmorf)
