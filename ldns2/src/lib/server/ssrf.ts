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

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  // ULA fc00::/7
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  // IPv4-mapped ::ffff:x.x.x.x — recurse via embedded IPv4
  const v4mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateIPv4(v4mapped[1]);
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
