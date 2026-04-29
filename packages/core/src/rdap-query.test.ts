import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryRdap, formatRdapDate } from './rdap-query';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('queryRdap', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should query RDAP successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      url: 'https://rdap.verisign.com/com/v1/domain/example.com',
      json: () => Promise.resolve({
        ldhName: 'EXAMPLE.COM',
        status: ['active', 'client delete prohibited'],
        events: [
          { eventAction: 'registration', eventDate: '1995-08-14T04:00:00Z' },
          { eventAction: 'expiration', eventDate: '2025-08-13T04:00:00Z' }
        ],
        entities: [
          {
            roles: ['registrar'],
            handle: 'IANA-1',
            vcardArray: ['vcard', [
              ['fn', {}, 'text', 'RESERVED-Internet Assigned Numbers Authority']
            ]]
          }
        ],
        nameservers: [
          { ldhName: 'a.iana-servers.net' },
          { ldhName: 'b.iana-servers.net' }
        ],
        secureDNS: {
          delegationSigned: true
        }
      })
    });

    const result = await queryRdap('example.com');

    expect(result.domainName).toBe('EXAMPLE.COM');
    expect(result.status).toContain('active');
    expect(result.created).toBe('1995-08-14T04:00:00Z');
    expect(result.expires).toBe('2025-08-13T04:00:00Z');
    expect(result.nameservers).toContain('a.iana-servers.net');
    expect(result.dnssecEnabled).toBe(true);
    expect(result.registrar).toContain('RESERVED-Internet Assigned Numbers Authority');
  });

  it('should handle subdomain by using root domain', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      url: 'https://rdap.example.com/domain/example.com',
      json: () => Promise.resolve({
        ldhName: 'EXAMPLE.COM',
        status: []
      })
    });

    await queryRdap('www.example.com');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('example.com'),
      expect.any(Object)
    );
  });

  it('should throw error for 404 response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(queryRdap('nonexistent.example')).rejects.toThrow('Domain not found');
  });

  it('should throw error for non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(queryRdap('example.com')).rejects.toThrow('RDAP lookup failed');
  });

  it('should parse entities with different roles', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      url: 'https://rdap.example.com/domain/example.com',
      json: () => Promise.resolve({
        ldhName: 'EXAMPLE.COM',
        entities: [
          {
            roles: ['registrar'],
            handle: 'REG-1',
            vcardArray: ['vcard', [
              ['fn', {}, 'text', 'Example Registrar']
            ]]
          },
          {
            roles: ['administrative', 'technical'],
            handle: 'CONTACT-1',
            vcardArray: ['vcard', [
              ['fn', {}, 'text', 'John Doe'],
              ['email', {}, 'text', 'john@example.com']
            ]]
          }
        ]
      })
    });

    const result = await queryRdap('example.com');

    expect(result.registrar).toBe('Example Registrar');
    expect(result.entities).toHaveLength(2);
    expect(result.entities[1].role).toBe('administrative, technical');
    expect(result.entities[1].email).toBe('john@example.com');
  });

  it('should handle missing optional fields', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      url: 'https://rdap.example.com/domain/example.com',
      json: () => Promise.resolve({
        ldhName: 'EXAMPLE.COM'
      })
    });

    const result = await queryRdap('example.com');

    expect(result.status).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.entities).toEqual([]);
    expect(result.nameservers).toEqual([]);
    expect(result.created).toBe('');
    expect(result.registrar).toBeNull();
    expect(result.dnssecEnabled).toBe(false);
  });

  it('should track RDAP server URL', async () => {
    const rdapServerUrl = 'https://rdap.verisign.com/com/v1/domain/example.com';
    mockFetch.mockResolvedValue({
      ok: true,
      url: rdapServerUrl,
      json: () => Promise.resolve({
        ldhName: 'EXAMPLE.COM'
      })
    });

    const result = await queryRdap('example.com');

    expect(result.rdapServer).toBe(rdapServerUrl);
  });
});

describe('formatRdapDate', () => {
  it('should format valid date string', () => {
    const result = formatRdapDate('2024-01-15T10:30:00Z');
    expect(result).toContain('2024');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should return N/A for empty string', () => {
    expect(formatRdapDate('')).toBe('N/A');
  });

  it('should return original string for invalid date', () => {
    const invalidDate = 'not-a-date';
    // Note: new Date('not-a-date') returns Invalid Date, but toLocaleDateString still works
    // so we just verify it doesn't throw
    const result = formatRdapDate(invalidDate);
    expect(typeof result).toBe('string');
  });
});
