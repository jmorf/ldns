import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateSpf, SPF_LOOKUP_LIMIT } from './spf-eval';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

/**
 * Serve a fake DNS zone: domain -> its SPF TXT record (or null for none).
 * Tolerates being called with a non-URL (the runtime makes the odd stray
 * fetch); those resolve as "no record" and never affect the counts, which
 * only advance for queries our own code issues.
 */
function zone(records: Record<string, string | null>) {
  mockFetch.mockImplementation((url: unknown) => {
    let name = '';
    if (typeof url === 'string') {
      try {
        name = new URL(url).searchParams.get('name') ?? '';
      } catch {
        name = '';
      }
    }
    const spf = records[name];
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          spf
            ? { Status: 0, Answer: [{ data: `"${spf}"`, TTL: 300, type: 16 }] }
            : { Status: 0, Answer: [] }
        )
    });
  });
}

describe('evaluateSpf', () => {
  beforeEach(() => mockFetch.mockReset());

  it('counts nothing for a record with no lookup terms', async () => {
    zone({ 'example.com': 'v=spf1 ip4:192.0.2.0/24 -all' });
    const r = await evaluateSpf('example.com');
    expect(r.lookups).toBe(0);
    expect(r.exceeded).toBe(false);
  });

  it('counts a, mx and include as one lookup each', async () => {
    zone({ 'example.com': 'v=spf1 a mx include:_spf.other.com -all', '_spf.other.com': null });
    const r = await evaluateSpf('example.com');
    expect(r.lookups).toBe(3);
  });

  it('counts nested includes recursively', async () => {
    zone({
      'example.com': 'v=spf1 include:a.com -all',
      'a.com': 'v=spf1 include:b.com include:c.com -all',
      'b.com': 'v=spf1 ip4:1.2.3.4 -all',
      'c.com': 'v=spf1 mx -all'
    });
    const r = await evaluateSpf('example.com');
    // include:a.com + include:b.com + include:c.com + mx = 4
    expect(r.lookups).toBe(4);
  });

  it('flags a record that exceeds the RFC 7208 limit', async () => {
    const includes = Array.from({ length: 12 }, (_, i) => `include:s${i}.com`).join(' ');
    const z: Record<string, string | null> = { 'example.com': `v=spf1 ${includes} -all` };
    for (let i = 0; i < 12; i++) z[`s${i}.com`] = 'v=spf1 ip4:1.2.3.4 -all';
    zone(z);

    const r = await evaluateSpf('example.com');
    expect(r.lookups).toBe(12);
    expect(r.limit).toBe(SPF_LOOKUP_LIMIT);
    expect(r.exceeded).toBe(true);
  });

  it('counts void lookups when an include has no SPF record', async () => {
    zone({ 'example.com': 'v=spf1 include:gone.com include:alsogone.com -all', 'gone.com': null, 'alsogone.com': null });
    const r = await evaluateSpf('example.com');
    expect(r.voidLookups).toBe(2);
    expect(r.voidExceeded).toBe(false);
  });

  it('flags exceeding the void-lookup limit', async () => {
    zone({
      'example.com': 'v=spf1 include:a.com include:b.com include:c.com -all',
      'a.com': null, 'b.com': null, 'c.com': null
    });
    const r = await evaluateSpf('example.com');
    expect(r.voidLookups).toBe(3);
    expect(r.voidExceeded).toBe(true);
  });

  it('detects an include loop without spinning forever', async () => {
    zone({ 'example.com': 'v=spf1 include:a.com -all', 'a.com': 'v=spf1 include:example.com -all' });
    const r = await evaluateSpf('example.com');
    expect(r.loops).toContain('example.com');
  });

  it('follows the redirect modifier', async () => {
    zone({ 'example.com': 'v=spf1 redirect=_spf.other.com', '_spf.other.com': 'v=spf1 a mx -all' });
    const r = await evaluateSpf('example.com');
    // redirect + a + mx
    expect(r.lookups).toBe(3);
  });

  it('returns an empty evaluation when the domain has no SPF record', async () => {
    zone({ 'example.com': null });
    const r = await evaluateSpf('example.com');
    expect(r.lookups).toBe(0);
    expect(r.tree).toEqual([]);
  });

  it('handles qualifiers on lookup terms', async () => {
    zone({ 'example.com': 'v=spf1 +a ~mx ?include:x.com -all', 'x.com': null });
    const r = await evaluateSpf('example.com');
    expect(r.lookups).toBe(3);
  });
});
