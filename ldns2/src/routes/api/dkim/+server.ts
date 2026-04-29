import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isPlausibleDomain } from '$lib/server/ssrf';
import { queryDkim } from '@ldns/core/dkim-query';

const handler = createHandler({
  endpoint: 'dkim',
  cache: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    if (!isPlausibleDomain(domain)) throw error(400, 'Invalid domain format');

    const data = await queryDkim(domain, 'cloudflare');
    return { ok: true as const, domain, ...data };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
