import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryDns, getRecordTypeName } from './dns-query';

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

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await queryDns('example.com', ['A']);

    expect(result.A).toHaveLength(0);
  });

  it('should handle non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    });

    const result = await queryDns('example.com', ['A']);

    expect(result.A).toHaveLength(0);
  });
});

describe('getRecordTypeName', () => {
  it('should return correct type names', () => {
    expect(getRecordTypeName(1)).toBe('A');
    expect(getRecordTypeName(2)).toBe('NS');
    expect(getRecordTypeName(5)).toBe('CNAME');
    expect(getRecordTypeName(15)).toBe('MX');
    expect(getRecordTypeName(16)).toBe('TXT');
    expect(getRecordTypeName(28)).toBe('AAAA');
    expect(getRecordTypeName(257)).toBe('CAA');
  });

  it('should return TYPE{number} for unknown types', () => {
    expect(getRecordTypeName(999)).toBe('TYPE999');
  });
});
