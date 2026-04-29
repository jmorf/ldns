import { error } from '@sveltejs/kit';
import { createHandler } from '$lib/server/handler';
import { isIPv4, isIPv6 } from '@ldns/core/ptr';

/**
 * IP geolocation, free-tier path.
 *
 * Two strategies, in order:
 *   1. Cloudflare's `request.cf` provides country/region/city/asn for the
 *      *requesting* IP. Not useful here because we need to look up an arbitrary
 *      IP, not the client's.
 *   2. ipwho.is — free, unauthenticated, reasonable rate limit (~10k/day per IP).
 *      We proxy it server-side so the client never talks to ipwho.is directly.
 *
 * Accuracy is "country and region usually correct, city often approximate".
 * The UI surfaces this honestly.
 */

interface IpwhoSuccess {
  success: true;
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone?: { id: string };
  connection?: { asn: number; org: string; isp: string; domain: string };
}

interface IpwhoFail {
  success: false;
  message: string;
}

const handler = createHandler({
  endpoint: 'geo',
  cache: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  async run({ url }) {
    const ip = url.searchParams.get('ip');
    if (!ip) throw error(400, 'Missing ip parameter');
    if (!isIPv4(ip) && !isIPv6(ip)) throw error(400, 'Invalid IP address');

    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
    if (!res.ok) {
      return { ok: false as const, ip, error: `Lookup service returned ${res.status}` };
    }
    const data = (await res.json()) as IpwhoSuccess | IpwhoFail;
    if (!data.success) {
      return { ok: false as const, ip, error: data.message };
    }
    return {
      ok: true as const,
      ip,
      country: data.country,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone?.id ?? null,
      org: data.connection?.org ?? null,
      isp: data.connection?.isp ?? null,
      asn: data.connection?.asn ?? null
    };
  }
});

export const GET = handler.GET;
export const OPTIONS = handler.OPTIONS;
