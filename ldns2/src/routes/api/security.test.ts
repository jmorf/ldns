/**
 * Integration tests for the /api/security/* endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as headersGet } from './security/headers/+server';
import { GET as hstsGet } from './security/hsts-preload/+server';
import { GET as probesGet } from './security/probes/+server';
import { gcRateLimits } from '$lib/server/ratelimit';

const fetchSpy = vi.fn();
globalThis.fetch = fetchSpy as unknown as typeof fetch;

function ev(path: string, params: Record<string, string>, ip = '203.0.113.10') {
  const u = new URL(`http://localhost${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return {
    url: u,
    request: { headers: new Headers({ origin: 'https://ldns.com' }) } as Request,
    getClientAddress: () => ip,
    platform: undefined
  } as unknown as Parameters<typeof headersGet>[0];
}

beforeEach(() => {
  fetchSpy.mockReset();
  gcRateLimits();
});

describe('/api/security/headers', () => {
  it('returns audit results for a public domain', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (String(url).includes('cloudflare-dns.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] })
        });
      }
      return Promise.resolve({
        ok: true,
        url: 'https://example.com/',
        type: 'basic',
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
          'x-content-type-options': 'nosniff'
        })
      });
    });

    const res = await headersGet(ev('/api/security/headers', { domain: 'example.com' }));
    const body: any = await res.json();
    expect(body.ok).toBe(true);
    expect(body.audit).toHaveLength(6);
    const hsts = body.audit.find((a: { key: string }) => a.key === 'strict-transport-security');
    expect(hsts.level).toBe('ok');
    const xcto = body.audit.find((a: { key: string }) => a.key === 'x-content-type-options');
    expect(xcto.level).toBe('ok');
    const csp = body.audit.find((a: { key: string }) => a.key === 'content-security-policy');
    expect(csp.level).toBe('bad'); // missing
  });
});

describe('/api/security/hsts-preload', () => {
  it('returns the upstream status', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'preloaded' })
    });
    const res = await hstsGet(ev('/api/security/hsts-preload', { domain: 'example.com' }));
    const body: any = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('preloaded');
  });

  it('handles upstream errors gracefully', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const res = await hstsGet(ev('/api/security/hsts-preload', { domain: 'example.com' }));
    const body: any = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBeNull();
  });

  it('rejects bad domain input', async () => {
    await expect(hstsGet(ev('/api/security/hsts-preload', { domain: 'not_a_domain' }))).rejects.toMatchObject({ status: 400 });
  });
});

describe('/api/security/probes', () => {
  it('reports found/missing for each well-known file', async () => {
    fetchSpy.mockImplementation((url: string) => {
      // SSRF resolution
      if (String(url).includes('cloudflare-dns.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] })
        });
      }
      // Probe HEAD requests
      if (String(url).includes('/.well-known/security.txt') || String(url).includes('/robots.txt')) {
        return Promise.resolve({ ok: true, status: 200, headers: new Headers({ 'content-length': '42' }) });
      }
      return Promise.resolve({ ok: false, status: 404, headers: new Headers() });
    });

    const res = await probesGet(ev('/api/security/probes', { domain: 'example.com' }));
    const body: any = await res.json();
    expect(body.ok).toBe(true);
    expect(body.probes).toHaveLength(5);
    const security = body.probes.find((p: { name: string }) => p.name === 'security.txt');
    expect(security.found).toBe(true);
    const robots = body.probes.find((p: { name: string }) => p.name === 'robots.txt');
    expect(robots.found).toBe(true);
    const ads = body.probes.find((p: { name: string }) => p.name === 'ads.txt');
    expect(ads.found).toBe(false);
  });
});
