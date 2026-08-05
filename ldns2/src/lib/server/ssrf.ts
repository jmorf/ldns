/**
 * SSRF guard for the /api/server endpoint.
 *
 * The proxy fetches arbitrary user-supplied domains. Without these checks an
 * attacker could point us at internal Cloudflare infrastructure, RFC1918
 * addresses, or .local/.internal hosts. We block:
 *
 *   - obviously bogus inputs (non-domain strings, IP literals)
 *   - reserved / loopback / private / CGNAT / link-local IPv4 + IPv6 ranges
 *     after DNS resolution
 *   - .local, .internal, .arpa, .test, .invalid, .localhost TLDs
 *
 * Resolution uses Cloudflare DoH (1.1.1.1) so it works inside Workers.
 */

const FORBIDDEN_TLDS = new Set([
  'local',
  'internal',
  'arpa',
  'test',
  'invalid',
  'localhost',
  'example',
  'onion'
]);

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function isPlausibleDomain(input: string): boolean {
  if (!input || input.length > 253) return false;
  if (!DOMAIN_RE.test(input)) return false;
  const tld = input.toLowerCase().split('.').pop()!;
  return !FORBIDDEN_TLDS.has(tld);
}

function ipv4InRange(ip: string, range: [string, number]): boolean {
  const [base, bits] = range;
  const ipNum = ipv4ToInt(ip);
  const baseNum = ipv4ToInt(base);
  if (ipNum === null || baseNum === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipNum & mask) === (baseNum & mask);
}

function ipv4ToInt(ip: string): number | null {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  const [, a, b, c, d] = m.map(Number);
  if ([a, b, c, d].some((n) => n < 0 || n > 255)) return null;
  return (a * 256 ** 3 + b * 256 ** 2 + c * 256 + d) >>> 0;
}

const PRIVATE_IPV4: Array<[string, number]> = [
  ['0.0.0.0', 8], // current network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // reserved
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4] // reserved
];

export function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4.some((range) => ipv4InRange(ip, range));
}

/**
 * Expand an IPv6 literal (optionally with an embedded IPv4 tail such as
 * `::ffff:1.2.3.4`) into its eight 16-bit hextets. Returns null for syntax we
 * don't recognise, so callers can fall back to a conservative prefix check.
 */
function expandIPv6(ip: string): number[] | null {
  let s = ip.trim().toLowerCase();
  // Drop a zone id (e.g. fe80::1%eth0) — irrelevant for range checks.
  const pct = s.indexOf('%');
  if (pct !== -1) s = s.slice(0, pct);
  if (s === '') return null;

  // Fold a trailing dotted-quad IPv4 (::ffff:1.2.3.4) into two hextets.
  const v4 = s.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4) {
    const n = ipv4ToInt(v4[1]);
    if (n === null) return null;
    s = s.slice(0, v4.index) + ((n >>> 16) & 0xffff).toString(16) + ':' + (n & 0xffff).toString(16);
  }

  const halves = s.split('::');
  if (halves.length > 2) return null;

  const parseGroups = (part: string): number[] | null => {
    if (part === '') return [];
    const out: number[] = [];
    for (const g of part.split(':')) {
      if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
      out.push(parseInt(g, 16));
    }
    return out;
  };

  const head = parseGroups(halves[0]);
  const tail = halves.length === 2 ? parseGroups(halves[1]) : [];
  if (head === null || tail === null) return null;

  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    return [...head, ...new Array(fill).fill(0), ...tail];
  }
  return head.length === 8 ? head : null;
}

