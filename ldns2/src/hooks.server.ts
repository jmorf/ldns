import type { Handle } from '@sveltejs/kit';

/**
 * Security response headers for ldns.com.
 *
 * ldns.com audits other sites' security headers, so it should set a strong set
 * itself. These are applied in the SvelteKit worker, so they cover every SSR'd
 * HTML document and every /api/* response. (Immutable static assets are served
 * directly by Cloudflare's asset layer and don't need them.)
 */

const SECURITY_HEADERS: Record<string, string> = {
  // Don't let browsers MIME-sniff responses into a different content type.
  'X-Content-Type-Options': 'nosniff',
  // Anti-clickjacking for legacy UAs; CSP frame-ancestors covers modern ones.
  'X-Frame-Options': 'SAMEORIGIN',
  // Don't leak the full looked-up URL (which contains the domain) to upstreams.
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  // Disable powerful features the app never uses (and opt out of FLoC/Topics).
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
  // 2 years, includeSubDomains, preload-eligible, the gold standard the
  // site's own HSTS audit recommends.
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
};

/**
 * Content-Security-Policy for HTML documents.
 *
 * Structural directives are strict: `default-src 'self'`, `object-src 'none'`,
 * `base-uri 'self'`, `frame-ancestors 'self'`, `form-action 'self'`: which
 * blocks injected `<base>`, plugin objects, framing/clickjacking, and exfil via
 * form posts. `script-src` is restricted to our own origin; `'unsafe-inline'`
 * is required for the inline early-paint theme script in app.html and
 * SvelteKit's hydration script. The app's HTML-injection surface is otherwise
 * minimal. All dynamic/remote data renders through Svelte's auto-escaping text
 * interpolation, and the only `{@html}` is JSON.stringify'd JSON-LD. So source
 * restriction is the meaningful win here.
 *
 * `connect-src` allows any https origin because RDAP lookups go straight from
 * the browser to each TLD registry's own RDAP server (resolved via IANA's
 * bootstrap file), and that set of hostnames is unbounded. This costs nothing
 * in practice: `img-src https:` already permits the same exfiltration channel
 * an attacker with script execution would need, and `script-src 'self'` is
 * what actually gates execution. No analytics/telemetry: the site sends no
 * tracking beacons.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests'
].join('; ');

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) response.headers.set(key, value);
  }

  // CSP only on HTML documents, it's meaningless on JSON API responses and
  // could only cause confusion there.
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html') && !response.headers.has('content-security-policy')) {
    response.headers.set('Content-Security-Policy', CSP);
  }

  return response;
};
