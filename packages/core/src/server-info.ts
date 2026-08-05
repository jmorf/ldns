/**
 * Server Information and Redirect Tracing Module
 * Imported from LDNS2 - keep in sync with /Users/j/code/ldns/ldns2/src/lib/server-info.ts
 */

import type { ServerInfo, RedirectHop, RedirectTrace, ServerAnalysis } from './types';

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
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  guard?: UrlGuard,
  timeout = FETCH_TIMEOUT
): Promise<Response> {
  // SSRF guard (server only): reject the target before opening a socket so a
  // redirect to 127.0.0.1 / 169.254.169.254 / a private range can't be reached.
  if (guard) guard(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Main Functions ────────────────────────────────────────────────────

/**
 * Fetch server information for a URL
 * Uses HEAD request to minimize data transfer, falls back to GET if HEAD fails
 */
export async function fetchServerInfo(urlOrDomain: string, useHttp = false, guard?: UrlGuard): Promise<ServerInfo> {
  const url = normalizeUrl(urlOrDomain, useHttp);
  const startTime = performance.now();

  let response: Response;
  try {
    // Try HEAD first (faster, less data transfer)
    response = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store'
    }, guard);
  } catch (error) {
    // If aborted, rethrow
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    // Fallback to GET if HEAD fails (some servers block HEAD requests)
    response = await fetchWithTimeout(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    }, guard);
  }

  // `redirect: 'follow'` resolves the chain internally; re-validate where it
  // actually landed so a redirect onto an internal host can't return data.
  if (guard) guard(response.url);

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
export async function traceRedirects(urlOrDomain: string, useHttp = false, guard?: UrlGuard): Promise<RedirectTrace> {
  const originalUrl = normalizeUrl(urlOrDomain, useHttp);
  const hops: RedirectHop[] = [];
  let currentUrl = originalUrl;
  let totalTime = 0;
  const maxRedirects = 20;

  while (hops.length < maxRedirects) {
    const startTime = performance.now();

    let response: Response;
    try {
      response = await fetchWithTimeout(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        cache: 'no-store'
      }, guard);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      response = await fetchWithTimeout(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store'
      }, guard);
    }

    const responseTime = Math.round(performance.now() - startTime);
    totalTime += responseTime;
    const headers = headersToObject(response.headers);

    // Handle opaqueredirect - Chrome extension quirk where we can't see redirect details
    // Make a follow request to find the actual destination
    if (response.type === 'opaqueredirect') {
      try {
        const followResponse = await fetchWithTimeout(currentUrl, {
          method: 'HEAD',
          redirect: 'follow',
          cache: 'no-store'
        }, guard);
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
      const nextUrl = new URL(location, currentUrl).href;
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
    finalResponse = await fetchWithTimeout(currentUrl, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store'
    }, guard);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    finalResponse = await fetchWithTimeout(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store'
    }, guard);
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
}

/**
 * Analyze a domain/URL — trace redirects and fetch the final URL's headers.
 * Throws on network/CORS failures so the state runner can surface the error.
 */
export async function analyzeServer(urlOrDomain: string, options: AnalyzeOptions = {}): Promise<ServerAnalysis> {
  const { useHttp = false, guard } = options;

  // First trace redirects to find final URL
  const redirects = await traceRedirects(urlOrDomain, useHttp, guard);
  // Then get detailed info from final URL
  const info = await fetchServerInfo(redirects.finalUrl, false, guard);

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
