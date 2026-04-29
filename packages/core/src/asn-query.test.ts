import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupAsn, lookupAsnBatch } from './asn-query';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('lookupAsn', () => {
  beforeEach(() => mockFetch.mockReset());

  it('parses Cymru TXT response into AsnInfo', async () => {
    let call = 0;
    mockFetch.mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 0,
              Answer: [{ data: '"15169 | 8.8.8.0/24 | US | arin | 2014-03-14"', TTL: 60, type: 16 }]
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 0,
            Answer: [{ data: '"15169 | US | arin | 2000-03-30 | GOOGLE, US"', TTL: 60, type: 16 }]
          })
      });
    });

    const info = await lookupAsn('8.8.8.8');
    expect(info.asn).toBe(15169);
    expect(info.country).toBe('US');
    expect(info.prefix).toBe('8.8.8.0/24');
    expect(info.asName).toBe('GOOGLE');
  });

  it('returns nulls for non-IPs', async () => {
    const info = await lookupAsn('not-an-ip');
    expect(info.asn).toBeNull();
    expect(info.asName).toBeNull();
  });
});

describe('lookupAsnBatch', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns one record per IP', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0, Answer: [] })
    });

    const result = await lookupAsnBatch(['1.2.3.4', '5.6.7.8']);
    expect(Object.keys(result)).toHaveLength(2);
  });
});
