import { describe, it, expect } from 'vitest';
import { checkCaaAgainstIssuer, parseCaaValue } from './caa-check';

describe('parseCaaValue', () => {
  it('parses presentation format (Google DoH)', () => {
    expect(parseCaaValue('0 issue "letsencrypt.org"')).toEqual({ tag: 'issue', value: 'letsencrypt.org' });
  });

  it('parses RFC 3597 generic hex format (Cloudflare DoH)', () => {
    // \# <len> <flags> <taglen> <tag...> <value...>  — "issue" + "pki.goog"
    const hex = '\\# 15 00 05 69 73 73 75 65 70 6b 69 2e 67 6f 6f 67';
    expect(parseCaaValue(hex)).toEqual({ tag: 'issue', value: 'pki.goog' });
  });

  it('parses issuewild from hex format', () => {
    // "issuewild" (9 chars) + "ssl.com"
    const hex = '\\# 18 00 09 69 73 73 75 65 77 69 6c 64 73 73 6c 2e 63 6f 6d';
    expect(parseCaaValue(hex)).toEqual({ tag: 'issuewild', value: 'ssl.com' });
  });

  it('returns null for malformed hex', () => {
    expect(parseCaaValue('\\# 3 zz')).toBeNull();
  });
});

describe('checkCaaAgainstIssuer', () => {
  it('flags no CAA records as an unrestricted domain', () => {
    const r = checkCaaAgainstIssuer([], "C=US, O=Let's Encrypt, CN=R3");
    expect(r.verdict).toBe('no-caa');
    expect(r.allowed).toEqual([]);
  });

  it('works with Cloudflare hex-encoded CAA records end to end', () => {
    // Regression: Cloudflare (our default resolver) returns this form, and the
    // check previously reported "no CAA records" for every such domain.
    const r = checkCaaAgainstIssuer(
      ['\\# 15 00 05 69 73 73 75 65 70 6b 69 2e 67 6f 6f 67'],
      'C=US, O=Google Trust Services LLC, CN=GTS CA 1P5'
    );
    expect(r.verdict).toBe('covered');
    expect(r.allowed).toEqual(['pki.goog']);
  });

  it('confirms coverage when CAA permits the actual issuer', () => {
    const r = checkCaaAgainstIssuer(['0 issue "letsencrypt.org"'], "C=US, O=Let's Encrypt, CN=R3");
    expect(r.verdict).toBe('covered');
    expect(r.detectedCa).toBe("Let's Encrypt");
  });

  it('catches a certificate from a CA the CAA does not permit', () => {
    // The finding that matters: issuance works now, renewal may not.
    const r = checkCaaAgainstIssuer(['0 issue "letsencrypt.org"'], 'C=US, O=DigiCert Inc, CN=DigiCert TLS RSA CA');
    expect(r.verdict).toBe('not-covered');
    expect(r.detectedCa).toBe('DigiCert');
    expect(r.explanation).toMatch(/renewals/i);
  });

  it('handles issuewild and multiple records', () => {
    const r = checkCaaAgainstIssuer(
      ['0 issue "pki.goog"', '0 issuewild "letsencrypt.org"'],
      'C=US, O=Google Trust Services LLC, CN=GTS CA 1P5'
    );
    expect(r.verdict).toBe('covered');
    expect(r.allowed).toEqual(['pki.goog', 'letsencrypt.org']);
  });

  it('strips CAA parameters after a semicolon', () => {
    const r = checkCaaAgainstIssuer(
      ['0 issue "letsencrypt.org; accounturi=https://acme-v02.api.letsencrypt.org/acct/123"'],
      "O=Let's Encrypt"
    );
    expect(r.allowed).toEqual(['letsencrypt.org']);
    expect(r.verdict).toBe('covered');
  });

  it('dedupes CAs listed under both issue and issuewild', () => {
    const r = checkCaaAgainstIssuer(
      ['0 issue "letsencrypt.org"', '0 issuewild "letsencrypt.org"', '0 issue "pki.goog"'],
      "O=Let's Encrypt"
    );
    expect(r.allowed).toEqual(['letsencrypt.org', 'pki.goog']);
  });

  it('reports unknown when the issuer cannot be matched', () => {
    const r = checkCaaAgainstIssuer(['0 issue "letsencrypt.org"'], 'C=XX, O=Some Regional CA');
    expect(r.verdict).toBe('unknown-issuer');
    expect(r.detectedCa).toBeNull();
  });

  it('reports unknown when there is no certificate to compare', () => {
    const r = checkCaaAgainstIssuer(['0 issue "letsencrypt.org"'], null);
    expect(r.verdict).toBe('unknown-issuer');
  });

  it('detects a CAA policy that forbids all issuance', () => {
    const r = checkCaaAgainstIssuer(['0 issue ";"'], "O=Let's Encrypt");
    expect(r.verdict).toBe('forbids-all');
  });

  it('ignores non-issue tags like iodef', () => {
    const r = checkCaaAgainstIssuer(['0 iodef "mailto:security@example.com"'], "O=Let's Encrypt");
    expect(r.verdict).toBe('no-caa');
  });
});
