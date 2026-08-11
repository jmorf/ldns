/**
 * Cross-check a domain's CAA policy against the CA that actually issued its
 * certificate.
 *
 * CAA records say which CAs are *allowed* to issue for a domain. Certificate
 * Transparency says who *did*. We already fetch both, so comparing them is
 * free (no extra network requests), and it surfaces two real problems:
 *
 *   1. CAA that doesn't cover your actual issuer. Issuance works today
 *      (the CA checked CAA at issuance and something matched, or the record
 *      changed since), but your next renewal can fail: often silently, at
 *      3am, via an automated ACME client.
 *   2. CAA that is narrower than you think, e.g. allowing `letsencrypt.org`
 *      while your cert comes from a CDN's own CA.
 *
 * A domain with no CAA records allows any CA: worth flagging as a hardening
 * opportunity, not an error.
 */

/**
 * CAA issuer identifiers mapped to the strings that appear in CT issuer
 * names. Matching is intentionally loose: CT issuer strings are free-form
 * (e.g. "C=US, O=Let's Encrypt, CN=R3") and vary by intermediate.
 */
const CA_IDENTIFIERS: Array<{ caa: string; match: RegExp; name: string }> = [
  { caa: 'letsencrypt.org', match: /let'?s encrypt/i, name: "Let's Encrypt" },
  { caa: 'pki.goog', match: /google trust services|\bGTS\b/i, name: 'Google Trust Services' },
  { caa: 'digicert.com', match: /digicert/i, name: 'DigiCert' },
  { caa: 'sectigo.com', match: /sectigo|comodo/i, name: 'Sectigo' },
  { caa: 'globalsign.com', match: /globalsign/i, name: 'GlobalSign' },
  { caa: 'amazon.com', match: /amazon/i, name: 'Amazon' },
  { caa: 'amazontrust.com', match: /amazon/i, name: 'Amazon Trust' },
  { caa: 'awstrust.com', match: /amazon/i, name: 'Amazon Trust' },
  { caa: 'godaddy.com', match: /go ?daddy|starfield/i, name: 'GoDaddy' },
  { caa: 'entrust.net', match: /entrust/i, name: 'Entrust' },
  { caa: 'buypass.com', match: /buypass/i, name: 'Buypass' },
  { caa: 'zerossl.com', match: /zerossl/i, name: 'ZeroSSL' },
  { caa: 'certainly.com', match: /certainly/i, name: 'Certainly' },
  { caa: 'ssl.com', match: /ssl\.com/i, name: 'SSL.com' },
  { caa: 'actalis.it', match: /actalis/i, name: 'Actalis' },
  { caa: 'apple.com', match: /apple/i, name: 'Apple' }
];

export type CaaVerdict = 'no-caa' | 'covered' | 'not-covered' | 'unknown-issuer' | 'forbids-all';

export interface CaaIssuerCheck {
  verdict: CaaVerdict;
  /** `issue` / `issuewild` values found in the CAA records. */
  allowed: string[];
  /** The CA we matched from the certificate's issuer string, if recognized. */
  detectedCa: string | null;
  rawIssuer: string | null;
  explanation: string;
}

/**
 * Extract tag and value from a CAA record's rdata.
 *
 * Resolvers disagree on how they serialize CAA over DoH JSON:
 *
 *   - Google returns presentation format:  `0 issue "letsencrypt.org"`
 *   - Cloudflare returns RFC 3597 generic format for record types it doesn't
 *     render:  `\# 19 00 05 69 73 73 75 65 63 6f 6d 6f 64 6f 63 61 2e 63 6f 6d`
 *, a length followed by hex octets: flags(1) tagLength(1) tag value.
 *
 * We must handle both, or this check silently reports "no CAA records" for
 * every user on the default resolver.
 */
export function parseCaaValue(record: string): { tag: string; value: string } | null {
  const raw = record.trim();

  // RFC 3597 generic (hex) form.
  if (raw.startsWith('\\#')) {
    const tokens = raw.slice(2).trim().split(/\s+/);
    // First token is the rdata length; the rest are hex octets.
    const octets = tokens.slice(1);
    if (octets.length < 3) return null;
    const bytes = octets.map((h) => parseInt(h, 16));
    if (bytes.some((b) => Number.isNaN(b))) return null;

    const tagLen = bytes[1];
    if (tagLen <= 0 || bytes.length < 2 + tagLen) return null;
    const decode = (arr: number[]) => arr.map((b) => String.fromCharCode(b)).join('');
    const tag = decode(bytes.slice(2, 2 + tagLen)).toLowerCase();
    const value = decode(bytes.slice(2 + tagLen)).trim().toLowerCase();
    return { tag, value };
  }

  // Presentation form: <flags> <tag> "<value>"
  const m = raw.match(/^\s*(\d+)\s+(\w+)\s+"?([^"]*)"?\s*$/);
  if (!m) return null;
  return { tag: m[2].toLowerCase(), value: m[3].trim().toLowerCase() };
}

