/**
 * Dynamic OG image generator.
 *
 * Returns a 1200×630 SVG (which OG/Twitter both accept) so we can ship one
 * image per (domain, tool) without any rendering tooling.
 *
 * URL format:
 *   /og/{domain}                  → "DNS lookup for example.com"
 *   /og/{domain}/{tool}           → "{tool}" view, e.g. /og/example.com/server
 *
 * Heavy edge cache; no rate limit (this is bot-traffic-only and immutable).
 */

import type { RequestHandler } from './$types';

const BG = '#0e1116';
const ACCENT = '#fc4e09';
const FG = '#f5f5f4';
const FG_MUTED = '#94a3b8';
const FG_SUBTLE = '#64748b';
const LINE = '#1f2530';

const TOOL_LABEL: Record<string, string> = {
  '': 'DNS records',
  email: 'Email security',
  rdap: 'Domain registration',
  whois: 'WHOIS',
  server: 'Server analysis',
  security: 'Security audit',
  subdomains: 'Subdomain discovery',
  tls: 'TLS certificate',
  asn: 'ASN / origin',
  geo: 'IP geolocation',
  headers: 'HTTP headers',
  'security-headers': 'Security headers',
  dkim: 'DKIM selectors',
  propagation: 'DNS propagation',
  'reverse-dns': 'Reverse DNS',
  ip: 'IP addresses',
  mx: 'MX records',
  ns: 'NS records',
  spf: 'SPF',
  dmarc: 'DMARC',
  caa: 'CAA',
  soa: 'SOA',
  cname: 'CNAME',
  aaaa: 'AAAA',
  a: 'A records',
  txt: 'TXT records'
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function trim(s: string, max = 60): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export const GET: RequestHandler = async ({ params }) => {
  const segments = (params.path || '').split('/').filter(Boolean);
  const domain = segments[0] || 'ldns.com';
  const tool = segments[1] || '';
  const toolLabel = TOOL_LABEL[tool] ?? tool ?? 'DNS records';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#0a0d12"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${LINE}" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.7"/>

  <!-- accent slash, top-left -->
  <rect x="80" y="80" width="6" height="48" fill="${ACCENT}"/>

  <!-- LDNS wordmark -->
  <text x="100" y="118" font-family="ui-monospace, SFMono-Regular, monospace" font-size="22" fill="${FG_MUTED}" letter-spacing="2">LDNS</text>

  <!-- eyebrow -->
  <text x="80" y="240" font-family="ui-monospace, SFMono-Regular, monospace" font-size="22" fill="${FG_SUBTLE}" letter-spacing="1.5">// ${escapeXml(toolLabel)}</text>

  <!-- domain (large) -->
  <text x="80" y="360" font-family="ui-sans-serif, system-ui, sans-serif" font-size="92" font-weight="600" fill="${FG}" letter-spacing="-2">${escapeXml(trim(domain, 32))}</text>

  <!-- tagline -->
  <text x="80" y="430" font-family="ui-sans-serif, system-ui, sans-serif" font-size="34" fill="${FG_MUTED}">DNS · RDAP · email · server · security</text>

  <!-- bottom strip -->
  <rect x="0" y="560" width="1200" height="1" fill="${LINE}"/>
  <text x="80" y="600" font-family="ui-monospace, SFMono-Regular, monospace" font-size="20" fill="${FG_SUBTLE}">ldns.com</text>
  <text x="1120" y="600" text-anchor="end" font-family="ui-monospace, SFMono-Regular, monospace" font-size="20" fill="${ACCENT}">→</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable'
    }
  });
};
