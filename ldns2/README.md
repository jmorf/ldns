# LDNS2

A modern, client-side DNS lookup and domain analysis tool built with SvelteKit 5 and Cloudflare Pages. 100% client-side — no backend required.

## Features

### DNS Lookups
- Query A, AAAA, MX, TXT, NS, SOA, CAA, DNSKEY, HTTPS records
- DNS-over-HTTPS via Cloudflare, Google, and DNS.SB
- **DNS Propagation Comparison** — Compare results across all 3 providers with mismatch detection
- **Reverse DNS (PTR)** — Lookup PTR records for domain A record IPs

### RDAP/WHOIS
- Domain registration details via RDAP protocol
- Registrar, nameservers, DNSSEC status
- Creation, update, and expiration dates

### Email Security
- MX record analysis with provider detection
- SPF record parsing and validation
- DMARC policy analysis
- BIMI and MTA-STS detection

### Server Info
- HTTP response headers analysis
- Server software detection
- Redirect chain tracing
- Cache and IP information

### Security Analysis
- SSL/TLS assessment from CAA records
- Email security scoring
- Domain reputation indicators

### Subdomain Discovery
- Scan Certificate Transparency logs via crt.sh
- Deduplicated, sorted results with certificate details

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests (172 passing)
npm run test

# Deploy to Cloudflare Pages
npm run deploy
```

## Tech Stack

- **Framework**: [SvelteKit 5](https://kit.svelte.dev/) with TypeScript (strict mode)
- **Reactivity**: Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- **UI**: [Flowbite Svelte](https://flowbite-svelte.com/) components + icons
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom vermilion/orange palette
- **DNS**: Cloudflare DNS over HTTPS (DoH)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) (static)

## Project Structure

```
src/
├── routes/
│   ├── (content)/           # Static pages (/, /about)
│   └── (tools)/[domain]/    # Domain analysis tools
│       ├── +page.svelte     # DNS lookup (main)
│       ├── email/           # Email configuration
│       ├── rdap/            # RDAP lookup
│       ├── server/          # Server info
│       ├── security/        # Security analysis
│       ├── propagation/     # DNS propagation comparison
│       ├── reverse-dns/     # Reverse DNS (PTR) lookup
│       └── subdomains/      # CT log subdomain discovery
├── lib/
│   ├── components/          # Reusable UI components
│   ├── utils/               # Helpers (seoContent, navigation, useToolPage)
│   └── state.svelte.ts      # Centralized state management
└── app.css                  # Global styles
```

## Contributing

See [AGENTS.md](./AGENTS.md) for detailed development guidelines and architecture documentation.

## License

Proprietary - Free to use for personal and commercial purposes. See [LICENSE](LICENSE) for full terms.
