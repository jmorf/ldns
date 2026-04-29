import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPlausibleDomain,
  isPrivateIPv4,
  isPrivateIPv6,
  ensurePublicHost
} from './ssrf';

describe('isPlausibleDomain', () => {
  it.each([
    ['google.com', true],
    ['sub.example.org', true],
    ['EXAMPLE.ORG', true],
    ['xn--bcher-kva.org', true], // IDN encoded
    ['a.b', false], // TLD must be ≥2 chars
    ['1.2.3.4', false],
    ['::1', false],
    ['', false],
    ['localhost', false],
    ['something.local', false],
    ['something.internal', false],
    ['example.test', false],
    ['onion.onion', false],
    ['no_underscores.com', false],
    ['-leading-dash.com', false],
    ['trailing-dash-.com', false],
    ['.leading-dot.com', false],
    ['x'.repeat(254), false],
    ['plain', false],
    ['anything.example', false], // .example is reserved
    ['ip6.arpa.example', false] // .example is reserved
  ])('isPlausibleDomain(%j) = %s', (input, expected) => {
    expect(isPlausibleDomain(input)).toBe(expected);
  });
});

describe('isPrivateIPv4', () => {
  it.each([
    ['10.0.0.1', true],
    ['10.255.255.255', true],
    ['172.16.0.1', true],
    ['172.31.255.255', true],
    ['172.32.0.1', false], // outside the /12
    ['192.168.1.1', true],
    ['127.0.0.1', true],
    ['169.254.1.1', true],
    ['100.64.0.1', true], // CGNAT
    ['100.127.255.255', true],
    ['100.128.0.1', false], // outside CGNAT /10
    ['224.0.0.1', true], // multicast
    ['255.255.255.255', true],
    ['8.8.8.8', false],
    ['1.1.1.1', false],
    ['198.51.100.1', false], // TEST-NET-2 (allowed by current ranges; intentional)
    ['not-an-ip', false],
    ['256.1.1.1', false]
  ])('isPrivateIPv4(%j) = %s', (ip, expected) => {
    expect(isPrivateIPv4(ip)).toBe(expected);
  });
});

describe('isPrivateIPv6', () => {
  it.each([
    ['::1', true],
    ['::', true],
    ['fc00::1', true],
    ['fd00:abcd::1', true],
    ['fe80::1', true],
    ['feb0::1', true],
    ['::ffff:10.0.0.1', true], // mapped private
    ['::ffff:8.8.8.8', false],
    ['2001:4860:4860::8888', false], // Google DNS
    ['2606:4700:4700::1111', false] // Cloudflare DNS
  ])('isPrivateIPv6(%j) = %s', (ip, expected) => {
    expect(isPrivateIPv6(ip)).toBe(expected);
  });
});

describe('ensurePublicHost', () => {
  const fetchSpy = vi.fn();
  beforeEach(() => {
    fetchSpy.mockReset();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });
  afterEach(() => {
    fetchSpy.mockReset();
  });

  it('rejects domains that fail format validation', async () => {
    const r = await ensurePublicHost('localhost');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Invalid domain/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects when DoH returns no addresses', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] })
    });
    const r = await ensurePublicHost('example.com');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/does not resolve/);
  });

  it('rejects when DoH returns a private address', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [{ type: 1, data: '10.0.0.1' }] })
    });
    const r = await ensurePublicHost('attacker.example.com');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/private|internal/i);
  });

  it('rejects when AAAA contains link-local', async () => {
    fetchSpy.mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url.includes('AAAA')
            ? { Status: 0, Answer: [{ type: 28, data: 'fe80::1' }] }
            : { Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] }
      })
    );
    const r = await ensurePublicHost('mixed.example.com');
    expect(r.ok).toBe(false);
  });

  it('passes when all addresses are public', async () => {
    fetchSpy.mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url.includes('AAAA')
            ? { Status: 0, Answer: [{ type: 28, data: '2001:4860:4860::8888' }] }
            : { Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] }
      })
    );
    const r = await ensurePublicHost('google.com');
    expect(r.ok).toBe(true);
  });

  it('rejects when DoH itself errors', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));
    const r = await ensurePublicHost('example.com');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/DNS resolution failed/);
  });
});
