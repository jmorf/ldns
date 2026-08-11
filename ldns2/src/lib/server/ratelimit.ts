/**
 * Per-IP, per-endpoint rate limit. Uses an in-memory map; under Cloudflare's
 * request routing the same client may hit different worker instances so this
 * is a per-instance cap, not a global one. That is good enough for abuse
 * mitigation, every instance still rejects runaway clients within ~1 minute.
 *
 * If we ever need a global ceiling, swap this for a Workers KV namespace with
 * `{ip}:{endpoint}` keys and a numeric counter; the call sites stay identical.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const WINDOW_MS = 60_000;

export interface Limit {
  requestsPerMinute: number;
}

export const DEFAULT_LIMIT: Limit = { requestsPerMinute: 30 };

/** Returns true if the request is allowed; false if rate-limited. */
export function rateLimit(key: string, limit: Limit = DEFAULT_LIMIT): boolean {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= limit.requestsPerMinute) return false;
  entry.count++;
  return true;
}

/** Periodic GC. Cheap; called per request. */
export function gcRateLimits(): void {
  const now = Date.now();
  for (const [k, v] of windows) if (now > v.resetAt) windows.delete(k);
}
