/**
 * Lightweight security/feature checks derived from a HEAD response,
 * plus two small network probes (security.txt/robots.txt existence and
 * HSTS-preload status).
 */
import { fetchWithTimeout } from './fetch-utils';

export interface SecurityHeaderCheck {
  key: string;
  label: string;
  present: boolean;
  value: string | null;
  level: 'ok' | 'warn' | 'bad';
  hint: string;
}

const HEADER_CHECKS: Array<{ key: string; label: string }> = [
  { key: 'strict-transport-security', label: 'HSTS' },
  { key: 'content-security-policy', label: 'CSP' },
  { key: 'x-content-type-options', label: 'X-Content-Type' },
  { key: 'x-frame-options', label: 'X-Frame' },
  { key: 'referrer-policy', label: 'Referrer-Policy' },
  { key: 'permissions-policy', label: 'Permissions-Policy' }
];

function evaluateHeader(key: string, value: string | undefined): SecurityHeaderCheck {
  const meta = HEADER_CHECKS.find((c) => c.key === key)!;
  if (!value) {
    return { key, label: meta.label, present: false, value: null, level: 'bad', hint: 'Not set' };
  }
  // Specific quality checks
  if (key === 'strict-transport-security') {
    const m = /max-age=(\d+)/i.exec(value);
    const maxAge = m ? parseInt(m[1], 10) : 0;
    if (maxAge < 60 * 60 * 24 * 180) {
      return { key, label: meta.label, present: true, value, level: 'warn', hint: 'max-age below 180d' };
    }
    return { key, label: meta.label, present: true, value, level: 'ok', hint: 'OK' };
  }
  if (key === 'x-content-type-options') {
    return value.toLowerCase().includes('nosniff')
      ? { key, label: meta.label, present: true, value, level: 'ok', hint: 'OK' }
      : { key, label: meta.label, present: true, value, level: 'warn', hint: 'Not nosniff' };
  }
  return { key, label: meta.label, present: true, value, level: 'ok', hint: 'Set' };
}

export function auditSecurityHeaders(headers: Record<string, string>): SecurityHeaderCheck[] {
  return HEADER_CHECKS.map((c) => evaluateHeader(c.key, headers[c.key]));
}

export interface AltSvcInfo {
  http3: boolean;
  raw: string | null;
}

export function detectAltSvc(headers: Record<string, string>): AltSvcInfo {
  const raw = headers['alt-svc'] || null;
  if (!raw) return { http3: false, raw: null };
  return { http3: /\bh3\b/i.test(raw), raw };
}

/**
 * Probe an URL with a HEAD request, returning whether it exists (2xx or 3xx).
 */
export async function probeExists(url: string, timeoutMs = 6000, signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow', signal }, timeoutMs);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check the public HSTS preload list status for a domain.
 * Returns 'preloaded' | 'pending' | 'unknown' | null on error.
 */
export async function checkHstsPreload(domain: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://hstspreload.org/api/v2/status?domain=${encodeURIComponent(domain)}`,
      { signal },
      6000
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { status?: string };
    return json.status ?? null;
  } catch {
    return null;
  }
}
