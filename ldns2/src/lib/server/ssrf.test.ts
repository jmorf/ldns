import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPlausibleDomain,
  isPrivateIPv4,
  isPrivateIPv6,
  ensurePublicHost,
  assertRedirectTarget
} from './ssrf';

/**
 * Every ensurePublicHost rejection must return this exact string. Distinct
 * messages would leak how our resolver classifies an attacker-chosen IP —
 * an internal-range probing oracle. Asserting the same constant in all four
 * rejection tests is what pins that property.
 */
const OPAQUE_REASON = 'Cannot look up this domain';

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
    ['2606:4700:4700::1111', false], // Cloudflare DNS
    ['::ffff:7f00:1', true], // IPv4-mapped 127.0.0.1 written in hex
    ['::ffff:169.254.169.254', true], // IPv4-mapped cloud metadata IP
    ['::127.0.0.1', true], // deprecated IPv4-compatible loopback
    ['fec0::1', true], // deprecated site-local
    ['64:ff9b::a00:1', true], // NAT64 of 10.0.0.1
    ['2002:7f00:1::', true], // 6to4 wrapping 127.0.0.1
    ['::ffff:1.1.1.1', false], // IPv4-mapped public address
    ['2001:db8::1', false] // documentation range (reserved, not internal)
  ])('isPrivateIPv6(%j) = %s', (ip, expected) => {
    expect(isPrivateIPv6(ip)).toBe(expected);
  });
});

describe('assertRedirectTarget', () => {
  it.each([
    'https://example.com/',
    'http://example.com/path',
    'https://1.1.1.1/',
    'https://93.184.216.34/'
  ])('allows public target %j', (url) => {
    expect(() => assertRedirectTarget(url)).not.toThrow();
  });

  it.each([
    'http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data/', // cloud metadata
    'http://10.0.0.5/',
    'http://192.168.1.1/',
    'http://[::1]/',
    'http://[::ffff:7f00:1]/', // IPv4-mapped loopback
    'http://2130706433/', // decimal-encoded 127.0.0.1 (URL parser normalises)
    'http://0x7f000001/', // hex-encoded 127.0.0.1
    'http://0177.0.0.1/', // octal-encoded 127.0.0.1
    'https://foo.local/',
    'https://api.internal/',
    'file:///etc/passwd',
    'gopher://evil/',
    'not a url'
  ])('rejects disallowed target %j', (url) => {
    expect(() => assertRedirectTarget(url)).toThrow();
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
    if (!r.ok) expect(r.reason).toBe(OPAQUE_REASON);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects when DoH returns no addresses', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] })
    });
    const r = await ensurePublicHost('example.com');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(OPAQUE_REASON);
  });

  it('rejects when DoH returns a private address', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [{ type: 1, data: '10.0.0.1' }] })
    });
    const r = await ensurePublicHost('attacker.example.com');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(OPAQUE_REASON);
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
    if (!r.ok) expect(r.reason).toBe(OPAQUE_REASON);
  });
});
