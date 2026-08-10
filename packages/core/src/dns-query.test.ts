import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryDns } from './dns-query';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('queryDns', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query DNS records successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: [
          { data: '93.184.216.34', TTL: 300, type: 1 }
        ]
      })
    });

    const result = await queryDns('example.com', ['A']);

    expect(result.A).toHaveLength(1);
    expect(result.A[0].data).toBe('93.184.216.34');
    expect(result.A[0].ttl).toBe(300);
    expect(result.A[0].type).toBe(1);
  });

  it('should remove trailing dots from DNS data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: [
          { data: 'ns1.example.com.', TTL: 3600, type: 2 }
        ]
      })
    });

    const result = await queryDns('example.com', ['NS']);

    expect(result.NS[0].data).toBe('ns1.example.com');
  });

  it('should handle multiple record types', async () => {
    mockFetch.mockImplementation((url: string) => {
      const urlObj = new URL(url);
      const type = urlObj.searchParams.get('type');

      if (type === 'A') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [{ data: '93.184.216.34', TTL: 300, type: 1 }]
          })
        });
      } else if (type === 'AAAA') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [{ data: '2606:2800:220:1:248:1893:25c8:1946', TTL: 300, type: 28 }]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Status: 0 })
      });
    });

    const result = await queryDns('example.com', ['A', 'AAAA']);

    expect(result.A).toHaveLength(1);
    expect(result.AAAA).toHaveLength(1);
  });

  it('should handle no answers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: undefined
      })
    });

    const result = await queryDns('example.com', ['AAAA']);

    expect(result.AAAA).toHaveLength(0);
  });

  it('should handle subdomain queries', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: [{ data: 'v=spf1 -all', TTL: 300, type: 16 }]
      })
    });

    await queryDns('example.com', ['TXT'], '_dmarc');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('name=_dmarc.example.com'),
      expect.any(Object)
    );
  });

  it('should use correct endpoint URL for Cloudflare', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0 })
    });

    await queryDns('example.com', ['A'], undefined, 'cloudflare');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('cloudflare-dns.com'),
      expect.any(Object)
    );
  });

  it('should throw when every record type fails at the transport layer', async () => {
    // An endpoint outage must not masquerade as "this domain has no records".
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(queryDns('example.com', ['A', 'AAAA'])).rejects.toThrow(/DNS lookup failed/);
  });

  it('should throw when every response is non-OK', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(queryDns('example.com', ['A'])).rejects.toThrow(/DNS lookup failed/);
  });

  it('should degrade gracefully on partial failure', async () => {
    mockFetch.mockImplementation((url: string) => {
      const type = new URL(url).searchParams.get('type');
      if (type === 'A') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [{ data: '93.184.216.34', TTL: 300, type: 1 }]
          })
        });
      }
      return Promise.reject(new Error('Network error'));
    });

    const result = await queryDns('example.com', ['A', 'TXT']);

    expect(result.A).toHaveLength(1);
    expect(result.TXT).toHaveLength(0);
  });

  it('should punycode IDN domains before querying', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0 })
    });

    await queryDns('münchen.de', ['A']);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('xn--mnchen-3ya.de'),
      expect.any(Object)
    );
  });

  it('should join chunked TXT records and strip quotes', async () => {
    // >255-byte TXT records arrive from Cloudflare/DNS.SB as `"chunk1" "chunk2"` —
    // RFC 7208 requires concatenation with no separator.
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: [
          { data: '"v=spf1 include:a.com " "include:b.com -all"', TTL: 300, type: 16 }
        ]
      })
    });

    const result = await queryDns('example.com', ['TXT']);

    expect(result.TXT[0].data).toBe('v=spf1 include:a.com include:b.com -all');
  });
});
