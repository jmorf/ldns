import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf';
import { checkForSale } from '$lib/forsale';

const handler = createHandler({
  endpoint: 'forsale',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url, platform }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    // checkForSale now does its own outbound HTTP fetch to the user-supplied
    // domain (parking-page fingerprinting), so we have to verify the resolved
    // IP is public — not an internal Cloudflare host or RFC1918 address.
    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);

    const dynadotApiKey = platform?.env?.DYNADOT_API_KEY;
    return await checkForSale(domain.toLowerCase().trim(), { dynadotApiKey });
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
