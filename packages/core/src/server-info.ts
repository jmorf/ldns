/**
 * Server Information and Redirect Tracing Module
 */

import type { ServerInfo, RedirectHop, RedirectTrace, ServerAnalysis } from './types';
import { fetchWithTimeout, isAbortOrTimeout } from './fetch-utils';

// ─── Constants ────────────────────────────────────────────────────────

const FETCH_TIMEOUT = 30000; // 30 seconds

// ─── Helper Functions ────────────────────────────────────────────────

/**
 * Extract headers into a plain object
 */
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key.toLowerCase()] = value;
  });
  return obj;
}

/**
 * Normalize URL to ensure it has a protocol
 */
function normalizeUrl(url: string, useHttp = false): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return useHttp ? `http://${url}` : `https://${url}`;
  }
  return url;
}

/**
 * Optional SSRF guard. Server callers pass one so every fetched URL — the
 * initial domain *and* every redirect hop — is re-validated before a socket is
 * opened. Client callers (the extension, fetching on the user's own behalf)
 * pass nothing, preserving the ability to inspect e.g. a LAN router.
 */
export type UrlGuard = (url: string) => void;

/**
 * Guarded fetch: applies the SSRF guard (server only) before opening a socket
 * so a redirect to 127.0.0.1 / 169.254.169.254 / a private range can't be
 * reached, then delegates to the shared timeout/abort-composing fetch.
 */
async function guardedFetch(
  url: string,
  options: RequestInit,
  guard?: UrlGuard,
  signal?: AbortSignal
): Promise<Response> {
  if (guard) guard(url);
  return fetchWithTimeout(url, { ...options, signal }, FETCH_TIMEOUT);
}

const MAX_REDIRECTS = 20;

/**
 * Fetch a URL and return the final response.
 *
 * When a guard is present (server callers), redirects are followed MANUALLY so
 * the guard runs before every hop — `redirect: 'follow'` would let the runtime
 * connect to an intermediate hop (e.g. a 302 to 169.254.169.254) before we ever
 * see it, so the guard on only the initial + final URL is not enough. When no
 * guard is present (the extension, fetching on the user's own behalf from their
 * own browser/network), redirects are followed normally.
 */
async function followGuarded(
  url: string,
  method: 'HEAD' | 'GET',
  guard: UrlGuard | undefined,
  signal: AbortSignal | undefined
): Promise<Response> {
  if (!guard) {
    return guardedFetch(url, { method, redirect: 'follow', cache: 'no-store' }, undefined, signal);
  }

  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await guardedFetch(currentUrl, { method, redirect: 'manual', cache: 'no-store' }, guard, signal);
    // `redirect: 'manual'` on Workers/Node yields the real 3xx with a readable
    // Location. (Browsers give an opaqueredirect we can't inspect — stop there.)
    if (res.status >= 300 && res.status < 400 && res.type !== 'opaqueredirect') {
      const location = res.headers.get('location');
      if (!location) return res;
      let next: string;
      try {
        next = new URL(location, currentUrl).href;
      } catch {
        return res;
      }
      currentUrl = next; // guarded at the top of the next iteration
      continue;
    }
    return res;
  }
  throw new Error('Too many redirects');
}

// ─── Main Functions ────────────────────────────────────────────────────

/**
 * Fetch server information for a URL
 * Uses HEAD request to minimize data transfer, falls back to GET if HEAD fails
 */
export async function fetchServerInfo(
  urlOrDomain: string,
  useHttp = false,
  guard?: UrlGuard,
  signal?: AbortSignal
): Promise<ServerInfo> {
  const url = normalizeUrl(urlOrDomain, useHttp);
  const startTime = performance.now();

  let response: Response;
  try {
    // Try HEAD first (faster, less data transfer)
    response = await followGuarded(url, 'HEAD', guard, signal);
  } catch (error) {
    // If aborted or timed out, rethrow with a friendly message
    if (isAbortOrTimeout(error)) {
      throw new Error('Request timed out');
    }
    // Fallback to GET if HEAD fails (some servers block HEAD requests)
    try {
      response = await followGuarded(url, 'GET', guard, signal);
    } catch (getError) {
      if (isAbortOrTimeout(getError)) {
        throw new Error('Request timed out');
      }
      throw getError;
    }
  }

  const responseTime = Math.round(performance.now() - startTime);
  const headers = headersToObject(response.headers);

  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    responseTime,
    headers,
    server: headers['server'] || null,
    poweredBy: headers['x-powered-by'] || null,
    contentType: headers['content-type'] || null,
    contentLength: headers['content-length'] ? parseInt(headers['content-length']) : null,
    lastModified: headers['last-modified'] || null,
    cacheControl: headers['cache-control'] || null,
    age: headers['age'] ? parseInt(headers['age']) : null,
    etag: headers['etag'] || null,
    via: headers['via'] || null,
    xCache: headers['x-cache'] || null
  };
}

