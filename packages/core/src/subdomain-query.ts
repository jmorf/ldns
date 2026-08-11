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

export interface SubdomainOptions {
  signal?: AbortSignal;
  /**
   * Also query CertSpotter, racing it against crt.sh.
   *
   * Only enable for clients querying from the END USER's own IP — i.e. the
   * browser extension. CertSpotter's unauthenticated tier is rate-limited per
   * IP, so a browser extension gives every user their own quota, while a
   * server (our Cloudflare Worker, where every request shares a small pool of
   * egress IPs) would be throttled almost immediately and would degrade the
   * service for everyone.
   */
  useCertSpotter?: boolean;
}

async function fetchCrtSh(domain: string, timeoutMs: number, signal?: AbortSignal): Promise<CtRecord[]> {
  // The wildcard form (%.domain) is what returns SUBDOMAINS — the plain
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
 * Reliability strategy — crt.sh is the most complete CT source but also the
 * least reliable: it rate-limits hard per IP and buckles under load, which is
 * what made this tool time out so often. So:
 *
 *   1. When `useCertSpotter` is set (the extension), query crt.sh and
 *      CertSpotter concurrently and take whichever answers FIRST. We don't
 *      wait for both — the whole point is latency, and either source alone
 *      gives a useful answer.
 *   2. If that round fails entirely, back off and retry crt.sh once. The
 *      backoff matters: crt.sh's failures are dominated by transient
 *      overload, and retrying instantly just gets rejected again.
 *
 * Worst case is ~12s + 0.8s + 10s, inside the Cloudflare Worker budget.
 */
export async function discoverSubdomains(
  domain: string,
  options: SubdomainOptions = {}
): Promise<SubdomainResult> {
  const { signal, useCertSpotter = false } = options;
  const asciiDomain = toAsciiDomain(domain).toLowerCase();

  const round = (timeoutMs: number) => {
    const tasks = [fetchCrtSh(asciiDomain, timeoutMs, signal)];
    if (useCertSpotter) tasks.push(fetchCertSpotter(asciiDomain, timeoutMs, signal));
    return firstSuccess(tasks);
  };

  let data: CtRecord[];
  try {
    data = await round(12_000);
  } catch (firstErr) {
    if (signal?.aborted) throw firstErr;
    await sleep(800);
    try {
      data = await round(10_000);
    } catch {
      // Surface the original error — it's the more informative one.
      throw firstErr;
    }
  }

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
