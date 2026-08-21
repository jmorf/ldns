import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lookupGeo } from './geo-query';
import { UpstreamError } from './upstream-errors';

const SUCCESS = {
  success: true,
  country: 'United States',
  country_code: 'US',
  region: 'California',
  city: 'San Francisco',
  latitude: 37.77,
  longitude: -122.41,
  timezone: { id: 'America/Los_Angeles' },
  connection: { org: 'Cloudflare, Inc.', isp: 'Cloudflare', asn: 13335 }
};

describe('lookupGeo', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('parses a successful response', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(SUCCESS)));

    const geo = await lookupGeo('1.1.1.1');
    expect(geo.ip).toBe('1.1.1.1');
    expect(geo.city).toBe('San Francisco');
    expect(geo.countryCode).toBe('US');
    expect(geo.timezone).toBe('America/Los_Angeles');
    expect(geo.isp).toBe('Cloudflare');
    expect(geo.asn).toBe(13335);
  });

  it('queries ipwho.is with the IP in the path', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(SUCCESS)));
    globalThis.fetch = fetchMock;

    await lookupGeo('2606:4700::1111');
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://ipwho.is/2606%3A4700%3A%3A1111');
  });

  it('throws the service message when success is false', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ success: false, message: 'Reserved range' }))
    );

    await expect(lookupGeo('10.0.0.1')).rejects.toThrow('Reserved range');
  });

  it('throws UpstreamError on HTTP failure', async () => {
    globalThis.fetch = vi.fn(async () => new Response('rate limited', { status: 429 }));

    await expect(lookupGeo('1.1.1.1')).rejects.toBeInstanceOf(UpstreamError);
  });

  it('nulls missing optional fields', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ success: true, country: 'Germany' }))
    );

    const geo = await lookupGeo('9.9.9.9');
    expect(geo.country).toBe('Germany');
    expect(geo.city).toBeNull();
    expect(geo.isp).toBeNull();
    expect(geo.asn).toBeNull();
  });
});
