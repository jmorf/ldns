import { fetchWithTimeout } from './fetch-utils';
import { UpstreamError } from './upstream-errors';

const GEO_TIMEOUT_MS = 10_000;

export interface GeoInfo {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  org: string | null;
  isp: string | null;
  asn: number | null;
}

interface IpwhoResponse {
  success: boolean;
  message?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: { id?: string };
  connection?: { org?: string; isp?: string; asn?: number };
}

/**
 * Look up the geographic location and ISP for an IP via ipwho.is.
 *
 * No API key needed; the free tier allows ~10k requests per month per
 * caller IP, far above what interactive lookups generate. Callers should
 * cache by IP (the extension keeps results for an hour).
 */
export async function lookupGeo(ip: string, signal?: AbortSignal): Promise<GeoInfo> {
  const response = await fetchWithTimeout(
    `https://ipwho.is/${encodeURIComponent(ip)}`,
    { signal },
    GEO_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new UpstreamError(`IP location lookup failed with HTTP ${response.status}`, {
      status: response.status,
      service: 'ipwho.is'
    });
  }

  const data = (await response.json()) as IpwhoResponse;
  if (!data.success) {
    // ipwho.is reports errors (reserved ranges, bad input) as 200 + flag
    throw new Error(data.message || 'IP location lookup failed');
  }

  return {
    ip,
    country: data.country ?? null,
    countryCode: data.country_code ?? null,
    region: data.region ?? null,
    city: data.city ?? null,
    lat: data.latitude ?? null,
    lon: data.longitude ?? null,
    timezone: data.timezone?.id ?? null,
    org: data.connection?.org ?? null,
    isp: data.connection?.isp ?? null,
    asn: data.connection?.asn ?? null
  };
}
