import type { DnsData, DnsRecordResult, DnsResponse, DnsRecord, DnsEndpoint } from './types';
import { DNS_ENDPOINTS, DEFAULT_RECORD_TYPES } from './constants';
import { fetchWithTimeout } from './fetch-utils';
import { toAsciiDomain } from './domain-parser';

const DNS_TIMEOUT_MS = 10_000;

/**
 * Normalize a TXT record value from DoH JSON.
 *
 * Records longer than 255 bytes arrive as multiple quoted strings,
 * Cloudflare and DNS.SB return them as `"chunk1" "chunk2"` while Google
 * pre-joins them. RFC 7208 §3.3 requires concatenation with no separator,
 * so join the chunks and strip the outer quotes; otherwise long SPF records
 * and 2048-bit DKIM keys are garbled with quote litter mid-value.
 */
function normalizeTxt(data: string): string {
  const t = data.trim();
  if (!t.startsWith('"')) return t;
  return t.replace(/^"|"$/g, '').replace(/"\s+"/g, '');
}

/**
 * Query DNS records for a domain using DNS-over-HTTPS
 * @param domain The domain to query
 * @param recordTypes Array of specific record types to query
 * @param subdomain Optional subdomain to prepend to the query
 * @param endpoint The DNS over HTTPS endpoint to use
 * @param signal Optional AbortSignal so callers can cancel in-flight queries
 * @returns Object with results indexed by record type
 * @throws when every record type fails at the transport layer (endpoint
 *   unreachable / non-2xx / non-JSON). An outage must not masquerade as
 *   "this domain has no records". Partial failures degrade gracefully.
 */
export async function queryDns(
  domain: string,
  recordTypes: string[] = DEFAULT_RECORD_TYPES,
  subdomain?: string,
  endpoint: DnsEndpoint = 'cloudflare',
  signal?: AbortSignal
): Promise<DnsData> {
  // Punycode IDN input, DoH endpoints reject raw Unicode query names.
  const asciiDomain = toAsciiDomain(domain);
  const queryDomain = subdomain ? `${subdomain}.${asciiDomain}` : asciiDomain;
  const endpointUrl = DNS_ENDPOINTS[endpoint].url;

  const queries = recordTypes.map(async (type: string) => {
    try {
      const url = new URL(endpointUrl);
      url.searchParams.append('name', queryDomain);
      url.searchParams.append('type', type);

      const response = await fetchWithTimeout(
        url.toString(),
        {
          headers: {
            'Accept': 'application/dns-json',
            'Content-Type': 'application/dns-json'
          },
          signal
        },
        DNS_TIMEOUT_MS
      );

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
            data: type === 'TXT' ? normalizeTxt(record.data) : record.data.replace(/\.$/, ''),
            ttl: record.TTL,
            type: record.type
          }));
      }

      return { type, results, error: null as Error | null };
    } catch (error) {
      return {
        type,
        results: [] as DnsRecordResult[],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  });

  const results = await Promise.all(queries);

  // If every single query failed at the transport layer, the endpoint (or the
  // network) is down, throw instead of returning what looks like an empty zone.
  if (results.length > 0 && results.every((r) => r.error !== null)) {
    throw new Error(`DNS lookup failed, could not reach ${DNS_ENDPOINTS[endpoint].name} (${results[0].error?.message})`);
  }

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
