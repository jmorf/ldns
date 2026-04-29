# LDNS Extension - Build Progress

## Current Status
v1.7.5 — shared logic extracted to `@ldns/core` workspace package (no user-facing change)

## Completed Checkpoints
- [x] setup-complete
- [x] types-extracted
- [x] dns-query-done
- [x] rdap-query-done
- [x] email-query-done
- [x] background-worker
- [x] popup-foundation
- [x] dns-tab-complete
- [x] rdap-tab-complete
- [x] email-tab-complete
- [x] v1.0.0
- [x] v1.1.0 - UI/UX improvements
- [x] v1.6.0 - Five new features
- [x] v1.7.0 - Polish, privacy and power-user features

## v1.7.0 highlights

### New tools
1. **DKIM probing** — 22 common selectors auto-tested
2. **IP→ASN/AS-name/country** via Team Cymru DoH (no API key)
3. **Per-provider DNS latency** in Compare mode
4. **Security-headers audit** + HTTP/3 + HSTS-preload + security.txt/robots.txt
5. **DNSSEC chain detail** (DS records inline)
6. **JSON export** of the full lookup
7. **Quick-action chips** to DNSViz, intoDNS, SSL Labs, securityheaders.com, etc.
8. **Settings panel** with opt-in privacy toggles

### Polish
- Geist Sans + Geist Mono with tabular numerals
- Floating-pill tab bar with icons
- Skeleton-shimmer loading
- CSS variables instead of `!important` light-mode hacks
- Custom monogram, refreshed empty states, optional grain overlay
- Refresh button on every tab

### Privacy
- For-sale and WHOIS-fallback are off by default
- Strict CSP in manifest
- IPv6 PTR support
- AbortController on every query
- Background service worker deleted (was dead code)

## Build Commands
- `npm run dev` - Development mode
- `npm run build` - Production Chrome build → `dist/`
- `npm run build:firefox` - Firefox build → `dist-firefox/`
- `npm test` - Run tests (131 passing)
- `npm run check` - TypeScript checking (zero errors)
- `npm run package:source` - Source bundle for store reviewers

## Loading the Extension
1. Run `npm run build`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Architecture

### Tabs
| Tab | Component | Features |
|-----|-----------|----------|
| DNS | DnsResults | Filter chips, propagation toggle, inline PTR + ASN |
| RDAP | RdapResults | Age/expiry banner, DNSSEC chain, optional for-sale |
| Email | EmailResults | SPF/DMARC analysis, DKIM probe, MTA-STS, BIMI |
| Server | ServerResults | Tech detection, sec-headers, HTTP/3, HSTS, security.txt |
| Subs | SubdomainResults | CT-log scanner with live filter and CSV export |

### Key Modules
| Module | Purpose |
|--------|---------|
| `dns-query.ts` | DNS-over-HTTPS queries (Cloudflare/Google/DNS.SB) |
| `dns-propagation.ts` | Multi-provider compare with per-provider latency |
| `subdomain-query.ts` | CT log subdomain discovery |
| `tech-detect.ts` | HTTP-header technology fingerprinting |
| `security-checks.ts` | Security-headers audit, HTTP/3, HSTS preload |
| `dkim-query.ts` | DKIM selector probing |
| `asn-query.ts` | IP→ASN via Team Cymru DoH |
| `ptr.ts` | IPv4 + IPv6 reverse DNS lookups |
| `extension-state.svelte.ts` | Centralized state with AbortController + cache |
| `storage.ts` | Local + session storage helpers + in-mem cache |

## File Mapping (LDNS2 → Extension)
| LDNS2 Source | Line Range | Extension File |
|--------------|------------|----------------|
| state.svelte.ts | 3-227 | lib/shared/types.ts |
| state.svelte.ts | 427-488 | lib/shared/dns-query.ts |
| state.svelte.ts | 546-637 | lib/shared/rdap-query.ts |
| state.svelte.ts | 912-1045 | lib/shared/email-query.ts |
| state.svelte.ts | 1047-1265 | lib/shared/parsers.ts |
| state.svelte.ts | 353-412 | lib/shared/domain-parser.ts |
