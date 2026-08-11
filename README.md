# LDNS

Free, open-source DNS and domain tooling: DNS records, RDAP/WHOIS, email authentication, TLS certificates, security headers, ASN, and subdomain discovery. Available as a website and as a browser extension, sharing one lookup library.

## Use it

| | |
|---|---|
| **Website** | **[ldns.com](https://ldns.com)** |
| **Chrome extension** | [Chrome Web Store](https://chromewebstore.google.com/detail/ldns-dns-domain-tools/ehgkpjkmaichihneengcigkaoejmcofn) |
| **Firefox add-on** | [Firefox Add-ons](https://addons.mozilla.org/en-CA/firefox/addon/ldns-dns-domain-tools/) |

No accounts, no analytics, no tracking. The extension has no backend at all: every lookup goes straight from your browser to public DNS, registry and Certificate Transparency services, never to an LDNS server. The site adds a thin `/api/*` layer only for the lookups a browser cannot make itself.

## Layout

```
ldns/
├── packages/
│   └── core/              @ldns/core, shared TypeScript modules.
│                          Pure JS APIs (fetch, URL); no DOM, no chrome.*.
│                          Imported by both the site and the extension.
│
├── ldns2/                 ldns.com (SvelteKit on Cloudflare Workers)
│                          Production: https://ldns.com
│                          Dev:        npm run -w ldns-site dev
│
├── ldns-ext/              Browser extension (Chrome + Firefox, MV3)
│                          Chrome:  ehgkpjkmaichihneengcigkaoejmcofn
│                          Firefox: listed on addons.mozilla.org
│
├── package.json           npm workspaces root
└── package-lock.json
```

## Quick reference

Install from the repository root: this is an npm workspace, and both apps resolve `@ldns/core` through it.

```bash
# install everything
npm install

# run the site locally
npm run -w ldns-site dev

# build the extension
npm run -w ldns-ext build              # Chrome  -> ldns-ext/dist/
npm run -w ldns-ext build:firefox      # Firefox -> ldns-ext/dist-firefox/

# tests across all workspaces (553 specs: 162 core + 391 site)
npm test --workspaces --if-present

# type-check
npm run check --workspaces --if-present

# deploy the site
npm run -w ldns-site deploy            # builds + wrangler deploy to ldns.com
```

## Architecture

`@ldns/core` is the only shared dependency between the site and the extension. It is plain TypeScript with no DOM, no `chrome.*` and no SvelteKit, so it runs unchanged in a browser, a Cloudflare Worker and Node. Both consumers import from it via the workspace:

```ts
import { queryDns } from '@ldns/core/dns-query';
import { analyzeServer } from '@ldns/core/server-info';
import { fetchTlsCertificate } from '@ldns/core/tls-query';
```

What lives there: DNS over HTTPS and propagation comparison, RDAP, email authentication (SPF, DMARC, DKIM, BIMI, MTA-STS), SPF lookup-budget evaluation, DNSSEC validation, CAA policy checks, server and redirect analysis, security headers, TLS certificates and subdomain discovery from Certificate Transparency, ASN and PTR lookups, plus the shared SSRF guard and fetch helpers.

Two rules hold across it: every network call goes through `fetchWithTimeout` and accepts an `AbortSignal`, and any server endpoint that fetches a user-supplied host applies the SSRF guard. See [SECURITY.md](SECURITY.md) before self-hosting.

The site additionally has a server-side `/api/*` layer ([`ldns2/src/routes/api/`](ldns2/src/routes/api/)) for lookups a browser cannot make: CORS-blocked upstreams, raw TCP WHOIS, and Certificate Transparency queries. The extension calls `@ldns/core` directly, because MV3 host permissions let it fetch arbitrary origins itself.

## Per-project docs

- [ldns2/AGENTS.md](ldns2/AGENTS.md): site architecture, API endpoint patterns, design tokens
- [ldns-ext/AGENTS.md](ldns-ext/AGENTS.md): extension architecture, build pipeline, store submission
- [packages/core/README.md](packages/core/README.md): shared module index
- [ldns2/CHANGELOG.md](ldns2/CHANGELOG.md): site release notes
- [ldns-ext/CHANGELOG.md](ldns-ext/CHANGELOG.md): extension release notes

## Contributing

Bug reports and focused pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md) for the workspace layout, dev commands, and PR process. For security issues, please **don't** open a public issue; see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE): use it, fork it, learn from it.

**Brand exception:** the LDNS name, wordmark, and the extension/site icons are **not** covered by the MIT license, all rights reserved, see [LICENSE-BRAND](LICENSE-BRAND). Forks are welcome, but must ship under their own name and iconography; publishing a fork to an extension store as "LDNS" is not permitted. Referring to LDNS factually ("a fork of LDNS") is fine.
