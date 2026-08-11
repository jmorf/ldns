import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf';
import { classifyUpstreamError } from '$lib/server/upstream-errors';
import { fetchTlsCertificate } from '@ldns/core/tls-query';

const handler = createHandler({
  endpoint: 'tls',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);

    try {
      const cert = await fetchTlsCertificate(domain);
      if (!cert) {
        return {
          ok: false as const,
          domain,
          reason: 'no-results' as const,
          error: 'No certificate found in Certificate Transparency logs for this domain. Either no public certificate has ever been issued, or the domain is too new to have been logged. crt.sh is the only source. There is no backup search.'
        };
      }
      return { ok: true as const, domain, certificate: cert };
    } catch (err) {
      const failure = classifyUpstreamError(err, { service: 'crt.sh', notFoundIsEmpty: true });
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
