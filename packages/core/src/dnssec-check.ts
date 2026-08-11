/**
 * Real DNSSEC validation status — not just "is the zone signed".
 *
 * Showing DS records tells you a zone *claims* to be signed. It does not tell
 * you whether the chain actually validates, and a broken chain is far worse
 * than no DNSSEC at all: validating resolvers return SERVFAIL, so the domain
 * goes dark for a large share of the internet while still resolving fine for
 * whoever set it up (their resolver may not validate). It's a genuinely hard
 * outage to diagnose without this check.
 *
 * How we detect it, using only DoH JSON:
 *
 *   - `AD` (Authenticated Data) is set by the resolver when it validated the
 *     answer against the DNSSEC chain.
 *   - `CD=1` (Checking Disabled) tells the resolver to skip validation.
 *
 * So query twice and compare:
 *
 *   | CD=0 (validating) | CD=1 (unvalidated) | Meaning              |
 *   |-------------------|--------------------|----------------------|
 *   | NOERROR + AD      | NOERROR            | signed and valid     |
 *   | NOERROR, no AD    | NOERROR            | unsigned (no DNSSEC) |
 *   | SERVFAIL          | NOERROR            | BOGUS — broken chain |
 *   | SERVFAIL          | SERVFAIL           | genuine server error |
 */

import type { DnsEndpoint } from './types';
import { DNS_ENDPOINTS } from './constants';
import { fetchWithTimeout } from './fetch-utils';
import { toAsciiDomain } from './domain-parser';

const DNSSEC_TIMEOUT_MS = 10_000;

export type DnssecStatus = 'secure' | 'insecure' | 'bogus' | 'error';

export interface DnssecCheck {
  status: DnssecStatus;
  /** The resolver validated this answer (AD flag). */
  authenticatedData: boolean;
  /** Validating query's RCODE, 0 = NOERROR, 2 = SERVFAIL. */
  validatedStatus: number;
  /** Non-validating (CD=1) query's RCODE. */
  uncheckedStatus: number;
  explanation: string;
}

interface DohJson {
  Status?: number;
  AD?: boolean;
}

async function queryFlags(
  endpointUrl: string,
  domain: string,
  cd: boolean,
  signal?: AbortSignal
): Promise<DohJson> {
  const url = new URL(endpointUrl);
  url.searchParams.set('name', domain);
  url.searchParams.set('type', 'A');
  // `do=1` asks for DNSSEC records so the resolver reports its validation
  // state; `cd=1` disables validation entirely.
  url.searchParams.set('do', '1');
  if (cd) url.searchParams.set('cd', '1');

  const res = await fetchWithTimeout(
    url.toString(),
    { headers: { Accept: 'application/dns-json' }, signal },
    DNSSEC_TIMEOUT_MS
  );
  if (!res.ok) throw new Error(`DNSSEC probe failed (${res.status})`);
  return (await res.json()) as DohJson;
}

/**
 * Determine whether a domain's DNSSEC chain actually validates.
 *
 * Note: DNS.SB's JSON endpoint does not reliably honour `cd`, so this always
 * probes Cloudflare or Google — the validation verdict is a property of the
 * zone, not of the user's chosen resolver.
 */
export async function checkDnssec(
  domain: string,
  endpoint: DnsEndpoint = 'cloudflare',
  signal?: AbortSignal
): Promise<DnssecCheck> {
  const resolver = endpoint === 'google' ? 'google' : 'cloudflare';
  const endpointUrl = DNS_ENDPOINTS[resolver].url;
  const name = toAsciiDomain(domain);

  try {
    const [validated, unchecked] = await Promise.all([
      queryFlags(endpointUrl, name, false, signal),
      queryFlags(endpointUrl, name, true, signal)
    ]);

    const validatedStatus = validated.Status ?? -1;
    const uncheckedStatus = unchecked.Status ?? -1;
    const ad = validated.AD === true;

    // SERVFAIL only when validating, but fine with validation off — the
    // signature chain is broken. This is the finding that matters.
    if (validatedStatus === 2 && uncheckedStatus === 0) {
      return {
        status: 'bogus',
        authenticatedData: false,
        validatedStatus,
        uncheckedStatus,
        explanation:
          'DNSSEC is broken. Validating resolvers reject this domain (SERVFAIL) while non-validating ones resolve it — so the site is unreachable for a large share of users. Usually a key rollover gone wrong or a DS record that no longer matches the zone.'
      };
    }

    if (ad) {
      return {
        status: 'secure',
        authenticatedData: true,
        validatedStatus,
        uncheckedStatus,
        explanation: 'DNSSEC is enabled and the chain of trust validates.'
      };
    }

    if (validatedStatus === 0) {
      return {
        status: 'insecure',
        authenticatedData: false,
        validatedStatus,
        uncheckedStatus,
        explanation:
          'No DNSSEC. Responses resolve normally but are not signed, so they cannot be verified as authentic.'
      };
    }

    return {
      status: 'error',
      authenticatedData: false,
      validatedStatus,
      uncheckedStatus,
      explanation: 'Could not determine DNSSEC status — the domain did not resolve.'
    };
  } catch {
    return {
      status: 'error',
      authenticatedData: false,
      validatedStatus: -1,
      uncheckedStatus: -1,
      explanation: 'DNSSEC check failed to complete.'
    };
  }
}
