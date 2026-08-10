import type { AsnInfo } from './types';
import { queryDns } from './dns-query';
import { isIPv4, isIPv6, reverseIPv4, reverseIPv6 } from './ptr';

/**
 * Look up origin ASN for an IP using Team Cymru's IP-to-ASN DNS service.
 *
 *   IPv4: <reversed>.origin.asn.cymru.com  TXT
 *   IPv6: <reversed>.origin6.asn.cymru.com TXT
 *
 * The TXT record format:
 *   "ASN | IP_PREFIX | CC | RIR | DATE"
 *
 * Then a second lookup against AS<n>.asn.cymru.com gives the AS name:
 *   "ASN | CC | RIR | DATE | AS_NAME"
 *
 * Reference: team-cymru.com/community-services/ip-asn-mapping
 */
function asnZone(ip: string): string | null {
  if (isIPv4(ip)) {
    const reversed = reverseIPv4(ip).replace(/\.in-addr\.arpa$/, '');
    return `${reversed}.origin.asn.cymru.com`;
  }
  if (isIPv6(ip)) {
    const reversed = reverseIPv6(ip).replace(/\.ip6\.arpa$/, '');
    return `${reversed}.origin6.asn.cymru.com`;
  }
  return null;
}

function unquote(s: string): string {
  return s.replace(/^"(.+)"$/, '$1');
}

async function queryAsnTxt(name: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const result = await queryDns(name, ['TXT'], undefined, 'cloudflare', signal);
    const first = result.TXT?.[0]?.data;
    return first ? unquote(first) : null;
  } catch {
    return null;
  }
}

export async function lookupAsn(ip: string, signal?: AbortSignal): Promise<AsnInfo> {
  const zone = asnZone(ip);
  const empty: AsnInfo = { ip, asn: null, asName: null, country: null, prefix: null };
  if (!zone) return empty;
  const txt = await queryAsnTxt(zone, signal);
  if (!txt) return empty;
  const parts = txt.split('|').map((p) => p.trim());
  // Multi-origin ASN may appear as "X Y Z" — take the first.
  const asn = parts[0]?.split(/\s+/)[0];
  const prefix = parts[1] || null;
  const country = parts[2] || null;
  const asnNum = asn ? parseInt(asn, 10) : NaN;
  if (!Number.isFinite(asnNum)) return { ...empty, prefix, country };

  // Look up the AS name (best-effort)
  let asName: string | null = null;
  const nameTxt = await queryAsnTxt(`AS${asnNum}.asn.cymru.com`, signal);
  if (nameTxt) {
    const nparts = nameTxt.split('|').map((p) => p.trim());
    asName = nparts[4] || null;
    // Trim trailing ", US" style country tag from the AS name if present
    if (asName) asName = asName.replace(/,\s*[A-Z]{2}\s*$/, '');
  }

  return { ip, asn: asnNum, asName, country, prefix };
}

export async function lookupAsnBatch(ips: string[], signal?: AbortSignal): Promise<Record<string, AsnInfo>> {
  const result: Record<string, AsnInfo> = {};
  await Promise.all(
    ips.map(async (ip) => {
      result[ip] = await lookupAsn(ip, signal);
    })
  );
  return result;
}
