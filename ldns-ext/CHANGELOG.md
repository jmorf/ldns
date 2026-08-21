# Changelog

## [1.8.2] - 2026-08-11

### Fixed
- **RDAP timeout raised from 15s to 30s.** rdap.org's bootstrap intermittently
  stalls for 25-35 seconds on a cold TLD and then answers successfully
  (measured against .br and others); the shorter timeout was turning those
  real answers into failures. DNS stays at 10s, which is already several
  hundred times the typical DoH response time.

## [1.8.1] - 2026-08-11

### Fixed
- **The current tab's domain is used again.** A recent lookup (within five
  minutes) took priority over the tab you were actually on, so navigating to
  a new site and reopening still showed the previous domain. The tab wins
  now; a saved session is only restored when it belongs to that same tab, so
  a domain you typed manually still survives closing and reopening.
- **Side panel follows navigation.** The panel stays mounted while you browse,
  so it previously kept whatever domain was open when it launched. It now
  updates as you move between tabs and pages, unless you have typed a
  different domain, in which case your lookup is left alone.
- **Subdomain lookups fail less often.** The second Certificate Transparency
  source is now brought in only when crt.sh is slow or failing, rather than
  on every scan, which keeps its (small) free quota available for when it is
  actually needed. When both sources fail, the error says so instead of
  suggesting a retry that cannot work.
- Subdomain results are cached for 30 minutes rather than 5, since CT data
  changes over days and both sources are rate-limited.

### Added
- **Optional CertSpotter API key** in Settings. Subdomain discovery falls back
  to CertSpotter when crt.sh is down, and its free tier allows only a few
  lookups per hour per IP. Adding your own key removes that limit. The key is
  stored only in your browser and sent only to api.certspotter.com; there is
  no LDNS server involved.
- Upstream failures now explain themselves: what the status code means, that
  your domain is not at fault, and whether retrying will help.

## [1.8.0] - 2026-08-10

