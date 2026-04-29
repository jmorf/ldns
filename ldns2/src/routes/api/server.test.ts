/**
 * Integration tests for /api/server. Mocks the outbound fetch (DoH for SSRF
 * resolution + the actual HEAD/GET to the target domain) and exercises the
 * full handler — origin check, rate limit, SSRF guard, analyzeServer, and
 * JSON envelope.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, OPTIONS } from './server/+server';
import { gcRateLimits } from '$lib/server/ratelimit';

const fetchSpy = vi.fn();
globalThis.fetch = fetchSpy as unknown as typeof fetch;

function makeEvent(opts: { origin?: string; ip?: string; domain?: string; http?: string }) {
  const u = new URL('http://localhost/api/server');
  if (opts.domain) u.searchParams.set('domain', opts.domain);
  if (opts.http) u.searchParams.set('http', opts.http);
  return {
    url: u,
    request: { headers: new Headers(opts.origin ? { origin: opts.origin } : {}) } as Request,
    getClientAddress: () => opts.ip ?? '203.0.113.1',
    platform: undefined
  } as unknown as Parameters<typeof GET>[0];
}

function mockDohPublic(ip = '93.184.216.34') {
  fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('cloudflare-dns.com')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ Status: 0, Answer: u.includes('AAAA') ? [] : [{ type: 1, data: ip }] })
      });
    }
    // The actual HEAD to the target domain
    return Promise.resolve({
      ok: true,
      url: 'https://example.com/',
      type: 'basic',
      status: 200,
      statusText: 'OK',
      redirected: false,
      headers: new Headers({
        server: 'nginx',
        'content-type': 'text/html; charset=utf-8',
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
        'alt-svc': 'h3=":443"; ma=86400'
      })
    });
  });
}

describe('/api/server', () => {
  beforeEach(() => {
    fetchSpy.mockReset();
    gcRateLimits();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`2026-04-28T00:00:${Math.floor(Math.random() * 60)}Z`));
  });
  afterEach(() => vi.useRealTimers());

  it('rejects requests from non-allowed origins', async () => {
    await expect(GET(makeEvent({ origin: 'https://evil.com', domain: 'example.com' }))).rejects.toThrow();
  });

  it('rejects requests with missing domain', async () => {
    await expect(GET(makeEvent({ origin: 'https://ldns.com' }))).rejects.toThrow();
  });

  it('rejects when SSRF guard says private', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [{ type: 1, data: '10.0.0.1' }] })
    });
    await expect(GET(makeEvent({ origin: 'https://ldns.com', domain: 'attacker.example' }))).rejects.toThrow();
  });

  it('returns a structured response for a public domain', async () => {
    mockDohPublic();
    const res = await GET(makeEvent({ origin: 'https://ldns.com', domain: 'example.com' }));
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.ok).toBe(true);
    expect(body.domain).toBe('example.com');
    expect(body.info?.status).toBe(200);
    expect(body.tech?.length).toBeGreaterThan(0); // nginx
    expect(body.altSvc?.http3).toBe(true);
    expect(body.securityHeaders?.length).toBe(6); // 6 audited headers
  });

  it('attaches CORS headers for an extension origin', async () => {
    mockDohPublic();
    const ext = 'chrome-extension://ehgkpjkmaichihneengcigkaoejmcofn';
    const res = await GET(makeEvent({ origin: ext, domain: 'example.com' }));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ext);
    expect(res.headers.get('Vary')).toBe('Origin');
  });

  it('OPTIONS preflight returns 204 with CORS', async () => {
    const res = await OPTIONS(makeEvent({ origin: 'https://ldns.com' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://ldns.com');
  });

  it('OPTIONS preflight rejects evil origin', async () => {
    await expect(OPTIONS(makeEvent({ origin: 'https://evil.com' }))).rejects.toThrow();
  });

  it('rate limits per IP', async () => {
    mockDohPublic();
    for (let i = 0; i < 30; i++) {
      const res = await GET(makeEvent({ origin: 'https://ldns.com', ip: '198.51.100.99', domain: 'example.com' }));
      expect(res.status).toBe(200);
    }
    let caught: { status?: number; body?: { message?: string } } | undefined;
    try {
      await GET(makeEvent({ origin: 'https://ldns.com', ip: '198.51.100.99', domain: 'example.com' }));
    } catch (e) {
      caught = e as { status?: number; body?: { message?: string } };
    }
    expect(caught?.status).toBe(429);
    expect(caught?.body?.message).toMatch(/Too many requests/);
  });

  it('returns ok:false on fetch failure (not 5xx)', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (String(url).includes('cloudflare-dns.com')) {
        return Promise.resolve({ ok: true, json: async () => ({ Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] }) });
      }
      return Promise.reject(new Error('connect ECONNREFUSED'));
    });
    const res = await GET(makeEvent({ origin: 'https://ldns.com', domain: 'example.com' }));
    const body: any = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/ECONNREFUSED/);
  });
});
