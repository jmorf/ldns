import { queryDns } from './dns-query';

const ipv4Re = /^\d+\.\d+\.\d+\.\d+$/;
const ipv6Re = /^[0-9a-f:]+$/i;

export function reverseIPv4(ip: string): string {
  return ip.split('.').reverse().join('.') + '.in-addr.arpa';
}

export function reverseIPv6(ip: string): string {
  // Expand "::" to full 8 groups
  const groups = ip.toLowerCase().split('::');
  let head: string[] = groups[0] ? groups[0].split(':') : [];
  let tail: string[] = groups[1] ? groups[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  const fullGroups = [...head, ...new Array(missing).fill('0'), ...tail];
  // Pad each group to 4 hex chars
  const expanded = fullGroups.map((g) => g.padStart(4, '0')).join('');
  // Reverse nibble-by-nibble, dot-separated, append ip6.arpa
  return expanded.split('').reverse().join('.') + '.ip6.arpa';
}

export function isIPv4(ip: string): boolean {
  return ipv4Re.test(ip);
}

export function isIPv6(ip: string): boolean {
  return ip.includes(':') && ipv6Re.test(ip);
}

/**
 * Look up PTR records for a list of IPs in parallel.
 * Returns a map of IP → hostname (empty string if no PTR found).
 * Uses Cloudflare for PTR queries (well-cached, fast, global).
 */
export async function lookupPtrBatch(ips: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const lookups = ips.map(async (ip) => {
    const reversed = isIPv4(ip)
      ? reverseIPv4(ip)
      : isIPv6(ip)
        ? reverseIPv6(ip)
        : null;
    if (!reversed) {
      result[ip] = '';
      return;
    }
    try {
      const ptr = await queryDns(reversed, ['PTR'], undefined, 'cloudflare');
      result[ip] = ptr.PTR?.[0]?.data || '';
    } catch {
      result[ip] = '';
    }
  });
  await Promise.all(lookups);
  return result;
}
