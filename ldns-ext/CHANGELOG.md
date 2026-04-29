# Changelog

## [1.7.5] - 2026-04-28

### Changed
- **Internal: shared core extracted to `@ldns/core` workspace package.** All DNS / RDAP / email / server / security / TLS / ASN / PTR / subdomain / DKIM modules now live in a single source of truth shared with the `ldns.com` website. No user-facing change; bundle size and behavior are identical.
- Source archive packaging updated to bundle the `@ldns/core` workspace alongside the extension so AMO/Web-Store reviewers can build a self-contained workspace with `npm install && npm run build:firefox` from the archive root.

## [1.7.4] - 2026-04-28

### Fixed
- **Download popover rendered behind the search bar.** The header's `backdrop-blur` creates a new stacking context, which was isolating the dropdown's z-index from later sibling elements. Promoted the header itself to `z-40` so the entire stacking context floats above the search/tab area.

## [1.7.3] - 2026-04-28

### Fixed
- **"Start from HTTP" toggle on the Server tab** was broken — the CSP `connect-src 'self' https:` was blocking outbound `http://` requests. Relaxed to `connect-src 'self' https: http:` so the HTTP→HTTPS upgrade path can be traced. `script-src` and `object-src` remain locked to `'self'`.

## [1.7.2] - 2026-04-28

### Added
- **CSV export** for DNS records (type, data, ttl). The header download icon now opens a small menu with two choices: **DNS records (CSV)** and **Full lookup (JSON)**.
- **Click-to-copy on every record row** — the entire row of a DNS, MX, NS, or subdomain entry is now a button. Click anywhere on the row to copy. The copy icon stays visible at low opacity as an affordance and lights up on hover; the row briefly tints green on success.

### Changed
- **Privacy-impacting settings default to OFF again.** Marketplace listing check is the only opt-in privacy feature and now defaults off on a fresh install. Cosmetic / UX preferences (playful loading messages, grain overlay) still default on.

## [1.7.1] - 2026-04-28

### Added
- **System-default theme**: Theme toggle now cycles `system → light → dark`. Default is `system`, which follows `prefers-color-scheme` and updates live when the OS setting changes.
- **Side panel mode**: New Settings toggle. When on, clicking the LDNS toolbar icon opens a resizable side panel that stays pinned while you browse instead of a popup. Uses `chrome.sidePanel`; gracefully hidden on browsers without the API.
- **Visible BIMI section** in the Email tab — shows the logo URL, optional VMC URL, and the raw record. Now also probes `selector1._bimi` in addition to `default._bimi`.
- **Visible MTA-STS section** in the Email tab.

### Changed
- **All user-facing settings default to ON** (for-sale check, playful loading messages, grain overlay) on a fresh install. `sidePanelMode` is the only one off by default.
- **Quick-action chips deep-link to ldns.com** — every tab now links to the appropriate tool page (e.g. DNS → `/[domain]`, Email → `/[domain]/email`, MX → `/[domain]/mx`, etc.) instead of generic third-party tools.
- **Brand icon back in the header** — replaced the "L" monogram with the actual extension icon.
- **Popup taller**: 720px tall on first open; no scroll-by-default.
- **For-sale check description**: Settings hint now explicitly explains it surfaces a chip + RDAP-tab banner with marketplace, price, and buy-now link.

### Removed
- **WHOIS fallback** is gone. Browser tabs cannot speak the WHOIS protocol (port 43), so the previous fallback proxied through `ldns.com/api/whois`. We've removed the feature entirely rather than route lookups through our backend. RDAP covers all gTLDs and most ccTLDs; for the rest, the RDAP tab will show the original error from the registry.
- `whois-query.ts` module deleted along with the `source: 'whois'` flag and "via WHOIS" badge in the RDAP UI.

### Fixed
- **Google DNS broken**: Reverted the endpoint URL to `dns.google/resolve` (the JSON API). `dns.google/dns-query` is RFC 8484 binary and does not return JSON.
- **Server lookup "Failed to fetch"**: Fixed two bugs — `analyzeServer` was swallowing fetch errors, and the popup CSP `connect-src` was locked to `rdap.org` only, blocking the bootstrap server's redirects to TLD-specific RDAP endpoints. CSP relaxed to `'self' https:` (script-src and object-src remain locked to `'self'`).
- **RDAP failures for many TLDs**: Same CSP fix — the rdap.org bootstrap 302-redirects to per-TLD RDAP servers (rdap.verisign.com, etc.) which were being blocked.

## [1.7.0] - 2026-04-28

