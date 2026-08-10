/**
 * Origin allow-list and CORS header helpers shared by every /api/* endpoint.
 */

const ALLOWED_ORIGINS = new Set([
  'https://ldns.com',
  'https://www.ldns.com',
  'http://localhost:5173',
  'http://localhost:4173'
]);

// Chrome extension IDs (published + dev). Add new IDs here when publishing.
const EXTENSION_IDS = new Set([
  'ehgkpjkmaichihneengcigkaoejmcofn', // Chrome Web Store (published)
  'caoebmdbbigeealihbnpofijebnoajpm' // Local dev
]);

export function isAllowedOrigin(origin: string | null): boolean {
  // Same-origin browser fetches often omit the Origin header entirely. Treat
  // null as "not a cross-origin request" → allowed. Cross-origin requests
  // always include Origin, so this only opens up the same-origin path.
  if (!origin) return true;
  if (origin.startsWith('chrome-extension://')) {
    return EXTENSION_IDS.has(origin.slice('chrome-extension://'.length));
  }
  // Firefox assigns each install its own random moz-extension:// UUID, so
  // there is no stable origin to allow-list the way Chrome's extension ID
  // works. Allowing any moz-extension origin means any installed Firefox
  // add-on can call these endpoints — acceptable because every response is
  // public DNS/domain data behind a rate limit, and nothing here is
  // authenticated or user-specific.
  // TODO: if AMO ever exposes a stable per-add-on origin, pin it here.
  if (origin.startsWith('moz-extension://')) return true;
  return ALLOWED_ORIGINS.has(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  // For same-origin requests Origin is null/empty — echo back ldns.com so we
  // never emit `Access-Control-Allow-Origin: null`.
  const allowed = origin && isAllowedOrigin(origin) ? origin : 'https://ldns.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}
