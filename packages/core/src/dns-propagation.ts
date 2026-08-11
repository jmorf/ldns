import type { DnsData, DnsEndpoint, PropagationResult, ProviderLatency } from './types';
import { queryDns } from './dns-query';
import { DEFAULT_RECORD_TYPES } from './constants';

export const ALL_ENDPOINTS: DnsEndpoint[] = ['cloudflare', 'google', 'dns-sb'];

export interface PropagationData {
  results: PropagationResult;
  latencies: ProviderLatency[];
  /**
   * Providers that could not be reached at all. Consumers must exclude these
   * from mismatch comparisons. A dead provider is an outage, not evidence
   * that records haven't propagated.
   */
  unreachable: DnsEndpoint[];
}

/**
 * Query all DoH providers in parallel for the same domain and record types.
 * Returns per-provider results plus per-provider latency in ms.
 */
export async function queryAllProviders(
  domain: string,
  recordTypes: string[] = DEFAULT_RECORD_TYPES,
  signal?: AbortSignal
): Promise<PropagationData> {
  const results = await Promise.all(
    ALL_ENDPOINTS.map(async (endpoint) => {
      const start = performance.now();
      try {
        const data = await queryDns(domain, recordTypes, undefined, endpoint, signal);
        const ms = Math.round(performance.now() - start);
        return { endpoint, data, ms, failed: false };
      } catch {
        return { endpoint, data: {} as DnsData, ms: null, failed: true };
      }
    })
  );

  const acc: PropagationResult = {} as PropagationResult;
  const latencies: ProviderLatency[] = [];
  const unreachable: DnsEndpoint[] = [];
  for (const r of results) {
    acc[r.endpoint] = r.data;
    latencies.push({ endpoint: r.endpoint, ms: r.ms });
    if (r.failed) unreachable.push(r.endpoint);
  }
  return { results: acc, latencies, unreachable };
}
