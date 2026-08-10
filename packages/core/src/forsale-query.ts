import type { ForSaleResult, ForSaleListing } from './types';
import { fetchWithTimeout } from './fetch-utils';

const FORSALE_API = 'https://ldns.com/api/forsale';

/**
 * Check if a domain is listed for sale via the ldns.com API
 * @param domain The domain to check
 * @param signal Optional AbortSignal so callers can cancel in-flight queries
 * @returns For-sale result with marketplace listings
 */
export async function checkForSale(domain: string, signal?: AbortSignal): Promise<ForSaleResult> {
  const normalizedDomain = domain.toLowerCase().trim();

  const url = new URL(FORSALE_API);
  url.searchParams.set('domain', normalizedDomain);

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      'Accept': 'application/json'
    },
    signal
  }, 10_000);

  if (!response.ok) {
    throw new Error(`For-sale check failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as ForSaleResult;
  return data;
}

/** Format a marketplace listing's price for display. */
export function formatListingPrice(listing: ForSaleListing): string {
  if (!listing.price) return 'Price on request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(listing.price);
}