export function isPrivateIPv6(ip: string): boolean {
  const h = expandIPv6(ip);
  if (!h) {
    // Conservative fallback for exotic-but-valid forms we failed to parse.
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // ULA fc00::/7
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // link-local fe80::/10
    return false;
  }

  const [h0, h1, h2, h3, h4, h5, h6, h7] = h;

  // Unspecified :: and loopback ::1
  if (h.every((x) => x === 0)) return true;
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0 && h6 === 0 && h7 === 1) return true;

  if ((h0 & 0xfe00) === 0xfc00) return true; // unique-local fc00::/7
  if ((h0 & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((h0 & 0xffc0) === 0xfec0) return true; // deprecated site-local fec0::/10

  // Embedded-IPv4 forms: re-check the trailing 32 bits as IPv4.
  const intToV4 = (n: number) =>
    [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
  const tailV4 = intToV4((((h6 << 16) >>> 0) + h7) >>> 0);

  // IPv4-mapped ::ffff:0:0/96 and IPv4-compatible ::/96 (e.g. ::127.0.0.1)
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0) {
    if (h5 === 0xffff) return isPrivateIPv4(tailV4);
    if (h5 === 0 && (h6 !== 0 || h7 !== 0)) return isPrivateIPv4(tailV4);
  }
  // NAT64 well-known prefix 64:ff9b::/96
  if (h0 === 0x0064 && h1 === 0xff9b && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
    return isPrivateIPv4(tailV4);
  }
  // 6to4 2002::/16 embeds the IPv4 in hextets 2 and 3.
  if (h0 === 0x2002) {
    return isPrivateIPv4(intToV4((((h1 << 16) >>> 0) + h2) >>> 0));
  }

  return false;
}

/** Resolve A + AAAA via Cloudflare DoH and reject if any record is private. */
export async function ensurePublicHost(domain: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isPlausibleDomain(domain)) return { ok: false, reason: 'Invalid domain format' };

  const doh = (type: 'A' | 'AAAA') =>
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: { Accept: 'application/dns-json' }
    });

  let aRes: Response, aaaaRes: Response;
  try {
    [aRes, aaaaRes] = await Promise.all([doh('A'), doh('AAAA')]);
  } catch {
    return { ok: false, reason: 'DNS resolution failed' };
  }

  type AnswerRow = { type: number; data: string };
  type DohResp = { Status?: number; Answer?: AnswerRow[] };

  const ips: string[] = [];
  for (const res of [aRes, aaaaRes]) {
    if (!res.ok) continue;
    const json = (await res.json()) as DohResp;
    for (const a of json.Answer || []) {
      if (a.type === 1 || a.type === 28) ips.push(a.data);
    }
  }

  if (ips.length === 0) return { ok: false, reason: 'Domain does not resolve' };

  for (const ip of ips) {
    if (ip.includes(':')) {
      if (isPrivateIPv6(ip)) return { ok: false, reason: 'Refusing to fetch private/internal address' };
    } else if (isPrivateIPv4(ip)) {
      return { ok: false, reason: 'Refusing to fetch private/internal address' };
    }
  }

  return { ok: true };
}

/**
 * Synchronous guard for a URL the proxy is about to fetch — including every
 * redirect hop. Unlike `ensurePublicHost` (one DoH lookup on the *initial*
 * domain) this runs without network I/O, so it's cheap enough to call inside a
 * redirect-follow loop. It rejects:
 *
 *   - non-HTTP(S) schemes (file:, gopher:, data:, …)
 *   - IP-literal hosts in private / loopback / link-local / CGNAT ranges —
 *     defeating `Location: http://169.254.169.254/`, `http://127.0.0.1/`, and
 *     their octal/hex/decimal encodings (the WHATWG URL parser normalises
 *     those to dotted-decimal before we read `.hostname`)
 *   - forbidden internal TLDs (.local, .internal, …)
 *
 * It deliberately does NOT re-resolve hostnames (that would add a DoH round
 * trip per hop). A redirect to a *hostname* that resolves to a private address
 * is a residual the Cloudflare Workers runtime already blocks at the network
 * layer (Workers cannot route to RFC1918 / loopback).
 *
 * Throws on a disallowed target so it can abort an in-progress fetch chain.
 */
export function assertRedirectTarget(rawUrl: string): void {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new Error('Refusing to fetch malformed URL');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`Refusing to fetch non-HTTP(S) URL (${u.protocol})`);
  }

  let host = u.hostname.toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);

  if (ipv4ToInt(host) !== null) {
    if (isPrivateIPv4(host)) throw new Error('Refusing to fetch private/internal address');
    return;
  }
  if (host.includes(':')) {
    if (isPrivateIPv6(host)) throw new Error('Refusing to fetch private/internal address');
    return;
  }
  const tld = host.split('.').pop() ?? '';
  if (FORBIDDEN_TLDS.has(tld)) throw new Error('Refusing to fetch internal host');
}
