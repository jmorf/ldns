/**
 * Integration tests for /api/asn, /api/geo, /api/tls, /api/headers,
 * /api/subdomains, /api/dkim. One file, many small specs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as asnGet } from './asn/+server';
import { GET as geoGet } from './geo/+server';
import { GET as tlsGet } from './tls/+server';
import { GET as headersGet } from './headers/+server';
import { gcRateLimits } from '$lib/server/ratelimit';

const fetchSpy = vi.fn();
globalThis.fetch = fetchSpy as unknown as typeof fetch;

// SvelteKit RequestEvent is overspecified for our needs in tests, cast the
// minimal subset we use.
type Ev = Parameters<typeof asnGet>[0];

function ev(params: Record<string, string>, ip = '203.0.113.20'): Ev {
  const u = new URL('http://localhost/api/x');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return {
    url: u,
    request: { headers: new Headers({ origin: 'https://ldns.com' }) } as Request,
    getClientAddress: () => ip,
    platform: undefined
  } as unknown as Ev;
}

async function asJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

beforeEach(() => {
  fetchSpy.mockReset();
  gcRateLimits();
});

describe('/api/asn', () => {
  it('parses Cymru DoH response', async () => {
    let n = 0;
    fetchSpy.mockImplementation(() => {
      n++;
      const data =
        n === 1
          ? '"15169 | 8.8.8.0/24 | US | arin | 2014-03-14"'
          : '"15169 | US | arin | 2000-03-30 | GOOGLE, US"';
      return Promise.resolve({
        ok: true,
        json: async () => ({ Status: 0, Answer: [{ data, TTL: 60, type: 16 }] })
      });
    });
    const res = await asnGet(ev({ ip: '8.8.8.8' }));
    const body = await asJson<any>(res);
    expect(body.ok).toBe(true);
    expect(body.asn).toBe(15169);
    expect(body.country).toBe('US');
    expect(body.asName).toBe('GOOGLE');
  });

  it('rejects bad IP input', async () => {
    await expect(asnGet(ev({ ip: 'not-an-ip' }))).rejects.toMatchObject({ status: 400 });
  });
});

describe('/api/geo', () => {
  it('proxies ipwho.is result', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        ip: '8.8.8.8',
        country: 'United States',
        country_code: 'US',
        region: 'California',
        city: 'Mountain View',
        latitude: 37.4,
        longitude: -122.0,
        timezone: { id: 'America/Los_Angeles' },
        connection: { asn: 15169, org: 'GOOGLE', isp: 'Google LLC', domain: 'google.com' }
      })
    });
    const res = await geoGet(ev({ ip: '8.8.8.8' }));
    const body = await asJson<any>(res);
    expect(body.ok).toBe(true);
    expect(body.country).toBe('United States');
    expect(body.city).toBe('Mountain View');
    expect(body.org).toBe('GOOGLE');
  });

  it('returns ok:false on upstream failure response', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: 'invalid ip' })
    });
    const res = await geoGet(ev({ ip: '8.8.8.8' }));
    const body = await asJson<any>(res);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/invalid ip/);
  });

  it('rejects malformed IPs', async () => {
    await expect(geoGet(ev({ ip: 'foo' }))).rejects.toMatchObject({ status: 400 });
  });
});

describe('/api/tls', () => {
  it('returns the most recent cert', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (String(url).includes('cloudflare-dns.com')) {
        return Promise.resolve({ ok: true, json: async () => ({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            issuer_ca_id: 1,
            issuer_name: "C=US, O=Let's Encrypt, CN=R3",
            common_name: 'example.com',
            name_value: 'example.com\n*.example.com',
            id: 999,
            entry_timestamp: '2026-04-01T00:00:00Z',
            not_before: '2026-04-01T00:00:00Z',
            not_after: '2026-07-01T00:00:00Z'
          }
        ]
      });
    });
    const res = await tlsGet(ev({ domain: 'example.com' }));
    const body = await asJson<any>(res);
    expect(body.ok).toBe(true);
    expect(body.certificate.commonName).toBe('example.com');
    expect(body.certificate.san).toContain('*.example.com');
  });

  it('returns ok:false when no cert found', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (String(url).includes('cloudflare-dns.com')) {
        return Promise.resolve({ ok: true, json: async () => ({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    const res = await tlsGet(ev({ domain: 'example.com' }));
    const body = await asJson<any>(res);
    expect(body.ok).toBe(false);
  });
});

describe('/api/headers', () => {
  it('returns headers + status + final URL', async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (String(url).includes('cloudflare-dns.com')) {
        return Promise.resolve({ ok: true, json: async () => ({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }) });
      }
      return Promise.resolve({
        ok: true,
        url: 'https://example.com/',
        type: 'basic',
        status: 200,
        statusText: 'OK',
        headers: new Headers({ server: 'nginx', 'content-type': 'text/html' })
      });
    });
    const res = await headersGet(ev({ domain: 'example.com' }));
    const body = await asJson<any>(res);
    expect(body.ok).toBe(true);
    expect(body.status).toBe(200);
    expect(body.url).toBe('https://example.com/');
    expect(body.headers.server).toBe('nginx');
  });
});
