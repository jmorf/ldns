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
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = FETCH_TIMEOUT
): Promise<Response> {
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
export async function fetchServerInfo(urlOrDomain: string, useHttp = false): Promise<ServerInfo> {
  const url = normalizeUrl(urlOrDomain, useHttp);
  const startTime = performance.now();

  let response: Response;
  try {
    // Try HEAD first (faster, less data transfer)
    response = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store'
    });
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
    });
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
export async function traceRedirects(urlOrDomain: string, useHttp = false): Promise<RedirectTrace> {
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
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      response = await fetchWithTimeout(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store'
      });
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
        });
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
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    finalResponse = await fetchWithTimeout(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store'
    });
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
}

/**
 * Analyze a domain/URL — trace redirects and fetch the final URL's headers.
 * Throws on network/CORS failures so the state runner can surface the error.
 */
export async function analyzeServer(urlOrDomain: string, options: AnalyzeOptions = {}): Promise<ServerAnalysis> {
  const { useHttp = false } = options;

  // First trace redirects to find final URL
  const redirects = await traceRedirects(urlOrDomain, useHttp);
  // Then get detailed info from final URL
  const info = await fetchServerInfo(redirects.finalUrl);

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
