import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRdapBaseUrl, clearRdapBootstrapCache, IANA_RDAP_BOOTSTRAP_URL } from './rdap-bootstrap';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const FILE = {
  services: [
    [['com', 'net'], ['https://rdap.verisign.com/com/v1/']],
    [['br'], ['https://rdap.registro.br/']],
    // http-only listed first: https must still win; missing trailing slash
    // must be added.
    [['xx'], ['http://insecure.example/rdap', 'https://secure.example/rdap']]
  ]
};

describe('getRdapBaseUrl', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    clearRdapBootstrapCache();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(FILE) });
  });

  it('resolves a TLD to its registry base URL', async () => {
    expect(await getRdapBaseUrl('example.com')).toBe('https://rdap.verisign.com/com/v1/');
    expect(await getRdapBaseUrl('foo.bar.net')).toBe('https://rdap.verisign.com/com/v1/');
  });

  it('uses the last label as the TLD for multi-label domains', async () => {
    expect(await getRdapBaseUrl('example.com.br')).toBe('https://rdap.registro.br/');
  });

  it('prefers https and appends a trailing slash', async () => {
    expect(await getRdapBaseUrl('a.xx')).toBe('https://secure.example/rdap/');
  });

  it('returns null for a TLD with no RDAP service', async () => {
    expect(await getRdapBaseUrl('example.de')).toBeNull();
  });

  it('fetches the bootstrap file once and serves later calls from memory', async () => {
    await getRdapBaseUrl('example.com');
    await getRdapBaseUrl('example.br');
    const iana = mockFetch.mock.calls.filter((c) => String(c[0]) === IANA_RDAP_BOOTSTRAP_URL);
    expect(iana.length).toBe(1);
  });

  it('throws a status-carrying error when IANA is unreachable', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(getRdapBaseUrl('example.com')).rejects.toMatchObject({
      name: 'UpstreamError',
      status: 503
    });
  });

  it('rejects a malformed bootstrap file', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ nope: true }) });
    await expect(getRdapBaseUrl('example.com')).rejects.toThrow(/malformed/);
  });
});
