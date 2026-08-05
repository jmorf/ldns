# Privacy Policy for LDNS - DNS & Domain Tools

**Last Updated:** 2026-04-28

## Overview

LDNS is a browser extension that provides DNS, WHOIS/RDAP, email security, server, and subdomain lookups. We are committed to protecting your privacy and being transparent about every place a piece of data could leave your browser.

## What we do not collect

- We do **not** collect any personal information
- We do **not** track your browsing history
- We do **not** use analytics or tracking services
- We do **not** require an account
- We do **not** sell or share data with third parties

## What stays on your device

The following data is stored locally using the browser's storage API and never leaves your machine:

- **Recent searches** — the last 10 domains you've looked up, for convenience
- **Preferences** — selected DNS provider and theme
- **Settings** — an opt-in flag for the marketplace (for-sale) check, plus UI preferences (side-panel mode, fun loading messages, grain overlay)
- **In-memory query cache** — short-lived (≤30s) cache of the most recent lookup, cleared when the popup closes

You can clear recent searches at any time from inside the extension.

## Third-party services we contact

When you perform a lookup, the queried **domain name** (and only the domain name) is sent to one or more of the following endpoints. No additional information is included.

| Service | When | Purpose | Privacy Policy |
|---------|------|---------|----------------|
| Cloudflare DNS (`cloudflare-dns.com`) | DNS queries | DoH lookups for A/AAAA/MX/TXT/etc. | [cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/) |
| Google Public DNS (`dns.google`) | When selected | DoH lookups | [policies.google.com/privacy](https://policies.google.com/privacy) |
| DNS.SB (`doh.dns.sb`) | When selected | DoH lookups | [dns.sb/privacy](https://dns.sb/privacy/) |
| RDAP.org (`rdap.org`) | RDAP lookup | Modern WHOIS replacement | Public RDAP bootstrap |
| crt.sh | Subdomain discovery | Certificate Transparency logs | [crt.sh/about](https://crt.sh) |
| Team Cymru (`asn.cymru.com`) | ASN/origin lookup | IP-to-ASN mapping (DNS-only) | [team-cymru.com](https://www.team-cymru.com) |
| Target server (any URL) | Server-info tab | HTTP HEAD/GET to read response headers | — |
| HSTS preload list (`hstspreload.org`) | HSTS check | Public preload database | [hstspreload.org](https://hstspreload.org) |

## Opt-in feature that contacts ldns.com

One feature contacts our backend, and it can be toggled on/off in Settings:

| Feature | What is sent | Why | Endpoint |
|---|---|---|---|
| Marketplace listing check | Domain name | Detect public marketplace listings (Afternic, Dynadot) and surface a "For Sale" chip / RDAP-tab banner | `https://ldns.com/api/forsale` |

We do not store, log, or otherwise record these requests beyond standard request-level operational logging that's purged on a rolling basis. Toggling this feature off in Settings stops all traffic to `ldns.com` immediately.

## Host permissions

The extension declares specific host permissions for the named services above, plus `<all_urls>`. The latter is required so the **Server Info** tab can fetch headers from any domain you look up — it is only used during an active lookup; no background or page-content access happens.

## Permissions explained

| Permission | Why |
|------------|-----|
| `activeTab` | Read the current tab's URL to auto-populate the domain field |
| `storage` | Save your preferences and recent searches locally |
| `sidePanel` | (Chrome) Open LDNS in the browser side panel when you enable side-panel mode |
| `host_permissions` | Query DNS providers and fetch server information |

## Data security

- All DNS queries use encrypted DNS-over-HTTPS (DoH)
- Manifest V3 with a strict Content Security Policy (`script-src 'self'; object-src 'self'`)
- No data is transmitted to LDNS servers unless you opt in to the marketplace (for-sale) feature
- Preferences are stored using the browser's secure local storage API

## Your rights

You can:
- Clear your recent searches at any time within the extension
- Disable for-sale and WHOIS-fallback features in Settings
- Uninstall the extension to remove all locally stored data
- Use the extension without any account or registration

## Changes to this policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date above.

## Contact

For privacy concerns or questions, please visit [ldns.com](https://ldns.com).

---

**Summary:** LDNS is a privacy-focused tool. The default configuration sends nothing to LDNS-owned servers — every DNS, RDAP and CT-log query goes directly to the corresponding public service. One narrow opt-in feature (the marketplace / for-sale check) contacts `ldns.com` and is disabled by default.
