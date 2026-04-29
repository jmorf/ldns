import type { DnsData, DnsRecordResult, DnsResponse, DnsRecord, DnsEndpoint } from './types';
import { DNS_ENDPOINTS, DEFAULT_RECORD_TYPES } from './constants';

/**
 * Query DNS records for a domain using DNS-over-HTTPS
 * @param domain The domain to query
 * @param recordTypes Array of specific record types to query
 * @param subdomain Optional subdomain to prepend to the query
 * @param endpoint The DNS over HTTPS endpoint to use
 * @returns Object with results indexed by record type
 */
export async function queryDns(
  domain: string,
  recordTypes: string[] = DEFAULT_RECORD_TYPES,
  subdomain?: string,
  endpoint: DnsEndpoint = 'cloudflare'
): Promise<DnsData> {
  const queryDomain = subdomain ? `${subdomain}.${domain}` : domain;
  const endpointUrl = DNS_ENDPOINTS[endpoint].url;

  const queries = recordTypes.map(async (type: string) => {
    try {
      const url = new URL(endpointUrl);
      url.searchParams.append('name', queryDomain);
      url.searchParams.append('type', type);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/dns-json',
          'Content-Type': 'application/dns-json'
        }
      });

      if (!response.ok) {
        throw new Error(`DNS query failed with status: ${response.status}`);
      }

      const data = await response.json() as DnsResponse;

      let results: DnsRecordResult[] = [];
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
        // Get the expected type number for filtering (DNS.SB returns RRSIG records too)
        const expectedType = getRecordTypeNumber(type);
        results = data.Answer
          .filter((record: DnsRecord) => record.type === expectedType)
          .map((record: DnsRecord) => ({
            data: record.data.replace(/\.$/, ''),
            ttl: record.TTL,
            type: record.type
          }));
      }

      return { type, results };
    } catch {
      return { type, results: [] as DnsRecordResult[] };
    }
  });

  const results = await Promise.all(queries);
  return results.reduce<DnsData>((acc, { type, results }) => {
    acc[type] = results;
    return acc;
  }, {});
}

/** DNS record type mappings */
const DNS_TYPE_MAP: Record<string, number> = {
  'A': 1,
  'NS': 2,
  'CNAME': 5,
  'SOA': 6,
  'PTR': 12,
  'MX': 15,
  'TXT': 16,
  'AAAA': 28,
  'SRV': 33,
  'DS': 43,
  'RRSIG': 46,
  'NSEC': 47,
  'DNSKEY': 48,
  'TLSA': 52,
  'HTTPS': 65,
  'CAA': 257
};

/**
 * Get the DNS record type number from its name
 */
export function getRecordTypeNumber(typeName: string): number {
  return DNS_TYPE_MAP[typeName.toUpperCase()] || 0;
}

/**
 * Get the DNS record type name from its numeric value
 */
export function getRecordTypeName(typeNumber: number): string {
  for (const [name, num] of Object.entries(DNS_TYPE_MAP)) {
    if (num === typeNumber) return name;
  }
  return `TYPE${typeNumber}`;
}
