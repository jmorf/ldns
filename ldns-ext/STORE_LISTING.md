# Chrome Web Store Listing

## Extension Name
LDNS - DNS & Domain Tools

## Short Description (132 characters max)
Instant DNS records, WHOIS data, email security analysis & server info for any domain. Fast, private, no tracking.

## Detailed Description

**LDNS is the essential toolkit for web developers, IT professionals, and security researchers who need quick access to domain information.**

### DNS Records
Instantly look up any DNS record type including A, AAAA, MX, TXT, NS, SOA, and CAA. Choose from multiple encrypted DNS-over-HTTPS providers:
- Cloudflare (1.1.1.1)
- Google (8.8.8.8)
- OpenDNS (Cisco)

Filter results by record type and copy values with one click.

### WHOIS / RDAP Data
Get comprehensive domain registration information:
- Registrar and registration dates
- Domain expiration date
- Nameservers
- DNSSEC status
- Domain status codes (clientTransferProhibited, etc.)

### Email Security Analysis
Analyze a domain's email configuration:
- MX records with provider detection (Google Workspace, Microsoft 365, etc.)
- SPF record parsing with mechanism breakdown
- DMARC policy analysis (policy, alignment, reporting)
- BIMI and MTA-STS detection

### Server Information
Analyze web server configuration:
- HTTP response status and headers
- Server software detection
- Response time measurement
- Full redirect chain tracing
- Option to trace from HTTP to see HTTPS upgrades
- Cache headers and CDN detection

### Privacy First
- No accounts or sign-up required
- No data collection or tracking
- No analytics
- All queries use encrypted DNS-over-HTTPS
- Recent searches stored locally only

### How It Works
1. Click the LDNS icon in your toolbar
2. The current tab's domain is automatically loaded
3. View DNS, WHOIS, Email, and Server info across tabs
4. Toggle between dark and light themes

### Perfect For
- Web developers debugging DNS issues
- IT administrators verifying domain configuration
- Security researchers analyzing email authentication
- SEO professionals checking domain details
- Anyone who needs quick domain lookups

---

## Category
Developer Tools

## Language
English

## Privacy Practices
See PRIVACY.md - No data collection

---

## Required Store Assets

### Screenshots (1280x800 or 640x400)
1. DNS tab showing records for a popular domain
2. RDAP/WHOIS tab with registration details
3. Email tab showing SPF/DMARC analysis
4. Server tab with redirect chain
5. Light mode view

### Promotional Images
- Small promo tile: 440x280
- Large promo tile: 920x680 (optional)
- Marquee promo tile: 1400x560 (optional)

### Icon
- 128x128 PNG (already have this)

---

## Justification for Permissions

**activeTab**: Required to read the URL of the current tab so we can auto-populate the domain field when the popup opens. We only read the hostname, not page content.

**storage**: Required to save user preferences (selected DNS provider, theme) and recent search history locally in the browser. No data is synced or transmitted.

**host_permissions (<all_urls>)**: Required for the Server Info feature which needs to make HTTP HEAD requests to any domain the user looks up. This allows us to:
- Fetch HTTP headers from the target domain
- Trace redirect chains (e.g., www → non-www, HTTP → HTTPS)
- Measure response times

The extension only accesses domains that the user explicitly looks up - it never accesses websites in the background.

---

## Version History

### v1.4.0 (Current)
- Added Server tab with redirect tracing
- Added dark/light theme toggle
- Added OpenDNS as DNS provider option
- Improved redirect chain visualization
- 30-second timeout with loading messages
- Multiple bug fixes and UI improvements

### v1.0.0
- Initial release
- DNS, RDAP, Email tabs
- Cloudflare and Google DNS support
- Recent searches