/**
 * Compare CAA records against the issuer of the certificate actually in use.
 *
 * @param caaRecords Raw CAA rdata strings from the DNS lookup.
 * @param certIssuer The issuer string from Certificate Transparency.
 */
export function checkCaaAgainstIssuer(
  caaRecords: string[],
  certIssuer: string | null | undefined
): CaaIssuerCheck {
  const parsed = caaRecords.map(parseCaaValue).filter((p): p is { tag: string; value: string } => p !== null);
  const issueValues = parsed.filter((p) => p.tag === 'issue' || p.tag === 'issuewild').map((p) => p.value);

  const rawIssuer = certIssuer?.trim() || null;

  if (issueValues.length === 0) {
    return {
      verdict: 'no-caa',
      allowed: [],
      detectedCa: null,
      rawIssuer,
      explanation:
        'No CAA records. Any certificate authority is permitted to issue for this domain. Adding CAA restricts issuance to the CAs you actually use.'
    };
  }

  // RFC 8659: `issue ";"` means NO CA may issue. Check before stripping
  // parameters, since the bare ";" would otherwise be filtered away and
  // misread as "no CAA present". The opposite of what it means.
  if (issueValues.every((v) => v === ';' || v === '')) {
    return {
      verdict: 'forbids-all',
      allowed: issueValues,
      detectedCa: null,
      rawIssuer,
      explanation:
        'CAA explicitly forbids all certificate issuance for this domain. If you need a certificate, this record must change first.'
    };
  }

  // A CAA value can carry parameters after a semicolon (e.g. account binding).
  // Dedupe: `issue` and `issuewild` usually name the same CAs, and listing
  // each twice makes the policy look more complicated than it is.
  const allowed = [...new Set(issueValues.map((v) => v.split(';')[0].trim()).filter(Boolean))];

  if (!rawIssuer) {
    return {
      verdict: 'unknown-issuer',
      allowed,
      detectedCa: null,
      rawIssuer: null,
      explanation: `CAA restricts issuance to ${allowed.join(', ')}. No certificate was found to compare against.`
    };
  }

  const detected = CA_IDENTIFIERS.find((c) => c.match.test(rawIssuer));
  if (!detected) {
    return {
      verdict: 'unknown-issuer',
      allowed,
      detectedCa: null,
      rawIssuer,
      explanation: `CAA allows ${allowed.join(', ')}. The issuing CA could not be matched to a known CAA identifier, so this could not be verified automatically.`
    };
  }

  // A CAA value covers the issuer if it matches the CA's identifier, or is a
  // parent domain of it (CAs publish several identifiers).
  const covered = allowed.some((a) => {
    const matchesSame = CA_IDENTIFIERS.some((c) => c.caa === a && c.name === detected.name);
    return matchesSame || a === detected.caa || detected.caa.endsWith(`.${a}`);
  });

  return covered
    ? {
        verdict: 'covered',
        allowed,
        detectedCa: detected.name,
        rawIssuer,
        explanation: `CAA permits ${detected.name}, which is the CA that issued the current certificate.`
      }
    : {
        verdict: 'not-covered',
        allowed,
        detectedCa: detected.name,
        rawIssuer,
        explanation: `The current certificate was issued by ${detected.name}, but CAA only permits ${allowed.join(', ')}. Renewals through ${detected.name} may fail, check this before the certificate expires.`
      };
}
