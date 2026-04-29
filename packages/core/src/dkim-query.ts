import type { DkimResult, DkimSelector, DnsEndpoint, DnsRecordResult } from './types';
import { queryDns } from './dns-query';

/** Common selectors used by major email providers and ESPs. */
const COMMON_SELECTORS = [
  'default',
  'google',
  'selector1',
  'selector2',
  's1',
  's2',
  'k1',
  'k2',
  'mail',
  'dkim',
  'mte1',
  'pm',
  'mxvault',
  'protonmail',
  'protonmail2',
  'protonmail3',
  'sm',
  'smtp',
  'cm',
  'smtpapi',
  'm1',
  'mandrill'
];

function joinTxt(records: DnsRecordResult[]): string {
  // DoH may return multi-string TXT records as already-joined; just normalize quotes.
  return records.map((r) => r.data.replace(/^"(.+)"$/, '$1')).join('');
}

function parseDkim(raw: string): { algorithm: string; keyLength: number; policy: string } {
  const tags: Record<string, string> = {};
  raw.split(/;\s*/).forEach((part) => {
    const eq = part.indexOf('=');
    if (eq > 0) {
      tags[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    }
  });
  const algorithm = tags['k'] || 'rsa';
  const policy = tags['t'] || '';
  let keyLength = 0;
  const p = tags['p'];
  if (p) {
    try {
      // Public key is base64-encoded DER. Approximate key length by base64 char count.
      // 1024-bit RSA ≈ 162 base64 chars after PEM header, 2048 ≈ 294, 4096 ≈ 552.
      const len = p.replace(/\s/g, '').length;
      if (len >= 500) keyLength = 4096;
      else if (len >= 250) keyLength = 2048;
      else if (len >= 130) keyLength = 1024;
      else keyLength = 512;
    } catch {
      keyLength = 0;
    }
  }
  return { algorithm, keyLength, policy };
}

/**
 * Probe DKIM selectors for a domain. Returns only those that responded with a
 * v=DKIM1 record. Issued in parallel.
 */
export async function queryDkim(
  domain: string,
  endpoint: DnsEndpoint = 'cloudflare'
): Promise<DkimResult> {
  const selectors = COMMON_SELECTORS;
  const results = await Promise.all(
    selectors.map(async (selector) => {
      try {
        const dns = await queryDns(domain, ['TXT'], `${selector}._domainkey`, endpoint);
        const txtRecords = dns.TXT || [];
        if (txtRecords.length === 0) return null;
        const raw = joinTxt(txtRecords);
        if (!raw.toLowerCase().startsWith('v=dkim1')) return null;
        const parsed = parseDkim(raw);
        const out: DkimSelector = {
          selector,
          found: true,
          raw,
          algorithm: parsed.algorithm,
          keyLength: parsed.keyLength,
          policy: parsed.policy
        };
        return out;
      } catch {
        return null;
      }
    })
  );

  const found = results.filter((r): r is DkimSelector => r !== null);
  return { selectors: found, found: found.length, probed: selectors.length };
}
