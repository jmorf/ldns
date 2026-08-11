# Privacy Policy for LDNS - DNS & Domain Tools

**Last Updated:** 2026-08-10

## Overview

LDNS is a browser extension that provides DNS, WHOIS/RDAP, email security, server, and subdomain lookups. It is built to protect your privacy and to be transparent about every place a piece of data could leave your browser.

## What LDNS does not collect

- Does **not** collect any personal information
- Does **not** track your browsing history
- Does **not** use analytics or tracking services
- Does **not** require an account
- Does **not** sell or share data with third parties

## What stays on your device

The following data is stored locally using the browser's storage API and never leaves your machine:

- **Recent searches**. The last 10 domains you've looked up, for convenience
- **Preferences**: selected DNS provider and theme
- **Settings**: UI preferences (side-panel mode, fun loading messages, grain overlay)
- **In-memory query cache**: short-lived (≤30s) cache of the most recent lookup, cleared when the popup closes

You can clear recent searches at any time from inside the extension.

## Third-party services LDNS contacts

When you perform a lookup, the queried **domain name** (and only the domain name) is sent to one or more of the following endpoints. No additional information is included.

| Service | When | Purpose | Privacy Policy |
|---------|------|---------|----------------|
| Cloudflare DNS (`cloudflare-dns.com`) | DNS queries | DoH lookups for A/AAAA/MX/TXT/etc. | [cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/) |
| Google Public DNS (`dns.google`) | When selected | DoH lookups | [policies.google.com/privacy](https://policies.google.com/privacy) |
| DNS.SB (`doh.dns.sb`) | When selected | DoH lookups | [dns.sb/privacy](https://dns.sb/privacy/) |
| RDAP.org (`rdap.org`) | RDAP lookup | Modern WHOIS replacement | Public RDAP bootstrap |
| crt.sh | Subdomain discovery | Certificate Transparency logs | [crt.sh/about](https://crt.sh) |
| Team Cymru (`asn.cymru.com`) | ASN/origin lookup | IP-to-ASN mapping (DNS-only) | [team-cymru.com](https://www.team-cymru.com) |
| Target server (any URL) | Server-info tab | HTTP HEAD/GET to read response headers |, |
| HSTS preload list (`hstspreload.org`) | HSTS check | Public preload database | [hstspreload.org](https://hstspreload.org) |

## LDNS servers are never contacted

The extension makes **no requests to `ldns.com` or any other LDNS-owned server**. Every lookup goes directly from your browser to the public services listed above. There is no backend, no telemetry, and no account.

The extension does contain links to ldns.com (the header logo and the per-tab "view full report" chips). Those are ordinary links. Nothing is sent unless you click one, which opens the site in a new tab like any other link.

## Host permissions

The extension declares specific host permissions for the named services above, plus `<all_urls>`. The latter is required so the **Server Info** tab can fetch headers from any domain you look up. It is only used during an active lookup; no background or page-content access happens.

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
- No data is transmitted to LDNS servers, ever. There is no backend to send it to
- Preferences are stored using the browser's secure local storage API

## Your rights

You can:
- Clear your recent searches at any time within the extension
- Uninstall the extension to remove all locally stored data
- Use the extension without any account or registration

## Changes to this policy

This privacy policy may be updated from time to time. Any changes will be reflected in the "Last Updated" date above.

## Contact

For privacy concerns or questions, please visit [ldns.com](https://ldns.com).

---

**Summary:** LDNS is a privacy-focused tool. It sends nothing to LDNS-owned servers. Every DNS, RDAP and CT-log query goes directly to the corresponding public service. There is no backend, no account, and no telemetry.
