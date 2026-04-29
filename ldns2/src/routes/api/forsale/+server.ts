import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isPlausibleDomain } from '$lib/server/ssrf';
import { checkForSale } from '$lib/forsale';

const handler = createHandler({
  endpoint: 'forsale',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url, platform }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    if (!isPlausibleDomain(domain)) throw error(400, 'Invalid domain format');

    const dynadotApiKey = platform?.env?.DYNADOT_API_KEY;
    return await checkForSale(domain.toLowerCase().trim(), { dynadotApiKey });
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
