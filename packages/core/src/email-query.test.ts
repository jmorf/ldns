import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryEmailRecords } from './email-query';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('queryEmailRecords', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query email records successfully', async () => {
    mockFetch.mockImplementation((url: string) => {
      const urlObj = new URL(url);
      const name = urlObj.searchParams.get('name');
      const type = urlObj.searchParams.get('type');

      if (type === 'MX' && name === 'example.com') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [
              { data: '10 aspmx.l.google.com.', TTL: 300, type: 15 }
            ]
          })
        });
      }

      if (type === 'TXT' && name === 'example.com') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [
              { data: 'v=spf1 include:_spf.google.com -all', TTL: 300, type: 16 }
            ]
          })
        });
      }

      if (type === 'TXT' && name === '_dmarc.example.com') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [
              { data: 'v=DMARC1; p=reject; rua=mailto:dmarc@example.com', TTL: 300, type: 16 }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Status: 0 })
      });
    });

    const result = await queryEmailRecords('example.com');

    expect(result.isEmailEnabled).toBe(true);
    expect(result.mx).toHaveLength(1);
    expect(result.spf).toHaveLength(1);
    expect(result.dmarc).toHaveLength(1);
    expect(result.provider).toContain('Google');
    expect(result.spfAnalysis).not.toBeNull();
    expect(result.dmarcAnalysis).not.toBeNull();
    expect(result.dmarcAnalysis?.policy).toBe('reject');
  });

  it('should detect Microsoft 365 as provider', async () => {
    mockFetch.mockImplementation((url: string) => {
      const urlObj = new URL(url);
      const name = urlObj.searchParams.get('name');
      const type = urlObj.searchParams.get('type');

      if (type === 'MX' && name === 'example.com') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [
              { data: '10 example-com.mail.protection.outlook.com.', TTL: 300, type: 15 }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Status: 0 })
      });
    });

    const result = await queryEmailRecords('example.com');

    expect(result.provider).toBe('Microsoft 365');
  });

  it('should handle domains without email', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Status: 0 })
    });

    const result = await queryEmailRecords('example.com');

    expect(result.isEmailEnabled).toBe(false);
    expect(result.mx).toHaveLength(0);
    expect(result.provider).toBe('');
  });

  it('should filter SPF records correctly', async () => {
    mockFetch.mockImplementation((url: string) => {
      const urlObj = new URL(url);
      const name = urlObj.searchParams.get('name');
      const type = urlObj.searchParams.get('type');

      if (type === 'TXT' && name === 'example.com') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            Status: 0,
            Answer: [
              { data: 'v=spf1 -all', TTL: 300, type: 16 },
              { data: 'google-site-verification=abc123', TTL: 300, type: 16 }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Status: 0 })
      });
    });

    const result = await queryEmailRecords('example.com');

    expect(result.spf).toHaveLength(1);
    expect(result.txt).toHaveLength(2);
  });
});
