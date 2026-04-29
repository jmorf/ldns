/**
 * Free TLS certificate inspection via the public crt.sh API.
 *
 * crt.sh is a Comodo-operated public Certificate Transparency log search.
 * Responses are JSON when `?output=json`. Each row is a distinct logged
 * certificate. We pick the most recent by `not_before` and surface its
 * issuer / validity / SAN list / signature algorithm.
 *
 * Limitations vs an actual TLS handshake:
 *   - cipher suite, protocol version, key size, and OCSP-stapling are NOT
 *     observable from CT logs alone.
 *   - the cert returned is "the most recent issued for this domain", which is
 *     usually the live one but in rare cases a renewal might be logged before
 *     it's deployed.
 *
 * We accept those tradeoffs in exchange for a free, unlimited-use, privacy-
 * respecting endpoint.
 */

export interface TlsCertificate {
  id: string;
  issuer: string;
  commonName: string;
  san: string[];
  notBefore: string;
  notAfter: string;
  daysUntilExpiry: number;
  daysSinceIssued: number;
  serialNumber?: string;
  source: 'crt.sh';
  ctLogUrl: string;
}

interface CrtShRow {
  issuer_ca_id: number;
  issuer_name: string;
  common_name: string;
  name_value: string;
  id: number;
  entry_timestamp: string;
  not_before: string;
  not_after: string;
  serial_number?: string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function fetchTlsCertificate(domain: string, signal?: AbortSignal): Promise<TlsCertificate | null> {
  const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json&exclude=expired&deduplicate=Y`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    if (res.status === 503) throw new Error('crt.sh is overloaded; try again');
    throw new Error(`crt.sh returned ${res.status}`);
  }
  const rows = (await res.json()) as CrtShRow[];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Most recent by not_before. crt.sh typically returns descending-ish but not guaranteed.
  rows.sort((a, b) => new Date(b.not_before).getTime() - new Date(a.not_before).getTime());
  const top = rows[0];

  const san = (top.name_value || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const now = new Date();
  const notAfter = new Date(top.not_after);
  const notBefore = new Date(top.not_before);

  return {
    id: String(top.id),
    issuer: top.issuer_name,
    commonName: top.common_name,
    san,
    notBefore: top.not_before,
    notAfter: top.not_after,
    daysUntilExpiry: daysBetween(notAfter, now),
    daysSinceIssued: daysBetween(now, notBefore),
    serialNumber: top.serial_number,
    source: 'crt.sh',
    ctLogUrl: `https://crt.sh/?id=${top.id}`
  };
}