### Added
- **LDNS is now open source.** The extension, the ldns.com website, and the
  shared `@ldns/core` lookup library are public at
  [github.com/jmorf/ldns](https://github.com/jmorf/ldns) under the MIT license
  (the LDNS name and icons are excluded, see LICENSE-BRAND). The privacy
  claims are now independently verifiable rather than something you have to
  take on trust. Bug reports and pull requests welcome.

### Removed
- **Marketplace ("For Sale") check removed entirely.** The Settings toggle, the
  "For Sale" chip under the search bar, and the RDAP-tab listing banner are all
  gone. This was the only feature that ever contacted an LDNS server.

### Changed
- **The extension now has no backend at all.** Every lookup goes directly from
  your browser to public DNS, registry, and Certificate Transparency services;
  nothing is sent to ldns.com under any setting. The privacy policy has been
  rewritten accordingly. There is no longer an "opt-in feature that contacts
  ldns.com" section, because there is no such feature.
- Settings is now purely UI preferences (side panel, loading messages, grain).

## [1.7.11] - 2026-08-09

Reliability and security hardening pass ahead of open-sourcing, driven by a
four-dimension review (security, correctness, simplicity, open-source
readiness) of the extension and shared core.

### Fixed
- **Outages no longer masquerade as empty results.** A DoH endpoint that is
  down (or no network at all) used to render "No records found" and
  "0 of 5 auth records" as if the domain were unconfigured; total transport
  failure now surfaces as an error state.
- **Every network call has a timeout, and cancellation is real.** DNS and RDAP
  fetches previously had no timeout (a hung connection would spin the popup
  forever), and switching domains only *ignored* the old lookup while its
  requests (up to ~40) kept running. All fetches now share one timeout/abort
  helper and the per-query AbortSignal reaches the socket.
- **International domains work.** Unicode input (e.g. `münchen.de`) is
  punycoded before querying, previously every backend rejected it and the UI
  claimed the domain didn't exist.
- **Long TXT records are no longer garbled.** Chunked (>255-byte) TXT records
  (large SPF records, 2048-bit DKIM keys) are joined per RFC 7208 instead of
  displaying quote-littered fragments that broke parsing and copy.
- **Refresh actually refreshes.** The per-tab Refresh/Rescan buttons bypassed
  nothing, inside the cache TTL they silently re-served cached data; they now
  force a fresh query.
- **DKIM results no longer vanish on repeat lookups** (a cache-hit path
  skipped the DKIM probe entirely).
- **A dead DNS provider is no longer reported as a propagation mismatch**,
  unreachable providers are labeled and excluded from comparison.
- Stale-response guards on the PTR and security.txt/robots.txt/HSTS-preload
  side probes (slow responses for a previous domain could overwrite the
  current domain's results).
- BIMI logo/VMC links from DNS TXT records are scheme-validated before being
  used as links; the subdomain CSV export now neutralizes spreadsheet formula
  injection like the other exports.
- DMARC parsing handles uppercase tags and `=` inside values; malformed
  registry dates fall back to the raw string instead of "Invalid Date";
  `host:port` and `host?query` inputs are parsed correctly.

### Changed
- Simplification sweep: ~400 lines of dead code removed (unused message
  types, WHOIS-fallback remnants, no-op helpers, duplicated
  formatters/constants now shared via @ldns/core), five unused dependencies
  dropped (including the native `canvas` module), and the redundant explicit
  host list removed from the manifests (`<all_urls>` already covered it).
- Docs corrected to match the code (no WHOIS fallback, no TLS-RPT claim,
  accurate test counts and workspace build steps).

## [1.7.10] - 2026-08-05

### Added
- **Report a bug / send feedback.** New link in Settings and a compact "Report a bug" link in the popup footer. Both open a GitHub issue in the public `ldns-feedback` tracker (issues only. The extension source stays private), prefilled with the extension version and browser so reports arrive actionable. Nothing is sent until the user submits the issue on GitHub.
- **X contact.** [@jmorf on X](https://x.com/jmorf) listed as an informal feedback channel in Settings, the README, and the store listing links.

## [1.7.9] - 2026-04-30

### Fixed
- **Firefox: "File not found" when toggling Side panel mode off from the popup.** `chrome.action.setPopup({ popup })` interprets relative paths differently on the two browsers. Chrome resolves them against the extension root, Firefox resolves them against the calling page. Switching the toggle off from inside the popup at `moz-extension://uuid/src/popup/popup.html` was setting the popup to `src/popup/src/popup/popup.html`, which 404'd. Switched to `chrome.runtime.getURL('src/popup/popup.html')` so we always pass an absolute extension URL that both browsers accept unambiguously.

## [1.7.8] - 2026-04-29

### Changed
- **Tightened "For Sale" detection.** v1.7.7's parking-page fingerprint was too broad. It flagged any GoDaddy CashParking page as for-sale even when the page was just ad monetization with no buy CTA (e.g. `ntwd.com`). The detector is now high-precision: it only fires when (a) the page chain ends on a real marketplace buy URL like `hugedomains.com/buy-domain.aspx`, `dan.com/buy-domain/`, `sedo.com/sales/…`, `afternic.com/forsale/`, or `uniregistrymarket.link/`, OR (b) the page body links out to one of those buy URLs, OR (c) the body contains explicit buy copy paired with a price ("Buy now $X,XXX"). Generic "this domain is for sale" copy alone no longer fires. Domains that are merely parked are no longer surfaced as for-sale.

## [1.7.7] - 2026-04-29

### Added
- **One-time tip banner** in the popup nudging users to try Side panel mode. Only shown on browsers that support a side panel (Chrome via `chrome.sidePanel`, Firefox via `chrome.sidebarAction`), only on the popup itself (not inside the side panel), and only until the user explicitly dismisses it via the X or "Got it" button. Persists in `chrome.storage.local` (key `ldns_sidebar_tip_seen`), once dismissed, never returns.
- **Parking-page sale detection.** The for-sale check now fingerprints the apex page against known parking platforms (GoDaddy CashParking, HugeDomains, Sedo, Bodis, ParkingCrew, Dan/Undeveloped, Uniregistry Market, and Afternic landers), plus generic "this domain is for sale" copy as a last-resort catch. Also follows the JS-redirect stub that GoDaddy CashParking serves at the apex (`window.location.href="/lander"`) so the actual lander gets fingerprinted. Result: domains like `ntwd.com` now correctly surface "Parked at GoDaddy CashParking" with a deep link.

### Changed
- The For Sale chip in the search bar now reads "Parked · {platform}" when the listing comes from a parking-page detection, falling back to "For Sale" for Afternic/Dynadot listings with prices.

## [1.7.6] - 2026-04-29

### Fixed
- **Side-panel mode now works on Firefox.** The previous Firefox build silently disabled the side-panel toggle because Firefox doesn't implement Chrome's `chrome.sidePanel` API. Firefox uses the older `sidebar_action` manifest field + `chrome.sidebarAction` API. Added a `sidebar_action` declaration to `manifest.firefox.json` (panel = `popup.html?sp=1`, same query param Chrome uses) and a tiny `background.js` that bridges the toolbar-icon click to `chrome.sidebarAction.toggle()`. UX matches Chrome (single click on the action button opens or closes the panel), even though the underlying APIs are different.
- Settings → Side-panel mode is no longer hidden on Firefox.

## [1.7.5] - 2026-04-28

### Changed
- **Internal: shared core extracted to `@ldns/core` workspace package.** All DNS / RDAP / email / server / security / TLS / ASN / PTR / subdomain / DKIM modules now live in a single source of truth shared with the `ldns.com` website. No user-facing change; bundle size and behavior are identical.
- Source archive packaging updated to bundle the `@ldns/core` workspace alongside the extension so AMO/Web-Store reviewers can build a self-contained workspace with `npm install && npm run build:firefox` from the archive root.

## [1.7.4] - 2026-04-28

### Fixed
- **Download popover rendered behind the search bar.** The header's `backdrop-blur` creates a new stacking context, which was isolating the dropdown's z-index from later sibling elements. Promoted the header itself to `z-40` so the entire stacking context floats above the search/tab area.

## [1.7.3] - 2026-04-28

### Fixed
- **"Start from HTTP" toggle on the Server tab** was broken. The CSP `connect-src 'self' https:` was blocking outbound `http://` requests. Relaxed to `connect-src 'self' https: http:` so the HTTP→HTTPS upgrade path can be traced. `script-src` and `object-src` remain locked to `'self'`.

## [1.7.2] - 2026-04-28

### Added
- **CSV export** for DNS records (type, data, ttl). The header download icon now opens a small menu with two choices: **DNS records (CSV)** and **Full lookup (JSON)**.
- **Click-to-copy on every record row**. The entire row of a DNS, MX, NS, or subdomain entry is now a button. Click anywhere on the row to copy. The copy icon stays visible at low opacity as an affordance and lights up on hover; the row briefly tints green on success.

### Changed
- **Privacy-impacting settings default to OFF again.** Marketplace listing check is the only opt-in privacy feature and now defaults off on a fresh install. Cosmetic / UX preferences (playful loading messages, grain overlay) still default on.

## [1.7.1] - 2026-04-28

### Added
- **System-default theme**: Theme toggle now cycles `system → light → dark`. Default is `system`, which follows `prefers-color-scheme` and updates live when the OS setting changes.
- **Side panel mode**: New Settings toggle. When on, clicking the LDNS toolbar icon opens a resizable side panel that stays pinned while you browse instead of a popup. Uses `chrome.sidePanel`; gracefully hidden on browsers without the API.
- **Visible BIMI section** in the Email tab, shows the logo URL, optional VMC URL, and the raw record. Now also probes `selector1._bimi` in addition to `default._bimi`.
- **Visible MTA-STS section** in the Email tab.

### Changed
- **All user-facing settings default to ON** (for-sale check, playful loading messages, grain overlay) on a fresh install. `sidePanelMode` is the only one off by default.
- **Quick-action chips deep-link to ldns.com**, every tab now links to the appropriate tool page (e.g. DNS → `/[domain]`, Email → `/[domain]/email`, MX → `/[domain]/mx`, etc.) instead of generic third-party tools.
- **Brand icon back in the header**, replaced the "L" monogram with the actual extension icon.
- **Popup taller**: 720px tall on first open; no scroll-by-default.
- **For-sale check description**: Settings hint now explicitly explains it surfaces a chip + RDAP-tab banner with marketplace, price, and buy-now link.

### Removed
- **WHOIS fallback** is gone. Browser tabs cannot speak the WHOIS protocol (port 43), so the previous fallback proxied through `ldns.com/api/whois`. We've removed the feature entirely rather than route lookups through our backend. RDAP covers all gTLDs and most ccTLDs; for the rest, the RDAP tab will show the original error from the registry.
- `whois-query.ts` module deleted along with the `source: 'whois'` flag and "via WHOIS" badge in the RDAP UI.

### Fixed
- **Google DNS broken**: Reverted the endpoint URL to `dns.google/resolve` (the JSON API). `dns.google/dns-query` is RFC 8484 binary and does not return JSON.
- **Server lookup "Failed to fetch"**: Fixed two bugs, `analyzeServer` was swallowing fetch errors, and the popup CSP `connect-src` was locked to `rdap.org` only, blocking the bootstrap server's redirects to TLD-specific RDAP endpoints. CSP relaxed to `'self' https:` (script-src and object-src remain locked to `'self'`).
- **RDAP failures for many TLDs**: Same CSP fix. The rdap.org bootstrap 302-redirects to per-TLD RDAP servers (rdap.verisign.com, etc.) which were being blocked.

## [1.7.0] - 2026-04-28

### Added
- **DKIM lookup**: Probes 22 common selectors (default, google, selector1/2, s1/2, k1/2, etc.) and shows discovered keys with algorithm and approximate key length.
- **IP-to-ASN origin info**: Inline ASN, AS name, and country shown next to A/AAAA records, sourced from Team Cymru's free DNS service (no API key required).
- **Per-provider DNS latency**: Compare mode now shows response time for each of Cloudflare, Google, and DNS.SB.
- **Security headers audit**: HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, color-coded in the Server tab.
- **HTTP/3 detection** via the `Alt-Svc` response header.
- **HSTS preload status**: Live check against `hstspreload.org` for the current domain.
- **security.txt and robots.txt** indicators in the Server tab.
- **DNSSEC chain detail** in the RDAP tab: DS records with key tag, algorithm, and digest.
- **IPv6 reverse DNS (PTR)**: AAAA records now resolve to PTR hostnames inline.
- **Quick-action chips** per tab: open the current domain in DNSViz, intoDNS, MX Toolbox, SSL Labs, securityheaders.com, Wayback, Shodan, etc.
- **JSON export** of the full lookup, accessible from the header.
- **Settings panel** with toggles for: for-sale check, WHOIS fallback, fun loading messages, grain overlay.
- **Refresh button** on every tab to re-query that tab independently.
- **Subdomain filter input** for live client-side filtering of CT-log results.
- **Session cache**: Reopening the popup within 5 minutes restores the last lookup instantly (`chrome.storage.session`).
- **Preconnect hints** to DNS providers, faster first lookup.
- **Geist Sans + Geist Mono** self-hosted fonts; tabular numerals applied to all numeric data.

### Changed
- **Privacy-first by default**: For-sale checks and WHOIS fallback are now opt-in. The default install no longer transmits any data to `ldns.com`. Both are toggleable in the new Settings panel.
- **Updated PRIVACY.md** with an honest, up-to-date list of every endpoint contacted, when, and why.
- **Visual rewrite**: New surface system using CSS variables, redesigned floating-pill tab bar with icons, redesigned record cards with hover affordances, refreshed empty/loading states, optional grain overlay, custom monogram in the header.
- **CSS variables** replace the previous 70+ `!important` light-mode override hack, light mode now scales cleanly.
- **Color system trimmed** to one signaling triad (emerald/amber/rose) plus the orange brand accent.
- **Loading states**: Skeleton bars with shimmer instead of a generic spinner.
- **Email tab**: Auth-record summary as a dot row ("3 of 5 auth records") plus optional DKIM section.
- **Propagation tab**: Latency strip and one-line consistency summary at the top.
- **Server tab**: Hero stat block (response time + status), security-headers row, side-channel probes for security.txt / robots.txt / HSTS preload.
- **Subdomain tab**: Filter input + refined CSV/copy/rescan actions.
- **DNS endpoint URL** for Google standardized to `dns.google/dns-query`.

### Removed
- **Dead background service worker** (`src/background/*`, `messaging.ts`, `tab-utils.ts`), the popup queries directly under MV3 host permissions.
- **Email security score and grade** helpers, kept the per-record auth indicators, dropped the meaningless A+/A/B/C grade.
- **Unused `ALL_RECORD_TYPES`** export.
- **Console-log noise** in DNS query and redirect-trace paths.

### Fixed
- All five `svelte-check` errors in `SearchForm.svelte`, `RdapResults.svelte`, `LoadingState.svelte`.
- PTR lookup is now parallel (was serial).
- PTR now supports IPv6 addresses (was IPv4-only).
- Race condition where rapid re-lookups could overwrite state with stale data, every query now runs through an `AbortController`.
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
- **Technology Stack Detection**: Detect CDNs, servers, frameworks, platforms, and hosting from HTTP response headers: shown as colored badges in Server tab
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
