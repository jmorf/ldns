import psl from 'psl';

export interface ParsedDomain {
  input: string;
  tld: string;
  sld: string;
  subdomain: string;
  rootDomain: string;
  isValid: boolean;
}

const empty: ParsedDomain = { input: '', tld: '', sld: '', subdomain: '', rootDomain: '', isValid: false };

// Memoize, parse() is invoked many times per render via getters.
const cache = new Map<string, ParsedDomain>();
const MAX_CACHE = 100;

export function parseDomain(name: string): ParsedDomain {
  if (!name) return empty;
  const normalizedName = name.toLowerCase().trim();
  const cached = cache.get(normalizedName);
  if (cached) return cached;

  const result: ParsedDomain = { ...empty, input: name };
  try {
    const parsed = psl.parse(normalizedName);
    if (psl.isValid(normalizedName) && 'tld' in parsed) {
      result.isValid = true;
      result.tld = parsed.tld || '';
      result.sld = parsed.sld || '';
      result.subdomain = parsed.subdomain || '';
      result.rootDomain = parsed.domain || '';
    }
  } catch {
    /* fall through to invalid */
  }

  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(normalizedName, result);
  return result;
}

export function getRootDomain(name: string): string {
  return parseDomain(name).rootDomain;
}

export function isValidDomain(name: string): boolean {
  return parseDomain(name).isValid;
}

/**
 * Convert a possibly-Unicode (IDN) domain to its ASCII/punycode form.
 * DoH endpoints, RDAP, and crt.sh all reject raw Unicode query names,
 * `münchen.de` must be sent as `xn--mnchen-3ya.de`. The URL parser applies
 * IDNA per the WHATWG spec (and handles `_dmarc.`-style underscore labels).
 * Returns the input unchanged if it can't be parsed as a hostname.
 */
export function toAsciiDomain(name: string): string {
  try {
    return new URL(`http://${name}`).hostname;
  } catch {
    return name;
  }
}

/**
 * Extract the hostname from user input that looks like a URL: handles full
 * URLs, scheme-less `host/path`, `host:port`, and `host?query` forms.
 */
export function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url.includes('://') ? url : `http://${url}`).hostname;
  } catch {
    return '';
  }
}
