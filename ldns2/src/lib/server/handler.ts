/**
 * Common wrapper for /api/* GET handlers: enforces origin allow-list,
 * applies per-IP rate limit, runs the user-supplied logic, standardizes
 * the JSON envelope + caching headers, and stores successful responses in
 * Cloudflare's edge cache (caches.default).
 *
 * Why we manage the edge cache ourselves: Cloudflare Workers responses
 * are NOT auto-cached by the CDN — Cache-Control headers we set are
 * honored by the browser only. Without an explicit caches.default.put
 * call, every request goes back to origin (and through to the upstream
 * service). For flaky upstreams like crt.sh, that means every retry
 * during an outage hits the upstream again.
 */

import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isAllowedOrigin, corsHeaders } from './cors';
import { rateLimit, gcRateLimits, type Limit } from './ratelimit';

type CachesGlobal = { default: Cache };
declare const caches: CachesGlobal | undefined;

export interface HandlerOptions<TPayload> {
  /** Endpoint label used in the rate-limit key. */
  endpoint: string;
  /** Optional per-endpoint rate limit (defaults to 30/min). */
  limit?: Limit;
  /** Cache-Control header for successful (ok:true) responses. */
  cache?: string;
  /**
   * Cache-Control for ok:false structured failures. Defaults to a short
   * window so a flaky upstream doesn't pin a cached error in the CDN
   * for the full success TTL.
   */
  errorCache?: string;
  /** The actual logic — receives parsed query params. */
  run(event: RequestEvent): Promise<TPayload>;
}

const DEFAULT_SUCCESS_CACHE = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
const DEFAULT_ERROR_CACHE = 'public, max-age=30, s-maxage=300, stale-while-revalidate=600';

/**
 * Build a stable cache key from the request URL with the `_=…` retry buster
 * stripped. `?_=12345` is the proxy-client's mechanism for forcing a fresh
 * upstream fetch — we shouldn't pollute the cache with one entry per
 * timestamp, so the buster is removed from the read+write key but the
 * request itself still bypasses cache when the buster is present.
 *
 * Uses event.url (already-parsed URL) rather than event.request.url so it
 * works in both production (absolute) and the vitest harness (relative).
 */
function buildCacheKey(eventUrl: URL): { key: Request; bustered: boolean } {
  const url = new URL(eventUrl);
  const bustered = url.searchParams.has('_');
  if (bustered) url.searchParams.delete('_');
  return {
    key: new Request(url.toString(), { method: 'GET' }),
    bustered
  };
}

export function createHandler<T>(opts: HandlerOptions<T>) {
  return {
    GET: async (event: RequestEvent) => {
      const origin = event.request.headers.get('origin');
      if (!isAllowedOrigin(origin)) throw error(403, 'Origin not allowed');

      const ip = event.getClientAddress();
      gcRateLimits();
      if (!rateLimit(`${opts.endpoint}:${ip}`, opts.limit)) {
        throw error(429, 'Too many requests. Please try again in a minute.');
      }

      const cache = typeof caches !== 'undefined' ? caches.default : null;
      const { key, bustered } = buildCacheKey(event.url);

      // Read-through: serve cached success directly. Skip on retry-bust.
      if (cache && !bustered) {
        const hit = await cache.match(key);
        if (hit) {
          // Re-stamp CORS headers from the actual request's Origin so the
          // cached body works for any allowed origin (extension, ldns.com
          // itself, dev, etc.) without fragmenting the cache by Origin.
          const headers = new Headers(hit.headers);
          for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
          return new Response(hit.body, { status: hit.status, headers });
        }
      }

      const data = await opts.run(event);
      const isFailure = (data as { ok?: boolean })?.ok === false;
      const cacheControl = isFailure
        ? (opts.errorCache ?? DEFAULT_ERROR_CACHE)
        : (opts.cache ?? DEFAULT_SUCCESS_CACHE);

      // Store an origin-agnostic copy in the edge cache. Don't include CORS
      // headers in the cached body — those get re-stamped on every read.
      // Failures are intentionally NOT cached so the user can retry when
      // the upstream comes back without waiting for a 5-minute window.
      // Forced retries DO populate the cache on success so the next
      // non-bust request hits the cache instead of the upstream again.
      if (cache && !isFailure) {
        const cacheBody = JSON.stringify(data);
        const cacheable = new Response(cacheBody, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': cacheControl
          }
        });
        const ctx = event.platform?.ctx;
        if (ctx?.waitUntil) {
          ctx.waitUntil(cache.put(key, cacheable));
        } else {
          // Fire-and-forget in non-platform contexts (dev / tests).
          cache.put(key, cacheable).catch(() => {});
        }
      }

      return json(data, {
        headers: {
          'Cache-Control': cacheControl,
          ...corsHeaders(origin)
        }
      });
    },
    OPTIONS: async (event: RequestEvent) => {
      const origin = event.request.headers.get('origin');
      if (!isAllowedOrigin(origin)) throw error(403, 'Origin not allowed');
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
  };
}
