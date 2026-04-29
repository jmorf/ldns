import type { DnsData, DnsEndpoint, PropagationResult, ProviderLatency } from './types';
import { queryDns } from './dns-query';
import { DEFAULT_RECORD_TYPES } from './constants';

const ALL_ENDPOINTS: DnsEndpoint[] = ['cloudflare', 'google', 'dns-sb'];

export interface PropagationData {
  results: PropagationResult;
  latencies: ProviderLatency[];
}

/**
 * Query all DoH providers in parallel for the same domain and record types.
 * Returns per-provider results plus per-provider latency in ms.
 */
export async function queryAllProviders(
  domain: string,
  recordTypes: string[] = DEFAULT_RECORD_TYPES
): Promise<PropagationData> {
  const results = await Promise.all(
    ALL_ENDPOINTS.map(async (endpoint) => {
      const start = performance.now();
      try {
        const data = await queryDns(domain, recordTypes, undefined, endpoint);
        const ms = Math.round(performance.now() - start);
        return { endpoint, data, ms };
      } catch {
        return { endpoint, data: {} as DnsData, ms: null };
      }
    })
  );

  const acc: PropagationResult = {} as PropagationResult;
  const latencies: ProviderLatency[] = [];
  for (const r of results) {
    acc[r.endpoint] = r.data;
    latencies.push({ endpoint: r.endpoint, ms: r.ms });
  }
  return { results: acc, latencies };
}
