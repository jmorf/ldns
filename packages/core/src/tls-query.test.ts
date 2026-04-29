import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTlsCertificate } from './tls-query';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const sampleCert = {
  issuer_ca_id: 1,
  issuer_name: 'C=US, O=Lets Encrypt, CN=R3',
  common_name: 'example.com',
  name_value: 'example.com\nwww.example.com\n*.example.com',
  id: 12345,
  entry_timestamp: '2026-04-01T00:00:00Z',
  not_before: '2026-04-01T00:00:00Z',
  not_after: '2026-07-01T00:00:00Z',
  serial_number: 'abc123'
};

describe('fetchTlsCertificate', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns null when no rows are returned', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
    const r = await fetchTlsCertificate('nothing.example');
    expect(r).toBeNull();
  });

  it('parses a single cert into the expected shape', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-28T00:00:00Z'));

    mockFetch.mockResolvedValue({ ok: true, json: async () => [sampleCert] });
    const r = await fetchTlsCertificate('example.com');
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.issuer).toContain('Lets Encrypt');
    expect(r.commonName).toBe('example.com');
    expect(r.san).toEqual(['example.com', 'www.example.com', '*.example.com']);
    expect(r.serialNumber).toBe('abc123');
    expect(r.daysUntilExpiry).toBe(64); // 2026-07-01 minus 2026-04-28
    expect(r.daysSinceIssued).toBe(27);
    expect(r.ctLogUrl).toBe('https://crt.sh/?id=12345');
    expect(r.source).toBe('crt.sh');
    vi.useRealTimers();
  });

  it('picks the most recent cert when multiple are returned', async () => {
    const older = { ...sampleCert, id: 100, not_before: '2025-01-01T00:00:00' };
    const newer = { ...sampleCert, id: 200, not_before: '2026-04-01T00:00:00' };
    mockFetch.mockResolvedValue({ ok: true, json: async () => [older, newer] });
    const r = await fetchTlsCertificate('example.com');
    expect(r?.id).toBe('200');
  });

  it('throws an informative error on 503', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(fetchTlsCertificate('example.com')).rejects.toThrow(/overloaded/);
  });

  it('throws on other non-OK statuses', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
    await expect(fetchTlsCertificate('example.com')).rejects.toThrow(/502/);
  });

  it('handles missing serial_number gracefully', async () => {
    const noSerial = { ...sampleCert, serial_number: undefined };
    mockFetch.mockResolvedValue({ ok: true, json: async () => [noSerial] });
    const r = await fetchTlsCertificate('example.com');
    expect(r?.serialNumber).toBeUndefined();
  });
});
