import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost, assertRedirectTarget } from '$lib/server/ssrf';
import { analyzeServer } from '@ldns/core/server-info';
import { detectTechnologies } from '@ldns/core/tech-detect';
import { auditSecurityHeaders, detectAltSvc } from '@ldns/core/security-checks';

const handler = createHandler({
  endpoint: 'server',
  cache: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    const useHttp = url.searchParams.get('http') === '1';

    if (!domain) throw error(400, 'Missing domain parameter');

    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);

    let analysis;
    try {
      analysis = await analyzeServer(domain, { useHttp, guard: assertRedirectTarget });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch';
      // Return a structured error, not a 5xx — clients expect JSON.
      return {
        ok: false as const,
        error: message,
        domain
      };
    }

    const headers = analysis.info?.headers ?? {};
    return {
      ok: true as const,
      domain,
      info: analysis.info,
      redirects: analysis.redirects,
      tech: detectTechnologies(headers),
      altSvc: detectAltSvc(headers),
      securityHeaders: auditSecurityHeaders(headers)
    };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
