import type { DnsData } from './types';

/**
 * Render looked-up DNS records as a BIND-style zone file.
 *
 * This is a best-effort export of what public resolvers returned, not a
 * registry transfer: RRSIG/NSEC and friends are whatever the resolver
 * included, and the SOA serial is stamped from the export date.
 *
 * Record data arrives in DoH presentation format (e.g. MX "10 mail.x.com."),
 * which is already the zone-file form, so most types pass through as-is.
 * TXT is the exception: chunked strings were joined and unquoted at parse
 * time, so it is re-quoted (and inner quotes escaped) here.
 */

/** Types with a natural section order; anything else follows alphabetically */
const SECTION_ORDER = ['NS', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA'];

const SECTION_LABELS: Record<string, string> = {
  NS: 'Name Servers',
  A: 'A Records',
  AAAA: 'AAAA Records',
  CNAME: 'CNAME Records',
  MX: 'MX Records',
  TXT: 'TXT Records',
  SRV: 'SRV Records',
  CAA: 'CAA Records'
};

function quoteTxt(data: string): string {
  // Already a quoted string (or series of them): trust the source form.
  if (data.startsWith('"')) return data;
  return `"${data.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function generateZoneFile(domain: string, records: DnsData, now: Date = new Date()): string {
  const lines: string[] = [
    `; Zone file for ${domain}`,
    `; Generated on ${now.toISOString()}`,
    '',
    `$ORIGIN ${domain}.`,
    '$TTL 3600',
    ''
  ];

  // SOA first, expanded into the conventional multi-line form
  const soa = records.SOA?.[0];
  if (soa) {
    const parts = soa.data.split(/\s+/);
    if (parts.length >= 7) {
      const serial = `${now.toISOString().slice(0, 10).replace(/-/g, '')}01`;
      lines.push(
        `@ IN SOA ${parts[0]} ${parts[1]} (`,
        `    ${serial}     ; Serial`,
        `    ${parts[3]}        ; Refresh`,
        `    ${parts[4]}        ; Retry`,
        `    ${parts[5]}        ; Expire`,
        `    ${parts[6]}        ; Minimum TTL`,
        ')',
        ''
      );
    } else {
      lines.push(`@ ${soa.ttl || 3600} IN SOA ${soa.data}`, '');
    }
  }

  const remaining = Object.keys(records)
    .filter((type) => type !== 'SOA' && records[type]?.length > 0)
    .sort((a, b) => {
      const ai = SECTION_ORDER.indexOf(a);
      const bi = SECTION_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

  for (const type of remaining) {
    lines.push(`; ${SECTION_LABELS[type] ?? `${type} Records`}`);
    for (const record of records[type]) {
      const data = type === 'TXT' ? quoteTxt(record.data) : record.data;
      lines.push(`@ ${record.ttl || 3600} IN ${type} ${data}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
