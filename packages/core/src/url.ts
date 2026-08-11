/**
 * Return `url` only if it parses as an http(s) URL, otherwise a harmless
 * placeholder. Use this before binding any remote-derived value (marketplace
 * listing URLs, BIMI logo URLs from DNS TXT records, etc.) to an `href`, so a
 * `javascript:`, `data:`, or other hostile scheme can never reach the DOM,
 * even if an upstream response is compromised or unexpected.
 */
export function safeHttpUrl(url: string | null | undefined, fallback = '#'): string {
  if (!url) return fallback;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : fallback;
  } catch {
    return fallback;
  }
}
