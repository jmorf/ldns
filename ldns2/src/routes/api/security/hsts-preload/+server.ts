import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isPlausibleDomain } from '$lib/server/ssrf';
import { checkHstsPreload } from '@ldns/core/security-checks';

const handler = createHandler({
  endpoint: 'hsts-preload',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    if (!isPlausibleDomain(domain)) throw error(400, 'Invalid domain format');

    const status = await checkHstsPreload(domain);
    return { ok: true as const, domain, status };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
