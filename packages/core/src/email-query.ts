import type { EmailData, DnsRecordResult, DnsEndpoint } from './types';
import { queryDns } from './dns-query';
import { parseSPFRecord, parseDMARCRecord } from './parsers';
import { EMAIL_PROVIDERS } from './constants';

/**
 * Look up email-related DNS records for a domain
 * @param domain The domain to query
 * @param endpoint The DNS endpoint to use
 * @returns Email configuration data including MX, SPF, DMARC, etc.
 */
export async function queryEmailRecords(
  domain: string,
  endpoint: DnsEndpoint = 'cloudflare'
): Promise<EmailData> {
  // Lookup email-related DNS records in parallel.
  // Probe both `default._bimi` and `selector1._bimi` since some senders use the latter.
  const [mxResults, txtResults, dmarcResults, mtaStsResults, bimiDefault, bimiSelector1] = await Promise.all([
    queryDns(domain, ['MX'], undefined, endpoint),
    queryDns(domain, ['TXT'], undefined, endpoint),
    queryDns(domain, ['TXT'], '_dmarc', endpoint),
    queryDns(domain, ['TXT'], '_mta-sts', endpoint),
    queryDns(domain, ['TXT'], 'default._bimi', endpoint),
    queryDns(domain, ['TXT'], 'selector1._bimi', endpoint)
  ]);

  const mxRecords = mxResults.MX || [];

  const isPrefix = (record: DnsRecordResult, prefix: string) => {
    // TXT records may arrive quoted, with an unquoted multi-string concat, or as plain text.
    const normalized = record.data.trim().replace(/^"(.+)"$/, '$1').toLowerCase();
    return normalized.startsWith(prefix.toLowerCase());
  };

  const spfRecords = (txtResults.TXT || []).filter((r) => isPrefix(r, 'v=spf1'));
  const dmarcRecords = (dmarcResults.TXT || []).filter((r) => isPrefix(r, 'v=dmarc1'));
  const mtaStsRecords = (mtaStsResults.TXT || []).filter((r) => isPrefix(r, 'v=stsv1'));
  const bimiRecords = [
    ...(bimiDefault.TXT || []).filter((r) => isPrefix(r, 'v=bimi1')),
    ...(bimiSelector1.TXT || []).filter((r) => isPrefix(r, 'v=bimi1'))
  ];

  // Determine if email is enabled
  const isEmailEnabled = mxRecords.length > 0;

  // Detect email provider
  const provider = detectEmailProvider(mxRecords);

  // Parse SPF details
  const spfAnalysis = spfRecords.length > 0 ? parseSPFRecord(spfRecords[0].data) : null;

  // Parse DMARC details
  const dmarcAnalysis = dmarcRecords.length > 0 ? parseDMARCRecord(dmarcRecords[0].data) : null;

  return {
    mx: mxRecords,
    spf: spfRecords,
    txt: txtResults.TXT || [],
    dmarc: dmarcRecords,
    mtaSts: mtaStsRecords,
    bimi: bimiRecords,
    isEmailEnabled,
    provider,
    spfAnalysis,
    dmarcAnalysis
  };
}

/**
 * Detect email provider from MX records
 */
function detectEmailProvider(mxRecords: DnsRecordResult[]): string {
  if (mxRecords.length === 0) {
    return '';
  }

  const providers: string[] = [];

  for (const mxRecord of mxRecords) {
    const mxData = mxRecord.data.toLowerCase();

    for (const [providerName, patterns] of Object.entries(EMAIL_PROVIDERS)) {
      if (patterns.some(pattern => mxData.includes(pattern))) {
        if (!providers.includes(providerName)) {
          providers.push(providerName);
        }
      }
    }
  }

  return providers.length > 0 ? providers.join(' + ') : 'Custom / Other';
}

