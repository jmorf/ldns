import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoverSubdomains } from './subdomain-query';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('discoverSubdomains', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should discover subdomains from CT logs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '1',
          issuer_name: 'Let\'s Encrypt',
          not_before: '2024-01-01',
          not_after: '2024-04-01',
          name_value: 'www.example.com\nmail.example.com',
          common_name: 'www.example.com'
        }
      ])
    });

    const result = await discoverSubdomains('example.com');

    expect(result.subdomains).toContain('mail.example.com');
    expect(result.subdomains).toContain('www.example.com');
    expect(result.total).toBe(2);
  });

  it('should strip wildcard entries', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '1',
          issuer_name: 'DigiCert',
          not_before: '2024-01-01',
          not_after: '2024-04-01',
          name_value: '*.example.com\nwww.example.com',
          common_name: '*.example.com'
        }
      ])
    });

    const result = await discoverSubdomains('example.com');

    // Wildcard stripped to example.com, which equals the root domain so excluded
    expect(result.subdomains).toContain('www.example.com');
    expect(result.subdomains).not.toContain('*.example.com');
  });

  it('should deduplicate subdomains', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '1',
          issuer_name: 'CA1',
          not_before: '2024-01-01',
          not_after: '2024-04-01',
          name_value: 'www.example.com',
          common_name: 'www.example.com'
        },
        {
          id: '2',
          issuer_name: 'CA2',
          not_before: '2024-02-01',
          not_after: '2024-05-01',
          name_value: 'www.example.com',
          common_name: 'www.example.com'
        }
      ])
    });

    const result = await discoverSubdomains('example.com');

    expect(result.subdomains).toHaveLength(1);
    expect(result.subdomains[0]).toBe('www.example.com');
  });

  it('should sort subdomains alphabetically', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '1',
          issuer_name: 'CA',
          not_before: '2024-01-01',
          not_after: '2024-04-01',
          name_value: 'z.example.com\na.example.com\nm.example.com',
          common_name: 'example.com'
        }
      ])
    });

    const result = await discoverSubdomains('example.com');

    expect(result.subdomains).toEqual(['a.example.com', 'm.example.com', 'z.example.com']);
  });

  it('should exclude the root domain itself', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '1',
          issuer_name: 'CA',
          not_before: '2024-01-01',
          not_after: '2024-04-01',
          name_value: 'example.com\nwww.example.com',
          common_name: 'example.com'
        }
      ])
    });

    const result = await discoverSubdomains('example.com');

    expect(result.subdomains).not.toContain('example.com');
    expect(result.subdomains).toContain('www.example.com');
  });

  it('should return certificate info', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: '123',
          issuer_name: 'Let\'s Encrypt Authority X3',
          not_before: '2024-01-01',
          not_after: '2024-04-01',
          name_value: 'www.example.com',
          common_name: 'www.example.com'
        }
      ])
    });

    const result = await discoverSubdomains('example.com');

    expect(result.certificates).toHaveLength(1);
    expect(result.certificates[0].id).toBe('123');
    expect(result.certificates[0].issuer).toBe('Let\'s Encrypt Authority X3');
    expect(result.certificates[0].commonName).toBe('www.example.com');
  });

  it('should throw an UpstreamError carrying the status on a non-OK response', async () => {
    // The status must survive on the error, not just in the message text:
    // it is what lets the UI explain what a 502 or 503 actually means.
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(discoverSubdomains('example.com')).rejects.toMatchObject({
      name: 'UpstreamError',
      status: 500,
      service: 'crt.sh'
    });
  });

  it('should limit certificates to 20', async () => {
    const certs = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      issuer_name: 'CA',
      not_before: '2024-01-01',
      not_after: '2024-04-01',
      name_value: `sub${i}.example.com`,
      common_name: `sub${i}.example.com`
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(certs)
    });

    const result = await discoverSubdomains('example.com');

    expect(result.certificates.length).toBeLessThanOrEqual(20);
    expect(result.subdomains.length).toBe(30);
  });
});