/**
 * Trace all redirects for a URL
 * Manually follows redirects to capture each hop
 */
export async function traceRedirects(
  urlOrDomain: string,
  useHttp = false,
  guard?: UrlGuard,
  signal?: AbortSignal
): Promise<RedirectTrace> {
  const originalUrl = normalizeUrl(urlOrDomain, useHttp);
  const hops: RedirectHop[] = [];
  let currentUrl = originalUrl;
  let totalTime = 0;
  const maxRedirects = 20;

  while (hops.length < maxRedirects) {
    const startTime = performance.now();

    let response: Response;
    try {
      response = await guardedFetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        cache: 'no-store'
      }, guard, signal);
    } catch (error) {
      if (isAbortOrTimeout(error)) {
        throw new Error('Request timed out');
      }
      response = await guardedFetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store'
      }, guard, signal);
    }

    const responseTime = Math.round(performance.now() - startTime);
    totalTime += responseTime;
    const headers = headersToObject(response.headers);

    // Handle opaqueredirect - Chrome extension quirk where we can't see redirect details
    // Make a follow request to find the actual destination
    if (response.type === 'opaqueredirect') {
      try {
        const followResponse = await guardedFetch(currentUrl, {
          method: 'HEAD',
          redirect: 'follow',
          cache: 'no-store'
        }, guard, signal);
        const finalUrl = followResponse.url;
        if (finalUrl && finalUrl !== currentUrl) {
          hops.push({
            url: currentUrl,
            status: 302,
            statusText: 'Redirect',
            location: finalUrl,
            responseTime,
            server: headers['server'] || null
          });
          currentUrl = finalUrl;
          continue;
        }
      } catch {
        /* no-op */
      }
      break;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = headers['location'];
      if (!location) break;
      // A malformed Location header shouldn't blow up the whole trace —
      // stop here and report the chain up to this point.
      let nextUrl: string;
      try {
        nextUrl = new URL(location, currentUrl).href;
      } catch {
        break;
      }
      hops.push({
        url: currentUrl,
        status: response.status,
        statusText: response.statusText,
        location: nextUrl,
        responseTime,
        server: headers['server'] || null
      });
      currentUrl = nextUrl;
    } else {
      break;
    }
  }

  // Get final response info
  const finalStartTime = performance.now();
  let finalResponse: Response;
  try {
    finalResponse = await guardedFetch(currentUrl, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store'
    }, guard, signal);
  } catch (error) {
    if (isAbortOrTimeout(error)) {
      throw new Error('Request timed out');
    }
    finalResponse = await guardedFetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store'
    }, guard, signal);
  }
  totalTime += Math.round(performance.now() - finalStartTime);

  return {
    originalUrl,
    finalUrl: currentUrl,
    hops,
    totalTime,
    redirectCount: hops.length,
    finalStatus: finalResponse.status,
    finalStatusText: finalResponse.statusText
  };
}

export interface AnalyzeOptions {
  useHttp?: boolean;
  /**
   * Optional SSRF guard applied to every fetched URL, including each redirect
   * hop. Server callers pass one; the extension omits it (the user is fetching
   * on their own behalf from their own browser/network).
   */
  guard?: UrlGuard;
  /** Optional AbortSignal so callers can cancel the whole analysis. */
  signal?: AbortSignal;
}

/**
 * Analyze a domain/URL — trace redirects and fetch the final URL's headers.
 * Throws on network/CORS failures so the state runner can surface the error.
 */
export async function analyzeServer(urlOrDomain: string, options: AnalyzeOptions = {}): Promise<ServerAnalysis> {
  const { useHttp = false, guard, signal } = options;

  // First trace redirects to find final URL
  const redirects = await traceRedirects(urlOrDomain, useHttp, guard, signal);
  // Then get detailed info from final URL
  const info = await fetchServerInfo(redirects.finalUrl, false, guard, signal);

  return {
    info,
    redirects: redirects.redirectCount > 0 ? redirects : null,
    error: null
  };
}

/**
 * Get response time color based on speed
 */
export function getResponseTimeColor(ms: number): 'green' | 'yellow' | 'red' {
  if (ms < 200) return 'green';
  if (ms < 500) return 'yellow';
  return 'red';
}

/**
 * Get HTTP status color
 */
export function getStatusColor(status: number): 'green' | 'yellow' | 'red' | 'gray' {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'yellow';
  if (status >= 400) return 'red';
  return 'gray';
}

/**
 * Format response time for display
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
