import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isPlausibleDomain } from '$lib/server/ssrf';
import { queryWhoisServer } from '$lib/whois';

const handler = createHandler({
  endpoint: 'whois',
  limit: { requestsPerMinute: 10 },
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    if (!isPlausibleDomain(domain)) throw error(400, 'Invalid domain format');

    try {
      return await queryWhoisServer(domain);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'WHOIS lookup failed';
      if (message.includes('No WHOIS server found')) throw error(404, message);
      throw error(500, message);
    }
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
