import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryAllProviders } from './dns-propagation';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('queryAllProviders', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query all 3 providers in parallel', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: [{ data: '93.184.216.34', TTL: 300, type: 1 }]
      })
    });

    const { results } = await queryAllProviders('example.com', ['A']);

    expect(results.cloudflare).toBeDefined();
    expect(results.google).toBeDefined();
    expect(results['dns-sb']).toBeDefined();
  });

  it('should contain A records from each provider', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Status: 0,
        Answer: [{ data: '1.2.3.4', TTL: 300, type: 1 }]
      })
    });

    const { results } = await queryAllProviders('example.com', ['A']);

    expect(results.cloudflare.A).toHaveLength(1);
    expect(results.cloudflare.A[0].data).toBe('1.2.3.4');
    expect(results.google.A).toHaveLength(1);
    expect(results['dns-sb'].A).toHaveLength(1);
  });

  it('should handle provider failures gracefully', async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          Status: 0,
          Answer: [{ data: '1.2.3.4', TTL: 300, type: 1 }]
        })
      });
    });

    const { results, latencies } = await queryAllProviders('example.com', ['A']);
    expect(results).toBeDefined();
    expect(Object.keys(results)).toHaveLength(3);
    expect(latencies).toHaveLength(3);
  });

  it('should use correct endpoint URLs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0 })
    });

    await queryAllProviders('example.com', ['A']);

    const urls = mockFetch.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(urls.some((u: string) => u.includes('cloudflare-dns.com'))).toBe(true);
    expect(urls.some((u: string) => u.includes('dns.google'))).toBe(true);
    expect(urls.some((u: string) => u.includes('doh.dns.sb'))).toBe(true);
  });

  it('should report latencies for each provider', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0 })
    });

    const { latencies } = await queryAllProviders('example.com', ['A']);
    expect(latencies).toHaveLength(3);
    for (const l of latencies) {
      expect(l.endpoint).toBeDefined();
      expect(l.ms === null || typeof l.ms === 'number').toBe(true);
    }
  });
});
