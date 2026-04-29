/**
 * Typed client for the /api/* endpoints. Pages and components call these
 * helpers instead of using fetch directly so the URL structure can change
 * without ripple effects.
 */

import type {
  ServerInfo,
  RedirectTrace,
  TechDetection,
  AsnInfo
} from '@ldns/core/types';
import type { SecurityHeaderCheck, AltSvcInfo } from '@ldns/core/security-checks';
import type { TlsCertificate } from '@ldns/core/tls-query';
import type { DkimResult, SubdomainResult } from '@ldns/core/types';

interface BaseOk {
  ok: true;
  domain: string;
}
interface BaseFail {
  ok: false;
  error: string;
  domain?: string;
}

export interface ServerResponse extends BaseOk {
  info: ServerInfo | null;
  redirects: RedirectTrace | null;
  tech: TechDetection[];
  altSvc: AltSvcInfo;
  securityHeaders: SecurityHeaderCheck[];
}
export type ServerResult = ServerResponse | BaseFail;

export interface HeadersResponse extends BaseOk {
  url: string;
  status: number;
  headers: Record<string, string>;
}

export interface TlsResponse extends BaseOk {
  certificate: TlsCertificate;
}

export interface SecurityHeadersResponse extends BaseOk {
  url: string;
  headers: Record<string, string>;
  audit: SecurityHeaderCheck[];
}

export interface HstsPreloadResponse extends BaseOk {
  status: string | null;
}

export interface ProbeResult {
  name: string;
  path: string;
  description: string;
  found: boolean;
  status: number | null;
  url: string;
  size: number | null;
}
export interface ProbesResponse extends BaseOk {
  origin: string;
  probes: ProbeResult[];
}

export interface AsnResponse {
  ok: true;
  ip: string;
  asn: number | null;
  asName: string | null;
  country: string | null;
  prefix: string | null;
}

export interface GeoResponseOk {
  ok: true;
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string | null;
  org: string | null;
  isp: string | null;
  asn: number | null;
}
export type GeoResponse = GeoResponseOk | BaseFail;

export interface SubdomainsResponse extends BaseOk {
  subdomains: string[];
  total: number;
  certificates: SubdomainResult['certificates'];
}

export interface DkimResponse extends BaseOk, DkimResult {}

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/${path}?${qs}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${path} returned ${res.status}`);
  }
  return (await res.json()) as T;
}

export const proxy = {
  server: (domain: string, useHttp = false) =>
    api<ServerResult>('server', useHttp ? { domain, http: '1' } : { domain }),
  headers: (domain: string) => api<HeadersResponse>('headers', { domain }),
  tls: (domain: string) => api<TlsResponse | BaseFail>('tls', { domain }),
  asn: (ip: string) => api<AsnResponse>('asn', { ip }),
  geo: (ip: string) => api<GeoResponse>('geo', { ip }),
  securityHeaders: (domain: string) => api<SecurityHeadersResponse>('security/headers', { domain }),
  hstsPreload: (domain: string) => api<HstsPreloadResponse>('security/hsts-preload', { domain }),
  probes: (domain: string) => api<ProbesResponse>('security/probes', { domain }),
  subdomains: (domain: string) => api<SubdomainsResponse>('subdomains', { domain }),
  dkim: (domain: string) => api<DkimResponse>('dkim', { domain })
};
