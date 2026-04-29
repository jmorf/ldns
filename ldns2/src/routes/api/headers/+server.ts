import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf';
import { fetchServerInfo } from '@ldns/core/server-info';

const handler = createHandler({
  endpoint: 'headers',
  cache: 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);

    const info = await fetchServerInfo(domain);
    return {
      ok: true as const,
      domain,
      url: info.url,
      status: info.status,
      headers: info.headers
    };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
