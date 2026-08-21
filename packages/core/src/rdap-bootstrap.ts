/**
 * IANA RDAP bootstrap: resolve which registry serves RDAP for a TLD.
 *
 * rdap.org is just a convenience proxy over this exact file; it looks up the
 * TLD and 302s to the registry. Cutting it out removes the hop that was
 * intermittently stalling for 25-35 seconds while the registries themselves
 * answer in under a second. IANA serves the file with
 * `Access-Control-Allow-Origin: *` and `Cache-Control: max-age=86400`, so
 * querying it straight from a browser is exactly how it is meant to be used.
 */

import { fetchWithTimeout } from './fetch-utils';
import { UpstreamError } from './upstream-errors';

export const IANA_RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

const BOOTSTRAP_TIMEOUT_MS = 10_000;
/** Matches IANA's own max-age. The browser HTTP cache does the real work;
 *  this in-memory memo just avoids re-parsing within one session. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** IANA bootstrap file shape (RFC 9224): services = [ [tlds…], [urls…] ][] */
interface BootstrapFile {
  services: [string[], string[]][];
}

let cache: { byTld: Map<string, string>; at: number } | null = null;

/** Test hook: drop the in-memory memo. */
export function clearRdapBootstrapCache(): void {
  cache = null;
}

function pickServiceUrl(urls: string[]): string | null {
  // Prefer https; the spec allows http entries but no registry needs them.
  const url = urls.find((u) => u.startsWith('https://')) ?? urls[0];
  if (!url) return null;
  return url.endsWith('/') ? url : `${url}/`;
}

async function loadBootstrap(signal?: AbortSignal): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.byTld;

  const res = await fetchWithTimeout(
    IANA_RDAP_BOOTSTRAP_URL,
    { headers: { Accept: 'application/json' }, signal },
    BOOTSTRAP_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new UpstreamError(`IANA RDAP bootstrap returned HTTP ${res.status}`, {
      status: res.status,
      service: 'the IANA RDAP directory'
    });
  }

  const file = (await res.json()) as BootstrapFile;
  if (!Array.isArray(file?.services)) {
    throw new UpstreamError('IANA RDAP bootstrap returned a malformed file', {
      service: 'the IANA RDAP directory'
    });
  }

  const byTld = new Map<string, string>();
  for (const [tlds, urls] of file.services) {
    const url = pickServiceUrl(urls);
    if (!url) continue;
    for (const tld of tlds) byTld.set(tld.toLowerCase(), url);
  }

  cache = { byTld, at: Date.now() };
  return byTld;
}

/**
 * RDAP base URL for a (punycoded, lowercased) domain's TLD, or null when the
 * registry publishes no RDAP service at all (e.g. .de).
 */
export async function getRdapBaseUrl(domain: string, signal?: AbortSignal): Promise<string | null> {
  const tld = domain.toLowerCase().split('.').filter(Boolean).pop();
  if (!tld) return null;
  const byTld = await loadBootstrap(signal);
  return byTld.get(tld) ?? null;
}
