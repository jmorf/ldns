import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf';
import type { ForSaleResult } from '@ldns/core/types';

/**
 * Marketplace lookups run in a separate private Worker (`workers/forsale`),
 * reached through the FORSALE service binding. That Worker holds the Dynadot
 * API key and enforces a global daily spend ceiling, so the paid call has a
 * single chokepoint and the key never sits in this Worker's environment.
 *
 * When the binding is absent — a fork, or local dev without the Worker running
 * — this endpoint returns an empty listing set instead of failing. The for-sale
 * badge simply doesn't appear; nothing else breaks.
 */
const handler = createHandler({
  endpoint: 'forsale',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url, platform }): Promise<ForSaleResult> {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');

    const normalized = domain.toLowerCase().trim();

    // The marketplace check fetches the domain itself (parking-page
    // fingerprinting), so verify the resolved IP is public before handing it
    // to the Worker — an internal address must never be fetched on our behalf.
    const guard = await ensurePublicHost(normalized);
    if (!guard.ok) throw error(400, guard.reason);

    const forsale = platform?.env?.FORSALE;
    if (!forsale) {
      return { domain: normalized, listings: [], checkedAt: new Date().toISOString() };
    }

    const res = await forsale.fetch(
      `https://forsale/?domain=${encodeURIComponent(normalized)}`
    );
    if (!res.ok) {
      return { domain: normalized, listings: [], checkedAt: new Date().toISOString() };
    }
    return (await res.json()) as ForSaleResult;
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
