#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);
const version = packageJson.version;

const description = `LDNS is the essential DNS and domain toolkit for web developers, IT professionals, system administrators, and security researchers. Get instant access to DNS records, WHOIS/RDAP registration data, email security configuration, and server information - all from a single click in your browser toolbar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE FEATURES

• DNS Records — A, AAAA, MX, TXT, NS, SOA, CAA, CNAME via encrypted DoH
• DNS Propagation — Compare records across Cloudflare, Google, DNS.SB with per-provider latency
• Reverse DNS — Auto PTR lookups for A and AAAA records (IPv4 + IPv6)
• IP-to-ASN — Origin AS number, name and country shown inline (Team Cymru)
• WHOIS/RDAP — Registration, expiry, DNSSEC chain, domain age countdown
• Email Security — SPF, DMARC, DKIM (selector probing), BIMI, MTA-STS with provider detection
• Server Info — Headers, redirects, response time, technology stack, security-headers audit, HTTP/3, HSTS preload, security.txt
• Subdomain Discovery — Scan Certificate Transparency logs for subdomains
• Click-to-copy on every record row + CSV and JSON export
• Side-panel mode — pin LDNS while you browse (Chrome)
• System / light / dark theme — follows OS by default
• Deep links to detailed reports on ldns.com for any tab
• Privacy First — No accounts, no tracking, no data sent to ldns.com unless you opt in to the marketplace listing check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DNS RECORDS

Look up any DNS record type instantly using encrypted DNS-over-HTTPS:

• A Records - IPv4 addresses
• AAAA Records - IPv6 addresses
• MX Records - Mail server configuration
• TXT Records - SPF, DKIM, domain verification
• NS Records - Nameservers
• SOA Records - Start of authority
• CAA Records - Certificate authority authorization
• CNAME Records - Canonical names

Choose your preferred DNS provider:
• Cloudflare (1.1.1.1) - Fast, privacy-focused
• Google (8.8.8.8) - Reliable, widely used
• DNS.SB - Privacy-focused, no logging

All queries use encrypted DNS-over-HTTPS (DoH) for privacy and security. Filter results by record type and copy values with one click.

DNS Propagation Comparison
Toggle "Compare" to see records from all 3 providers side by side. Works with any record type filter. Mismatches are highlighted so you can spot propagation issues instantly.

Reverse DNS (PTR)
A record IPs are automatically resolved to their PTR hostnames, displayed inline below each record.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 WHOIS / RDAP DATA

Get comprehensive domain registration information through the modern RDAP protocol:

• Registrar - Who the domain is registered with
• Registration Date - When the domain was first registered
• Last Updated - Most recent modification date
• Expiration Date - When the domain expires
• Nameservers - Authoritative DNS servers
• Domain Status - clientTransferProhibited, serverDeleteProhibited, etc.
• DNSSEC - Whether the domain uses DNS Security Extensions

Domain Age & Expiry Countdown
• See how old the domain is at a glance
• Days until expiration with color-coded urgency (green >90d, yellow 30-90d, red <30d)

RDAP (Registration Data Access Protocol) is the modern replacement for WHOIS, providing structured, reliable data directly from domain registries.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 EMAIL SECURITY ANALYSIS

Analyze any domain's email authentication and security configuration:

MX Records & Provider Detection
• View mail server priorities and hostnames
• Automatic provider detection (Google Workspace, Microsoft 365, Zoho, ProtonMail, and 40+ others)

SPF Analysis (Sender Policy Framework)
• Full mechanism breakdown (include, a, mx, ip4, ip6, all)
• Policy interpretation (pass, softfail, fail, neutral)
• Included domain detection
• Provider identification from SPF includes

DMARC Analysis (Domain-based Message Authentication)
• Policy level (none, quarantine, reject)
• Subdomain policy
• Alignment settings (DKIM and SPF)
• Reporting addresses (aggregate and forensic)
• Percentage enforcement

Additional Email Security
• MTA-STS detection (Mail Transfer Agent Strict Transport Security)
• BIMI detection (Brand Indicators for Message Identification)
• TLS-RPT (TLS Reporting)

Perfect for diagnosing email deliverability issues, verifying email authentication setup, or auditing domain security.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️ SERVER INFORMATION

Analyze web server configuration and behavior:

IP Addresses
• IPv4 and IPv6 addresses from DNS

Response Details
• HTTP status code and message
• Response time measurement
• Final URL after redirects

Server Headers
• Server software (nginx, Apache, cloudflare, etc.)
• X-Powered-By (PHP, ASP.NET, etc.)
• Content-Type
• Via (proxy information)
• X-Cache (CDN cache status)

Cache Information
• Cache-Control directives
• Age (time in cache)
• ETag (entity tag)
• Last-Modified date

Redirect Chain Tracing
• Full redirect path visualization
• Status code for each hop (301, 302, 307, 308)
• Response time per redirect
• Option to start from HTTP to trace HTTPS upgrades
• Final destination URL

Technology Stack Detection
Automatically identify the technologies behind any website from HTTP headers:
• CDNs - Cloudflare, CloudFront, Fastly, Akamai
• Servers - nginx, Apache, LiteSpeed
• Frameworks - Next.js, Express, PHP, ASP.NET
• Platforms - WordPress, Shopify, Wix, Squarespace, Drupal
• Hosting - Vercel, Heroku, Fly.io, Render, AWS, GitHub Pages
Detected technologies appear as color-coded badges at the top of the Server tab.

See exactly how browsers reach your site, including all intermediate redirects. Essential for debugging redirect loops, verifying HTTPS enforcement, and analyzing CDN behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 SUBDOMAIN DISCOVERY

Find subdomains for any domain by scanning Certificate Transparency logs:

• Queries crt.sh for all SSL certificates issued to subdomains
• Deduplicates and sorts results alphabetically
• Copy any subdomain with one click
• Automatic retry if crt.sh is slow or overloaded

Useful for security assessments, finding forgotten services, or mapping an organization's web presence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ KEY FEATURES

Instant Lookup
Click the LDNS icon and the current tab's domain is automatically loaded and queried. No typing required for quick lookups.

Recent Searches
Access your last 10 searched domains from the dropdown. Click any recent search to query it again instantly.

Dark & Light Themes
Toggle between dark and light modes to match your preference or system theme.

Privacy First
• No account required
• No data collection
• No analytics or tracking
• No data sent to LDNS servers
• All queries go directly to public DNS/RDAP services
• Recent searches stored locally only

Fast & Lightweight
• Built with modern web technologies
• Minimal permissions
• Quick popup load time
• Parallel DNS queries for speed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍💻 PERFECT FOR

Web Developers
• Debug DNS propagation issues
• Verify domain configuration
• Check SSL/TLS setup
• Analyze redirect chains

System Administrators
• Audit domain settings
• Verify nameserver configuration
• Check DNSSEC status
• Monitor domain expiration

Security Researchers
• Analyze email authentication (SPF/DMARC)
• Investigate domain infrastructure
• Check for misconfigurations
• Verify security headers

SEO Professionals
• Check domain age and history
• Verify redirect implementation
• Analyze server response times
• Confirm canonical URLs

DevOps Engineers
• Verify DNS changes
• Debug CDN configuration
• Check cache headers
• Trace request routing

Email Administrators
• Diagnose deliverability issues
• Verify SPF/DKIM/DMARC setup
• Identify email providers
• Audit authentication records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 PRIVACY & PERMISSIONS

LDNS requests only the permissions necessary for functionality:

• activeTab - Read the current tab's URL to auto-populate the domain field
• storage - Save your preferences and recent searches locally in your browser
• host_permissions - Query DNS providers and fetch server information

We believe in transparency:
• No personal data is collected
• No browsing history is tracked
• No analytics or telemetry
• All data stays in your browser
• Open about what we access and why

Read our full privacy policy at ldns.com/extension/privacy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ TECHNICAL DETAILS

• DNS-over-HTTPS (DoH) for encrypted, private DNS queries
• RDAP protocol for modern WHOIS data
• Chrome Extension Manifest V3
• Svelte 5 & TypeScript
• Tailwind CSS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 CURRENT VERSION: v${version}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CHANGELOG

v1.7.10
• Report a bug / send feedback — new link in Settings and the popup footer opens a GitHub issue (public issue tracker, prefilled with your extension version and browser; nothing is sent until you submit it)
• You can also reach @jmorf on X for informal feedback

v1.7.9
• Fixed Firefox "File not found" error when turning Side panel mode off from inside the popup. Underlying cause: chrome.action.setPopup interprets relative paths differently on Chrome and Firefox; we now pass the absolute extension URL via chrome.runtime.getURL so both browsers behave consistently.

v1.7.8
• Tightened "For Sale" detection — only flags domains with an explicit marketplace buy CTA (HugeDomains, Sedo, Dan, Afternic, Uniregistry) or a "Buy now $X,XXX" price tag. Generic parked / ad-monetized pages are no longer mislabeled as for sale.

v1.7.7
• One-time tip banner in the popup suggests trying Side panel mode (dismissable, never returns)
• For Sale chip now distinguishes "Parked at GoDaddy / HugeDomains / Sedo / etc." from priced marketplace listings

v1.7.6
• Side panel mode now works on Firefox — previously a silent no-op because Firefox doesn't ship chrome.sidePanel. Single click on the toolbar icon opens or closes the panel, matching Chrome.

v1.7.5
• Internal: shared logic extracted to a workspace package (no user-facing change)
• Source archive now bundles the workspace for one-step reviewer builds

v1.7.4
• Fixed download popover rendering behind the search bar (header stacking-context fix)

v1.7.3
• Fixed "Start from HTTP" toggle on the Server tab (CSP was blocking plain-HTTP fetches)

v1.7.2
• CSV export for DNS records (header download menu now offers CSV or JSON)
• Click-to-copy on every record row — the whole row is the button now, not just the icon
• Privacy-impacting settings (marketplace listing check) default to OFF again

v1.7.1
• System-default theme with light/dark override (cycles system → light → dark)
• Side panel mode — pin LDNS to a resizable side panel while you browse (Chrome)
• BIMI and MTA-STS sections back in the Email tab; BIMI now probes both default and selector1 selectors
• Quick-action chips deep-link to specific ldns.com tool pages
• All user-facing settings on by default; brand icon restored to the header
• Popup is 720px tall by default — no scroll-by-default
• Google DNS endpoint fixed (was broken in 1.7.0)
• Server lookup and RDAP redirects fixed (CSP was too strict)
• WHOIS fallback removed (it required proxying through ldns.com — RDAP-only now)

v1.7.0
• DKIM probing — checks 22 common selectors and shows discovered keys
• IP-to-ASN inline — origin AS number, name and country next to A/AAAA records (Team Cymru, no API key)
• Per-provider DNS latency in Compare mode
• Security-headers audit — HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
• HTTP/3 detection via Alt-Svc
• HSTS preload status check + security.txt + robots.txt indicators
• DNSSEC chain detail (DS records inline)
• JSON export of the full lookup
• Quick-action chips for one-click hand-off to detailed ldns.com reports per tab
• Settings panel — opt-in privacy controls for for-sale checks and WHOIS fallback
• Refresh button on every tab
• IPv6 PTR support
• Skeleton loading, redesigned UI with Geist typography, floating-pill tab bar, refreshed colors
• Strict Content Security Policy in the manifest

v1.6.0
• DNS Propagation Comparison — compare records across Cloudflare, Google, DNS.SB
• Reverse DNS (PTR) — auto-lookup PTR records for A record IPs
• Subdomain Discovery — new Subs tab scanning Certificate Transparency logs
• Technology Stack Detection — colored badges for CDNs, servers, frameworks, platforms
• Domain Age & Expiry Countdown — color-coded banner in RDAP tab

v1.5.1
• Added DNS.SB as third DNS provider option
• Fixed DNSSEC signature records appearing in results
• Improved DNS response filtering

v1.5.0
• Added WHOIS fallback when RDAP fails
• Improved domain parsing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 LINKS

Website: ldns.com
Privacy Policy: ldns.com/extension/privacy
Feedback & Bug Reports: github.com/jmorf/ldns-feedback
X: x.com/jmorf (@jmorf)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LDNS - Professional DNS and domain tools, right in your browser.
`;

// Write the description
fs.writeFileSync(
  path.join(__dirname, '../STORE_DESCRIPTION.txt'),
  description
);

console.log(`Generated STORE_DESCRIPTION.txt for v${version}`);
console.log(`Character count: ${description.length}`);
