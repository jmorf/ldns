# @ldns/core

Pure-TypeScript shared core for the LDNS family of products.

## What's in here

| Module | Purpose |
|---|---|
| `dns-query` | DNS-over-HTTPS against Cloudflare / Google / DNS.SB |
| `dns-propagation` | Multi-provider compare with per-provider latency |
| `rdap-query` | RDAP via rdap.org bootstrap |
| `email-query` | MX, SPF, DMARC, MTA-STS, BIMI lookup |
| `parsers` | SPF / DMARC parsing + helpers |
| `domain-parser` | psl-backed registrable-domain extraction |
| `server-info` | HEAD/GET + redirect tracing |
| `security-checks` | HSTS / CSP / etc audit + Alt-Svc + HSTS preload |
| `tech-detect` | HTTP-header → tech-stack fingerprinting |
| `tls-query` | TLS cert via crt.sh CT logs |
| `ptr` | IPv4 + IPv6 reverse DNS, batched |
| `asn-query` | IP→ASN via Team Cymru DoH |
| `subdomain-query` | Subdomain discovery via crt.sh |
| `dkim-query` | DKIM selector probing |

## Runtime requirements

Modules use only `fetch`, `URL`, and standard JS. Works in:
- Modern browsers (Chrome, Firefox)
- Cloudflare Workers / Pages Functions
- Node.js 18+

No DOM, no `chrome.*`, no SvelteKit specifics.

## Install (workspace)

The package is consumed via npm workspaces from `ldns2`, `ldns-ext`, and any
future surfaces. Each surface adds:

```jsonc
// package.json
"dependencies": { "@ldns/core": "*" }
```

`npm install` from the repo root resolves it via the workspace.

## Tests

```bash
npm test --workspace=@ldns/core
```

Covers each module with mocked `fetch`. Currently 350+ specs.

## Versioning

Even-numbered minor versions correspond to a published extension release. The
website tracks `*` (always-latest workspace).
