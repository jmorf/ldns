import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isPlausibleDomain } from '$lib/server/ssrf';
import { classifyUpstreamError } from '$lib/server/upstream-errors';
import { discoverSubdomains } from '@ldns/core/subdomain-query';

const handler = createHandler({
  endpoint: 'subdomains',
  // Heavily cached: crt.sh is the slowest and least reliable dependency.
  cache: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    if (!isPlausibleDomain(domain)) throw error(400, 'Invalid domain format');

    try {
      const data = await discoverSubdomains(domain);
      return { ok: true as const, domain, ...data };
    } catch (err) {
      const failure = classifyUpstreamError(err, { service: 'crt.sh', notFoundIsEmpty: true });
      // Return as 200 with ok:false so the response is still cacheable
      // at the edge with the shorter errorCache window in handler.ts.
      return {
        ok: false as const,
        domain,
        reason: failure.reason,
        error: failure.message
      };
    }
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
