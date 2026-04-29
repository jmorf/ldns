import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { lookupAsn } from '@ldns/core/asn-query';
import { isIPv4, isIPv6 } from '@ldns/core/ptr';

const handler = createHandler({
  endpoint: 'asn',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const ip = url.searchParams.get('ip');
    if (!ip) throw error(400, 'Missing ip parameter');
    if (!isIPv4(ip) && !isIPv6(ip)) throw error(400, 'Invalid IP address');

    const info = await lookupAsn(ip);
    return { ok: true as const, ...info };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
