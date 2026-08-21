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

// Store-facing release notes. Only the newest RECENT_RELEASES versions are
// published, the Chrome Web Store flags long stacked changelogs as spammy.
// Full history lives in CHANGELOG.md. When you ship a version, add it to the
// top of this list and delete anything beyond the newest few.
const RECENT_RELEASES = 2;
const releases = [
  {
    version: '1.8.3',
    notes: [
      'WHOIS/RDAP lookups are much faster and more reliable: LDNS now queries each registry\'s own RDAP server directly (using IANA\'s public directory) instead of going through the rdap.org proxy, which had become slow and flaky. Registries without RDAP (like .de) now say so immediately.'
    ]
  },
  {
    version: '1.8.2',
    notes: [
      'RDAP lookups for slow registries (some ccTLDs like .br) no longer time out: the registry data was arriving, just after our cutoff. The timeout now allows for rdap.org\'s occasional slow first answer.',
      'After a week of regular use, LDNS asks once whether you would like to rate it or send feedback. Three clicks of "Later" and it never asks again.'
    ]
  },
  {
    version: '1.8.1',
    notes: [
      'Fixed: the extension follows the tab you are on again, and the side panel now updates as you browse.',
      'Subdomain lookups are more reliable when crt.sh is having problems, and failures now explain what went wrong. You can add your own CertSpotter API key in Settings to remove the free-tier limit.'
    ]
  },
  {
    version: '1.8.0',
    notes: [
      'LDNS is now open source. The full extension and website source is at github.com/jmorf/ldns (MIT). You can read exactly what it does with your lookups.',
      'Removed the marketplace ("For Sale") check, with it goes the last feature that contacted an LDNS server. The extension now has no backend: every lookup goes straight from your browser to public DNS and registry services.'
    ]
  },
  {
    version: '1.7.11',
    notes: [
      'Reliability hardening: every lookup now has a timeout, network outages show a clear error instead of "no records", international (IDN) domains work, long TXT records (SPF/DKIM) display correctly, and Refresh always fetches fresh data.'
    ]
  },
  {
    version: '1.7.10',
    notes: [
      'Report a bug / send feedback, links in Settings and the popup footer open a prefilled GitHub issue. Nothing is sent until you submit it.'
    ]
  }
];

if (releases[0]?.version !== version) {
  console.warn(
    `WARNING: newest release note is v${releases[0]?.version} but package.json is v${version}: update the releases list in scripts/generate-store-description.js`
  );
}

const changelog = releases
  .slice(0, RECENT_RELEASES)
  .map((r) => `v${r.version}\n${r.notes.map((n) => `• ${n}`).join('\n')}`)
  .join('\n\n');

const description = `LDNS puts a complete DNS and domain toolkit one click away: DNS records, WHOIS/RDAP registration data, email authentication, server details, and subdomain discovery. It works on the site you're already on, or any domain you type.

WHAT IT DOES

• DNS lookups over encrypted DNS-over-HTTPS, with a choice of three public resolvers and a Compare view that highlights propagation mismatches between them
• Reverse DNS and origin-network (ASN) details shown inline next to each address
• WHOIS/RDAP registration data with domain age, expiry countdown, and DNSSEC status
• Email security check-up covering SPF, DMARC, DKIM, BIMI, and MTA-STS, with the sending provider detected automatically
• Server insights: response headers, redirect-chain tracing, response time, a security-headers audit, HTTP/3 detection, and identification of the technology stack behind the site
• Subdomain discovery by scanning Certificate Transparency logs
• Click-to-copy on every value, CSV/JSON export, side-panel mode, system/light/dark theme, and deep links to full reports on ldns.com

PRIVACY

No accounts, no analytics, no tracking, no backend. Every lookup goes directly from your browser to public DNS, registry, and Certificate Transparency services. Nothing is ever sent to an LDNS server. Recent searches are stored only on your device. And you don't have to take my word for it: the source is public at github.com/jmorf/ldns. Full policy: ldns.com/extension/privacy

WHAT'S NEW

${changelog}

LINKS

Website: ldns.com
Privacy policy: ldns.com/extension/privacy
Source code and issues: github.com/jmorf/ldns
Contact: @jmorf on X
`;

// Write the description
fs.writeFileSync(
  path.join(__dirname, '../STORE_DESCRIPTION.txt'),
  description
);

console.log(`Generated STORE_DESCRIPTION.txt for v${version}`);
console.log(`Character count: ${description.length}`);
