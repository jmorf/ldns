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

// Memoize — parse() is invoked many times per render via getters.
const cache = new Map<string, ParsedDomain>();
const MAX_CACHE = 100;

/**
 * No-op kept for compatibility — psl is now synchronously imported. This
 * function used to trigger a dynamic import; we keep it so other call sites
 * don't need updating, and so future re-introduction of lazy loading is easy.
 */
export function preloadPsl(): Promise<void> {
  return Promise.resolve();
}

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

export function getTld(name: string): string {
  return parseDomain(name).tld;
}

export function getSld(name: string): string {
  return parseDomain(name).sld;
}

export function getSubdomain(name: string): string {
  return parseDomain(name).subdomain;
}

export function getRootDomain(name: string): string {
  return parseDomain(name).rootDomain;
}

export function isValidDomain(name: string): boolean {
  return parseDomain(name).isValid;
}

export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/);
    return match ? match[1] : '';
  }
}
