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
  if (!origin) return false;
  if (origin.startsWith('chrome-extension://')) {
    return EXTENSION_IDS.has(origin.slice('chrome-extension://'.length));
  }
  // Firefox extensions get a UUID under moz-extension://; allow any for now.
  // Once we have a stable AMO UUID we can lock this down.
  if (origin.startsWith('moz-extension://')) return true;
  return ALLOWED_ORIGINS.has(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin! : 'https://ldns.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}
