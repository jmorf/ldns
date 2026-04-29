/**
 * Thin helper around Cloudflare Workers' default Cache API. Workers responses
 * are NOT auto-stored at the edge — Cache-Control headers we set are honoured
 * by the browser only, never by Cloudflare's CDN unless we explicitly call
 * `caches.default.put()`. This wrapper does that.
 *
 * Use it for endpoints whose responses are expensive to regenerate (sitemaps)
 * or whose upstream is flaky (crt.sh-backed routes). The cache is keyed on the
 * full Request URL by default; pass an override key when you need to share
 * one cached body across query-string variants.
 *
 * In SvelteKit dev (Node) the `caches` global doesn't exist, so we no-op and
 * just call the generator.
 */

import type { RequestEvent } from '@sveltejs/kit';

type CachesGlobal = { default: Cache };
declare const caches: CachesGlobal | undefined;

interface ServeCachedOptions {
  /**
   * Override the cache key URL. Defaults to `event.request.url`. Use a
   * canonical URL when query-string differences (like a `_=<ts>` retry
   * buster) shouldn't fragment the cache.
   */
  cacheKey?: string;
  /** Skip cache read+write entirely (e.g. when the caller is force-refreshing). */
  bypass?: boolean;
}

export async function serveCached(
  event: RequestEvent,
  generator: () => Promise<Response>,
  opts: ServeCachedOptions = {}
): Promise<Response> {
  const cache = typeof caches !== 'undefined' ? caches.default : undefined;
  if (!cache || opts.bypass) return generator();

  const key = new Request(opts.cacheKey ?? event.request.url, { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return hit;

  const fresh = await generator();
  // Only cache successful responses — don't pin a 5xx for the full TTL.
  if (fresh.ok) {
    const ctx = event.platform?.ctx;
    if (ctx?.waitUntil) {
      ctx.waitUntil(cache.put(key, fresh.clone()));
    } else {
      await cache.put(key, fresh.clone());
    }
  }
  return fresh;
}
