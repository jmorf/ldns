import type { SubdomainResult, CertInfo } from './types';
import { fetchWithTimeout, isAbortOrTimeout } from './fetch-utils';
import { toAsciiDomain } from './domain-parser';

interface CrtShEntry {
  id: string | number;
  issuer_name: string;
  not_before: string;
  not_after: string;
  name_value?: string;
  common_name?: string;
}

/** CertSpotter issuance, with `expand=dns_names&expand=issuer` applied. */
interface CertSpotterEntry {
  id: string;
  not_before: string;
  not_after: string;
  dns_names?: string[];
  issuer?: { friendly_name?: string };
}

/** Normalized shape both sources reduce to. */
interface CtRecord {
  id: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  names: string[];
}

/**
 * How to use CertSpotter alongside crt.sh. CertSpotter's unauthenticated tier
 * is rate-limited PER IP, so the right mode depends on whose IP the request
 * leaves from:
 *
 *  - `race`: query both at once, first answer wins. For the extension,
 *                 where each request comes from the end user's own IP and so
 *                 every user has their own quota. Best latency.
 *  - `fallback`, only query CertSpotter after crt.sh has already failed. For
 *                 the site, where every request shares a few Cloudflare egress
 *                 IPs: usage is then proportional to crt.sh's failure rate
 *                 rather than to total traffic, and if we do get throttled we
 *                 are no worse off than crt.sh failing alone.
 *  - `off`, crt.sh only.
 */
export type CertSpotterMode = 'race' | 'fallback' | 'off';

export interface SubdomainOptions {
  signal?: AbortSignal;
  certSpotter?: CertSpotterMode;
}

async function fetchCrtSh(domain: string, timeoutMs: number, signal?: AbortSignal): Promise<CtRecord[]> {
  // The wildcard form (%.domain) is what returns SUBDOMAINS. The plain
  // `q=domain` form only matches that exact name, so it is not a usable
  // fallback here even though it is faster.
  const url = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json&exclude=expired`;

  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' },
      signal
    }, timeoutMs);

    if (response.status === 503 || response.status === 429) {
      throw new Error('crt.sh is temporarily overloaded. Try again in a moment.');
    }
    if (!response.ok) {
      throw new Error(`CT log query failed (${response.status})`);
    }

    // crt.sh flaps: a 200 can carry an HTML or empty body. Validate the shape
    // so the user sees a retryable message instead of a JSON-parse stack.
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('crt.sh returned an invalid response. Try again in a moment.');
    }
    if (!Array.isArray(data)) {
      throw new Error('crt.sh returned an invalid response. Try again in a moment.');
    }

    return (data as CrtShEntry[]).map((c) => ({
      id: String(c.id),
      issuer: c.issuer_name ?? '',
      notBefore: c.not_before,
      notAfter: c.not_after,
      names: (c.name_value ?? '').split('\n')
    }));
  } catch (err) {
    if (isAbortOrTimeout(err)) {
      throw new Error('crt.sh request timed out. Try again.');
    }
    throw err;
  }
}

async function fetchCertSpotter(domain: string, timeoutMs: number, signal?: AbortSignal): Promise<CtRecord[]> {
  const url =
    `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}` +
    '&include_subdomains=true&expand=dns_names&expand=issuer';

  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' },
      signal
    }, timeoutMs);

    // 429 is the unauthenticated hourly cap. Treat as a normal failure so the
    // crt.sh result still wins the race.
    if (!response.ok) {
      throw new Error(`CertSpotter query failed (${response.status})`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('CertSpotter returned an invalid response.');

    return (data as CertSpotterEntry[]).map((c) => ({
      id: String(c.id),
      issuer: c.issuer?.friendly_name ?? '',
      notBefore: c.not_before,
      notAfter: c.not_after,
      names: c.dns_names ?? []
    }));
  } catch (err) {
    if (isAbortOrTimeout(err)) throw new Error('CertSpotter request timed out.');
    throw err;
  }
}

/** Resolve as soon as ANY promise fulfills; reject with the first error if all fail. */
async function firstSuccess<T>(tasks: Array<Promise<T>>): Promise<T> {
  const errors: unknown[] = [];
  return new Promise<T>((resolve, reject) => {
    let pending = tasks.length;
    for (const t of tasks) {
      t.then(resolve).catch((e) => {
        errors.push(e);
        if (--pending === 0) reject(errors[0]);
      });
    }
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Discover subdomains from Certificate Transparency logs.
 * Deduplicates, strips wildcards, and sorts alphabetically.
 *
 * Reliability strategy. Crt.sh is the most complete CT source but also the
 * least reliable: it rate-limits hard per IP and buckles under load, which is
 * what made this tool time out so often. So:
 *
 *   1. `race` (extension): query crt.sh and CertSpotter concurrently and take
 *      whichever answers FIRST. We don't wait for both. The point is latency,
 *      and either source alone gives a useful answer.
 *   2. `fallback` (site): try crt.sh; only if it fails, rescue with
 *      CertSpotter. See CertSpotterMode for why the mode differs by caller.
 *   3. Either way, a final backoff-and-retry against crt.sh. The backoff
 *      matters: crt.sh's failures are dominated by transient overload, and
 *      retrying instantly just gets rejected again.
 *
 * Worst case is ~12s + 0.8s + 10s, inside the Cloudflare Worker budget.
 */
export async function discoverSubdomains(
  domain: string,
  options: SubdomainOptions = {}
): Promise<SubdomainResult> {
  const { signal, certSpotter = 'off' } = options;
  const asciiDomain = toAsciiDomain(domain).toLowerCase();

  const attempt = (timeoutMs: number) => {
    if (certSpotter === 'race') {
      return firstSuccess([
        fetchCrtSh(asciiDomain, timeoutMs, signal),
        fetchCertSpotter(asciiDomain, timeoutMs, signal)
      ]);
    }
    return fetchCrtSh(asciiDomain, timeoutMs, signal);
  };

  let data: CtRecord[];
  try {
    data = await attempt(12_000);
  } catch (firstErr) {
    if (signal?.aborted) throw firstErr;

    // Rescue path: crt.sh is down or overloaded. Try CertSpotter before
    // spending another slow round on the service that just failed.
    if (certSpotter === 'fallback') {
      try {
        data = await fetchCertSpotter(asciiDomain, 10_000, signal);
        return toResult(data, asciiDomain);
      } catch {
        /* fall through to the crt.sh retry */
      }
    }

    if (signal?.aborted) throw firstErr;
    await sleep(800);
    try {
      data = await attempt(10_000);
    } catch {
      // Surface the original error, it's the more informative one.
      throw firstErr;
    }
  }

  return toResult(data, asciiDomain);
}

/** Reduce CT records to the deduplicated, sorted subdomain list. */
function toResult(data: CtRecord[], asciiDomain: string): SubdomainResult {
  const subdomainSet = new Set<string>();
  const certificates: CertInfo[] = [];

  for (const cert of data) {
    for (const name of cert.names) {
      const clean = name.trim().toLowerCase().replace(/^\*\./, '');
      if (clean && clean !== asciiDomain && clean.endsWith(`.${asciiDomain}`)) {
        subdomainSet.add(clean);
      }
    }

    if (certificates.length < 20) {
      certificates.push({
        id: cert.id,
        issuer: cert.issuer,
        notBefore: cert.notBefore,
        notAfter: cert.notAfter,
        commonName: cert.names[0] ?? ''
      });
    }
  }

  const subdomains = Array.from(subdomainSet).sort();

  return {
    subdomains,
    total: subdomains.length,
    certificates
  };
}
