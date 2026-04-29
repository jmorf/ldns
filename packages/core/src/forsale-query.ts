import type { ForSaleResult } from './types';

const FORSALE_API = 'https://ldns.com/api/forsale';

/**
 * Check if a domain is listed for sale via the ldns.com API
 * @param domain The domain to check
 * @returns For-sale result with marketplace listings
 */
export async function checkForSale(domain: string): Promise<ForSaleResult> {
  const normalizedDomain = domain.toLowerCase().trim();

  const url = new URL(FORSALE_API);
  url.searchParams.set('domain', normalizedDomain);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`For-sale check failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as ForSaleResult;
  return data;
}
