import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reverseIPv4, reverseIPv6, isIPv4, isIPv6, lookupPtrBatch } from './ptr';

describe('reverseIPv4', () => {
  it('reverses dotted-quad and appends .in-addr.arpa', () => {
    expect(reverseIPv4('1.2.3.4')).toBe('4.3.2.1.in-addr.arpa');
    expect(reverseIPv4('192.168.1.1')).toBe('1.1.168.192.in-addr.arpa');
  });
});

describe('reverseIPv6', () => {
  it('expands :: and reverses nibble-by-nibble', () => {
    // ::1 expanded = 0000:0000:0000:0000:0000:0000:0000:0001
    expect(reverseIPv6('::1')).toBe('1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa');
  });

  it('handles full IPv6', () => {
    const full = '2001:0db8:0000:0000:0000:0000:0000:0001';
    const reversed = reverseIPv6(full);
    expect(reversed.endsWith('.ip6.arpa')).toBe(true);
    // First nibble of reverse is last nibble of address (1)
    expect(reversed.startsWith('1.')).toBe(true);
  });
});

describe('isIPv4 / isIPv6', () => {
  it('correctly distinguishes IPv4 and IPv6', () => {
    expect(isIPv4('1.2.3.4')).toBe(true);
    expect(isIPv4('::1')).toBe(false);
    expect(isIPv6('::1')).toBe(true);
    expect(isIPv6('1.2.3.4')).toBe(false);
    expect(isIPv6('not-an-ip')).toBe(false);
  });
});

describe('lookupPtrBatch', () => {
  const mockFetch = vi.fn();
  globalThis.fetch = mockFetch;

  beforeEach(() => mockFetch.mockReset());

  it('parallelizes lookups and returns map', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          Status: 0,
          Answer: [{ data: 'example.com.', TTL: 300, type: 12 }]
        })
    });

    const result = await lookupPtrBatch(['1.2.3.4', '5.6.7.8']);
    expect(result['1.2.3.4']).toBe('example.com');
    expect(result['5.6.7.8']).toBe('example.com');
  });

  it('returns empty string for non-IPs', async () => {
    const result = await lookupPtrBatch(['not-an-ip']);
    expect(result['not-an-ip']).toBe('');
  });
});
