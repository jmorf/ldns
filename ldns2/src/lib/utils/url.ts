/**
 * Return `url` only if it parses as an http(s) URL, otherwise a harmless
 * placeholder. Use this before binding any remote-derived value (marketplace
 * listing URLs, redirect targets, etc.) to an `href`/`src`, so a
 * `javascript:`, `data:`, or other hostile scheme can never reach the DOM —
 * even if an upstream API is compromised or returns something unexpected.
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