### Added
- **DKIM lookup**: Probes 22 common selectors (default, google, selector1/2, s1/2, k1/2, etc.) and shows discovered keys with algorithm and approximate key length.
- **IP-to-ASN origin info**: Inline ASN, AS name, and country shown next to A/AAAA records, sourced from Team Cymru's free DNS service (no API key required).
- **Per-provider DNS latency**: Compare mode now shows response time for each of Cloudflare, Google, and DNS.SB.
- **Security headers audit**: HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy — color-coded in the Server tab.
- **HTTP/3 detection** via the `Alt-Svc` response header.
- **HSTS preload status**: Live check against `hstspreload.org` for the current domain.
- **security.txt and robots.txt** indicators in the Server tab.
- **DNSSEC chain detail** in the RDAP tab — DS records with key tag, algorithm, and digest.
- **IPv6 reverse DNS (PTR)**: AAAA records now resolve to PTR hostnames inline.
- **Quick-action chips** per tab: open the current domain in DNSViz, intoDNS, MX Toolbox, SSL Labs, securityheaders.com, Wayback, Shodan, etc.
- **JSON export** of the full lookup, accessible from the header.
- **Settings panel** with toggles for: for-sale check, WHOIS fallback, fun loading messages, grain overlay.
- **Refresh button** on every tab to re-query that tab independently.
- **Subdomain filter input** for live client-side filtering of CT-log results.
- **Session cache**: Reopening the popup within 5 minutes restores the last lookup instantly (`chrome.storage.session`).
- **Preconnect hints** to DNS providers — faster first lookup.
- **Geist Sans + Geist Mono** self-hosted fonts; tabular numerals applied to all numeric data.

### Changed
- **Privacy-first by default**: For-sale checks and WHOIS fallback are now opt-in. The default install no longer transmits any data to `ldns.com`. Both are toggleable in the new Settings panel.
- **Updated PRIVACY.md** with an honest, up-to-date list of every endpoint contacted, when, and why.
- **Visual rewrite**: New surface system using CSS variables, redesigned floating-pill tab bar with icons, redesigned record cards with hover affordances, refreshed empty/loading states, optional grain overlay, custom monogram in the header.
- **CSS variables** replace the previous 70+ `!important` light-mode override hack — light mode now scales cleanly.
- **Color system trimmed** to one signaling triad (emerald/amber/rose) plus the orange brand accent.
- **Loading states**: Skeleton bars with shimmer instead of a generic spinner.
- **Email tab**: Auth-record summary as a dot row ("3 of 5 auth records") plus optional DKIM section.
- **Propagation tab**: Latency strip and one-line consistency summary at the top.
- **Server tab**: Hero stat block (response time + status), security-headers row, side-channel probes for security.txt / robots.txt / HSTS preload.
- **Subdomain tab**: Filter input + refined CSV/copy/rescan actions.
- **DNS endpoint URL** for Google standardized to `dns.google/dns-query`.

### Removed
- **Dead background service worker** (`src/background/*`, `messaging.ts`, `tab-utils.ts`) — the popup queries directly under MV3 host permissions.
- **Email security score and grade** helpers — kept the per-record auth indicators, dropped the meaningless A+/A/B/C grade.
- **Unused `ALL_RECORD_TYPES`** export.
- **Console-log noise** in DNS query and redirect-trace paths.

### Fixed
- All five `svelte-check` errors in `SearchForm.svelte`, `RdapResults.svelte`, `LoadingState.svelte`.
- PTR lookup is now parallel (was serial).
- PTR now supports IPv6 addresses (was IPv4-only).
- Race condition where rapid re-lookups could overwrite state with stale data — every query now runs through an `AbortController`.
- Firefox manifest version drift (`1.5.1` → builds now sync from `package.json`).
- Firefox manifest missing `crt.sh` host permission.
- Stale placeholder URLs in `README.md`.

### Security
- Added Manifest V3 Content Security Policy locking `script-src` and `connect-src` to known endpoints.

### Tests
- 131 tests passing (was 123). Added coverage for new modules: `ptr`, `asn-query`, `security-checks`. Refreshed `dns-propagation` for the new latency-aware shape.

## [1.6.0] - 2026-02-08

### Added
- **DNS Propagation Comparison**: Compare DNS records across Cloudflare, Google, and DNS.SB providers with mismatch highlighting
- **Reverse DNS (PTR)**: Auto-lookup PTR records for A record IPs, displayed inline below each A record
- **Subdomain Discovery**: New "Subs" tab to discover subdomains via Certificate Transparency logs (crt.sh)
- **Technology Stack Detection**: Detect CDNs, servers, frameworks, platforms, and hosting from HTTP response headers — shown as colored badges in Server tab
- **Domain Age & Expiry Countdown**: Age and days-until-expiry banner in RDAP tab with color-coded urgency (green/yellow/red)
- Added `https://crt.sh/*` to host_permissions for CT log queries

### Changed
- DNS tab now has a "Compare Providers" toggle alongside filter chips
- RecordCard component now accepts optional PTR results to show reverse DNS inline
- Tab navigation expanded with "Subs" tab for subdomain discovery

## [1.5.1]

### Features
- DNS records lookup with multiple DoH providers
- RDAP/WHOIS registration data
- Email security analysis (SPF, DMARC, MTA-STS, BIMI)
- Server info with redirect chain tracing
- Domain for-sale detection
- Dark/light theme
- Auto-lookup current tab domain
