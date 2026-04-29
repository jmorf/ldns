import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isPlausibleDomain } from '$lib/server/ssrf';
import { discoverSubdomains } from '@ldns/core/subdomain-query';

/**
 * Map a thrown error from discoverSubdomains() into a structured,
 * cacheable failure response. crt.sh is the only upstream and it
 * goes down or rate-limits often enough that we want clients to
 * render a useful explanation rather than a generic 500.
 */
function classifyError(err: unknown): { reason: string; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes('timed out')) {
    return {
      reason: 'timeout',
      message: 'crt.sh did not respond in time. This usually means the domain has a very large certificate corpus and the public CT log search is overloaded. Try again in a few minutes.'
    };
  }
  if (lower.includes('overloaded') || raw.includes('503')) {
    return {
      reason: 'overloaded',
      message: 'crt.sh is temporarily overloaded by other CT log queries. Try again in a few minutes — the result will be edge-cached for 24 hours once it succeeds.'
    };
  }
  if (raw.includes('502') || raw.includes('504')) {
    return {
      reason: 'bad-gateway',
      message: 'crt.sh returned a gateway error. This is a transient issue with the public Certificate Transparency search service, not your domain. Try again shortly.'
    };
  }
  if (raw.includes('429')) {
    return {
      reason: 'rate-limited',
      message: 'crt.sh rate-limited the request. Wait a minute and try again.'
    };
  }
  return {
    reason: 'unknown',
    message: `Subdomain discovery failed: ${raw}`
  };
}

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
      const { reason, message } = classifyError(err);
      // Return as 200 with ok:false so the response is still cacheable
      // at the edge (a flaky upstream causing every client to hit the
      // origin would defeat the point of having a CDN cache here).
      return {
        ok: false as const,
        domain,
        reason,
        error: message
      };
    }
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
