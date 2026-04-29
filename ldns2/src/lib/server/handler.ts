/**
 * Common wrapper for /api/* GET handlers: enforces origin allow-list,
 * applies per-IP rate limit, then runs the user-supplied logic and
 * standardizes the JSON envelope + caching headers.
 */

import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isAllowedOrigin, corsHeaders } from './cors';
import { rateLimit, gcRateLimits, type Limit } from './ratelimit';

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

      const data = await opts.run(event);
      const isFailure = (data as { ok?: boolean })?.ok === false;
      const cacheControl = isFailure
        ? (opts.errorCache ?? DEFAULT_ERROR_CACHE)
        : (opts.cache ?? DEFAULT_SUCCESS_CACHE);

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
