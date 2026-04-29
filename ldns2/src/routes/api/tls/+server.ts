import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf';
import { fetchTlsCertificate } from '@ldns/core/tls-query';

const handler = createHandler({
  endpoint: 'tls',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);

    const cert = await fetchTlsCertificate(domain);
    if (!cert) {
      return { ok: false as const, domain, error: 'No certificate found in CT logs' };
    }
    return { ok: true as const, domain, certificate: cert };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
