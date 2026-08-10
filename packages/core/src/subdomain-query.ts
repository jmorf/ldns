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

/**
 * Fetch and parse crt.sh results with a single timeout covering the entire
 * operation (connect + body download + JSON parse).
 *
 * crt.sh either responds in <3s or hangs essentially forever, so a long
 * timeout buys nothing — it just burns more of the Cloudflare Worker's
 * 30-second budget that could be spent on a retry. 12s is generous enough
 * to cover a slow-but-alive response while leaving room for one retry
 * within the Worker wall-clock.
 */
async function fetchCrtSh(domain: string, timeoutMs: number, signal?: AbortSignal): Promise<CrtShEntry[]> {
  const url = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json&exclude=expired`;

  try {
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' },
      signal
    }, timeoutMs);

    if (response.status === 503) {
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
    return data as CrtShEntry[];
  } catch (err) {
    if (isAbortOrTimeout(err)) {
      throw new Error('crt.sh request timed out. Try again.');
    }
    throw err;
  }
}

/**
 * Discover subdomains for a domain using Certificate Transparency logs (crt.sh).
 * Deduplicates, strips wildcards, and sorts alphabetically.
 *
 * Retry strategy: one quick retry on failure with a shorter timeout. Total
 * worst-case wall-clock is ~21s (12s + 0.5s sleep + 8s) — inside the
 * Cloudflare Worker subrequest budget. crt.sh's failures are dominated
 * by transient 502s and a single fast retry usually rides over them.
 */
export async function discoverSubdomains(domain: string, signal?: AbortSignal): Promise<SubdomainResult> {
  const asciiDomain = toAsciiDomain(domain).toLowerCase();

  let data: CrtShEntry[];
  try {
    data = await fetchCrtSh(asciiDomain, 12_000, signal);
  } catch (firstErr) {
    // Don't retry a cancelled request.
    if (signal?.aborted) throw firstErr;
    await new Promise((r) => setTimeout(r, 500));
    try {
      data = await fetchCrtSh(asciiDomain, 8_000, signal);
    } catch {
      // Throw the original error — it's more informative for the classifier.
      throw firstErr;
    }
  }

  const subdomainSet = new Set<string>();
  const certificates: CertInfo[] = [];

  for (const cert of data) {
    const names = cert.name_value?.split('\n') || [];
    for (const name of names) {
      const clean = name.trim().toLowerCase().replace(/^\*\./, '');
      if (clean && clean !== asciiDomain && clean.endsWith(`.${asciiDomain}`)) {
        subdomainSet.add(clean);
      }
    }

    if (certificates.length < 20) {
      certificates.push({
        id: String(cert.id),
        issuer: cert.issuer_name,
        notBefore: cert.not_before,
        notAfter: cert.not_after,
        commonName: cert.common_name || ''
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
