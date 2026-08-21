import { describe, it, expect } from 'vitest';
import { generateZoneFile } from './zone-file';

const NOW = new Date('2026-08-21T12:00:00Z');

describe('generateZoneFile', () => {
  it('renders origin, TTL directive, and record sections in order', () => {
    const zone = generateZoneFile(
      'example.com',
      {
        A: [{ data: '93.184.216.34', ttl: 300, type: 1 }],
        NS: [
          { data: 'a.iana-servers.net.', ttl: 86400, type: 2 },
          { data: 'b.iana-servers.net.', ttl: 86400, type: 2 }
        ],
        MX: [{ data: '10 mail.example.com.', ttl: 3600, type: 15 }]
      },
      NOW
    );

    expect(zone).toContain('$ORIGIN example.com.');
    expect(zone).toContain('@ 300 IN A 93.184.216.34');
    expect(zone).toContain('@ 86400 IN NS a.iana-servers.net.');
    expect(zone).toContain('@ 3600 IN MX 10 mail.example.com.');
    // NS section before A, A before MX
    expect(zone.indexOf('IN NS')).toBeLessThan(zone.indexOf('IN A '));
    expect(zone.indexOf('IN A ')).toBeLessThan(zone.indexOf('IN MX'));
  });

  it('expands SOA with a date-based serial', () => {
    const zone = generateZoneFile(
      'example.com',
      {
        SOA: [
          {
            data: 'ns.icann.org. noc.dns.icann.org. 2024013000 7200 3600 1209600 3600',
            ttl: 3600,
            type: 6
          }
        ]
      },
      NOW
    );

    expect(zone).toContain('@ IN SOA ns.icann.org. noc.dns.icann.org. (');
    expect(zone).toContain('2026082101     ; Serial');
    expect(zone).toContain('7200        ; Refresh');
    expect(zone).toContain('1209600        ; Expire');
  });

  it('quotes TXT data and escapes embedded quotes', () => {
    const zone = generateZoneFile(
      'example.com',
      {
        TXT: [
          { data: 'v=spf1 include:_spf.google.com ~all', ttl: 300, type: 16 },
          { data: 'say "hi"', ttl: 300, type: 16 },
          { data: '"already quoted"', ttl: 300, type: 16 }
        ]
      },
      NOW
    );

    expect(zone).toContain('@ 300 IN TXT "v=spf1 include:_spf.google.com ~all"');
    expect(zone).toContain('@ 300 IN TXT "say \\"hi\\""');
    expect(zone).toContain('@ 300 IN TXT "already quoted"');
  });

  it('uses the record TTL, falling back to 3600', () => {
    const zone = generateZoneFile(
      'example.com',
      { A: [{ data: '1.2.3.4', ttl: 0, type: 1 }] },
      NOW
    );
    expect(zone).toContain('@ 3600 IN A 1.2.3.4');
  });

  it('includes unknown record types generically after the known ones', () => {
    const zone = generateZoneFile(
      'example.com',
      {
        HTTPS: [{ data: '1 . alpn="h3,h2"', ttl: 300, type: 65 }],
        A: [{ data: '1.2.3.4', ttl: 300, type: 1 }]
      },
      NOW
    );

    expect(zone).toContain('; HTTPS Records');
    expect(zone).toContain('@ 300 IN HTTPS 1 . alpn="h3,h2"');
    expect(zone.indexOf('IN A ')).toBeLessThan(zone.indexOf('IN HTTPS'));
  });

  it('skips empty record arrays', () => {
    const zone = generateZoneFile('example.com', { A: [], TXT: [] }, NOW);
    expect(zone).not.toContain('IN A');
    expect(zone).not.toContain('IN TXT');
  });
});
