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
  // Firefox extensions get a UUID under moz-extension://; allow any for now.
  // Once we have a stable AMO UUID we can lock this down.
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
