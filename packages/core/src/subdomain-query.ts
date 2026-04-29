import type { SubdomainResult, CertInfo } from './types';

interface CrtShEntry {
  id: string;
  issuer_name: string;
  not_before: string;
  not_after: string;
  name_value?: string;
  common_name?: string;
}

function isAbortOrTimeout(err: unknown): boolean {
  if (err instanceof DOMException) {
    return err.name === 'TimeoutError' || err.name === 'AbortError';
  }
  if (err instanceof Error) {
    return err.message.includes('aborted') || err.message.includes('timed out');
  }
  return false;
}

/**
 * Fetch and parse crt.sh results with a single AbortSignal covering the
 * entire operation (connect + body download + JSON parse).
 */
async function fetchCrtSh(domain: string): Promise<CrtShEntry[]> {
  const url = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json&exclude=expired`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    if (response.status === 503) {
      throw new Error('crt.sh is temporarily overloaded. Try again in a moment.');
    }

    if (!response.ok) {
      throw new Error(`CT log query failed (${response.status})`);
    }

    const data: CrtShEntry[] = await response.json();
    return data;
  } catch (err) {
    if (isAbortOrTimeout(err)) {
      throw new Error('crt.sh request timed out. Try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Discover subdomains for a domain using Certificate Transparency logs (crt.sh).
 * Deduplicates, strips wildcards, and sorts alphabetically.
 * Retries once on failure.
 */
export async function discoverSubdomains(domain: string): Promise<SubdomainResult> {
  let data: CrtShEntry[];
  try {
    data = await fetchCrtSh(domain);
  } catch (firstErr) {
    // Retry once after a short delay
    await new Promise(r => setTimeout(r, 2000));
    try {
      data = await fetchCrtSh(domain);
    } catch {
      // Throw the original error — it's more informative
      throw firstErr;
    }
  }

  const subdomainSet = new Set<string>();
  const certificates: CertInfo[] = [];

  for (const cert of data) {
    const names = cert.name_value?.split('\n') || [];
    for (const name of names) {
      const clean = name.trim().toLowerCase().replace(/^\*\./, '');
      if (clean && clean !== domain.toLowerCase() && clean.endsWith(`.${domain.toLowerCase()}`)) {
        subdomainSet.add(clean);
      }
    }

    if (certificates.length < 20) {
      certificates.push({
        id: cert.id,
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
