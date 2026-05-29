import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { ensurePublicHost } from '$lib/server/ssrf';

interface Probe {
  name: string;
  path: string;
  description: string;
}

const PROBES: Probe[] = [
  { name: 'security.txt', path: '/.well-known/security.txt', description: 'Vulnerability disclosure contact (RFC 9116)' },
  { name: 'robots.txt', path: '/robots.txt', description: 'Crawler directives' },
  { name: 'ads.txt', path: '/ads.txt', description: 'Authorized Digital Sellers' },
  { name: 'humans.txt', path: '/humans.txt', description: 'Team / credits' },
  { name: 'sitemap.xml', path: '/sitemap.xml', description: 'XML sitemap' }
];

interface ProbeResult extends Probe {
  found: boolean;
  status: number | null;
  url: string;
  size: number | null;
}

async function probe(origin: string, p: Probe, signal: AbortSignal): Promise<ProbeResult> {
  const url = `${origin}${p.path}`;
  try {
    // `redirect: 'manual'` so a probed path that 3xx-redirects can't bounce the
    // fetch onto an internal host — the `ensurePublicHost` check only validates
    // the initial origin. A redirect still means the resource exists, so 2xx/3xx
    // (or the opaqueredirect the runtime may surface) all count as "found".
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual', signal });
    const redirected = res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400);
    const len = res.headers.get('content-length');
    return {
      ...p,
      found: res.ok || redirected,
      status: res.type === 'opaqueredirect' ? null : res.status,
      url,
      size: len ? Number(len) : null
    };
  } catch {
    return { ...p, found: false, status: null, url, size: null };
  }
}

const handler = createHandler({
  endpoint: 'security-probes',
  cache: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const domain = url.searchParams.get('domain');
    if (!domain) throw error(400, 'Missing domain parameter');
    const guard = await ensurePublicHost(domain);
    if (!guard.ok) throw error(400, guard.reason);

    const origin = `https://${domain}`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10_000);
    try {
      const results = await Promise.all(PROBES.map((p) => probe(origin, p, ctl.signal)));
      return { ok: true as const, domain, origin, probes: results };
    } finally {
      clearTimeout(timer);
    }
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
