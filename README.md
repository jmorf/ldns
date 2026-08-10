# LDNS — workspace

DNS, RDAP, email security, server, TLS, ASN, subdomain, and DKIM tools — across the **ldns.com** website and the **LDNS** browser extension. One workspace, one source of truth.

## Layout

```
ldns/
├── packages/
│   └── core/              @ldns/core — shared TypeScript modules.
│                          Pure JS APIs (fetch, URL); no DOM, no chrome.*.
│                          Imported by both the site and the extension.
│
├── ldns2/                 ldns.com (SvelteKit on Cloudflare Pages)
│                          Production: https://ldns.com
│                          Dev:        npm run -w ldns2 dev
│
├── ldns-ext/              Browser extension (Chrome + Firefox, MV3)
│                          Chrome:  ehgkpjkmaichihneengcigkaoejmcofn
│                          Firefox: addon listed on AMO
│
├── package.json           npm workspaces root
└── package-lock.json
```

## Quick reference

```bash
# install everything (uses npm workspaces)
npm install

# run the site locally
npm run -w ldns2 dev

# build the extension
npm run -w ldns-ext build              # Chrome
npm run -w ldns-ext build:firefox       # Firefox

# tests across all workspaces
npm test --workspaces --if-present      # 502 specs (137 core + 365 site)

# type-check
npm run check --workspaces --if-present

# deploy the site
npm run -w ldns2 deploy                 # builds + wrangler deploy → ldns.com
```

## Architecture

`@ldns/core` is the only shared dependency between the site and the extension. Both consumers import from it via the workspace:

```ts
import { queryDns, analyzeServer, fetchTlsCertificate } from '@ldns/core/dns-query';
```

The site additionally has a server-side `/api/*` proxy layer ([`ldns2/src/routes/api/`](ldns2/src/routes/api/)) for lookups that need to bypass browser CORS — server info, TLS, ASN, geo, subdomains, security headers, and WHOIS. The extension uses the same `@ldns/core` modules directly because it has MV3 host permissions to fetch arbitrary origins.

## Per-project docs

- [ldns2/AGENTS.md](ldns2/AGENTS.md) — site architecture, API endpoint patterns, design tokens
- [ldns-ext/AGENTS.md](ldns-ext/AGENTS.md) — extension architecture, build pipeline, store submission
- [packages/core/README.md](packages/core/README.md) — shared module index
- [ldns2/CHANGELOG.md](ldns2/CHANGELOG.md) — site release notes
- [ldns-ext/CHANGELOG.md](ldns-ext/CHANGELOG.md) — extension release notes

## History

This was previously two separate repos (`jmorf/ldns2` and `jmorf/ldns-ext`) plus a homeless `packages/core/` directory. As of v2.0.0 (site) / v1.7.5 (extension) it's a single workspace; the old repos remain as historical archives.

## Contributing

Bug reports and focused pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the workspace layout, dev commands, and PR process. For security issues, please **don't** open a public issue; see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) — use it, fork it, learn from it.

**Brand exception:** the LDNS name, wordmark, and the extension/site icons are **not** covered by the MIT license — all rights reserved, see [LICENSE-BRAND](LICENSE-BRAND). Forks are welcome, but must ship under their own name and iconography; publishing a fork to an extension store as "LDNS" is not permitted. Referring to LDNS factually ("a fork of LDNS") is fine.
