// ─── For-Sale Marketplace Types ────────────────────────────────────────

export interface ForSaleListing {
  marketplace: 'afternic' | 'dynadot' | 'parking';
  /**
   * Specific parking platform name when marketplace='parking'
   * (e.g. 'GoDaddy CashParking', 'HugeDomains', 'Sedo', 'Dan', 'ParkingCrew').
   * Optional because Afternic/Dynadot listings don't use it.
   */
  platform?: string;
  domain: string;
  forSale: boolean;
  price?: number;
  currency?: string;
  buyNowAvailable?: boolean;
  listingUrl: string;
}

export interface ForSaleResult {
  domain: string;
  listings: ForSaleListing[];
  checkedAt: string;
}

// ─── Afternic API ────────────────────────────────────────────────────

interface AfternicListingResponse {
  domain?: string;
  price?: number;
  currency?: string;
  buyNow?: boolean;
  status?: string;
  listingUrl?: string;
}

/**
 * Check if a domain is listed for sale on Afternic DLS
 * Uses the unofficial listingDetails endpoint
 */
export async function checkAfternic(domain: string): Promise<ForSaleListing | null> {
  try {
    const url = `https://www.afternic.com/domains/api/listingDetails/${encodeURIComponent(domain)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ldns-domain-lookup/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      // 404 means domain not listed
      if (response.status === 404) {
        return null;
      }
      return null;
    }

    const data = await response.json() as AfternicListingResponse;

    // Check if the domain is actually for sale
    if (!data || !data.price) {
      return null;
    }

    return {
      marketplace: 'afternic',
      domain: data.domain || domain,
      forSale: true,
      price: data.price,
      currency: data.currency || 'USD',
      buyNowAvailable: data.buyNow ?? false,
      listingUrl: data.listingUrl || `https://www.afternic.com/domain/${encodeURIComponent(domain)}`
    };
  } catch (error) {
    // Timeout or network error - silently fail
    console.log('Afternic check failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ─── Dynadot API ────────────────────────────────────────────────────

interface DynadotSearchResult {
  domain_name?: string;
  price?: string;
  currency?: string;
  buy_now?: string;
}

interface DynadotSearchResponse {
  SearchResponse?: {
    ResponseCode?: number;
    SearchResults?: DynadotSearchResult[];
  };
}

/**
 * Check if a domain is listed for sale on Dynadot DAX marketplace
 * Requires API key stored in DYNADOT_API_KEY environment variable
 */
export async function checkDynadot(domain: string, apiKey?: string): Promise<ForSaleListing | null> {
  // Skip if no API key provided
  if (!apiKey) {
    return null;
  }

  try {
    const url = new URL('https://api.dynadot.com/api3.json');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('command', 'search');
    url.searchParams.set('keyword', domain);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as DynadotSearchResponse;

    // Check response code
    if (data.SearchResponse?.ResponseCode !== 0) {
      return null;
    }

    // Find exact match in results
    const results = data.SearchResponse?.SearchResults || [];
    const match = results.find(r =>
      r.domain_name?.toLowerCase() === domain.toLowerCase()
    );

    if (!match || !match.price) {
      return null;
    }

    const price = parseFloat(match.price);
    if (isNaN(price)) {
      return null;
    }

    return {
      marketplace: 'dynadot',
      domain: match.domain_name || domain,
      forSale: true,
      price: price,
      currency: match.currency || 'USD',
      buyNowAvailable: match.buy_now === 'yes',
      listingUrl: `https://www.dynadot.com/market/auction/${encodeURIComponent(domain)}`
    };
  } catch (error) {
    console.log('Dynadot check failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ─── Parking Page Fingerprint ───────────────────────────────────────
//
// Many domains for sale don't appear in Afternic's or Dynadot's APIs because
// they're parked on a different platform (GoDaddy CashParking, HugeDomains,
// Sedo, Bodis, ParkingCrew, Dan.com, etc.). All of those serve a recognizable
// landing page or redirect to a known marketplace host. We do a single HEAD/GET
// to the apex and inspect the final URL + body for known signatures.

interface ParkingSignature {
  /** Specific platform name, e.g. "GoDaddy CashParking". */
  platform: string;
  /**
   * Hostnames the response chain may end up on (final URL match). Most
   * marketplaces redirect the browser to their own buy-this-domain page.
   */
  finalHostnames?: string[];
  /** Substrings that, if found in the response body, identify the platform. */
  bodyPatterns?: RegExp[];
}

const PARKING_SIGNATURES: ParkingSignature[] = [
  {
    // Tiny HTML stub: <script>window.onload=function(){window.location.href="/lander"}</script>
    // Then `/lander` loads `parking-lander/static/js/main.js` from wsimg.com.
    platform: 'GoDaddy CashParking',
    bodyPatterns: [
      /parking-lander\/static/i,
      /LANDER_SYSTEM\s*=\s*["']PW["']/,
      /wsimg\.com\/parking-lander/i
    ]
  },
  {
    platform: 'HugeDomains',
    finalHostnames: ['hugedomains.com', 'www.hugedomains.com'],
    bodyPatterns: [/hugedomains\.com\/buy-domain/i, /class="[^"]*hd-(header|hero|cta)/i]
  },
  {
    platform: 'Sedo',
    finalHostnames: ['sedoparking.com', 'www.sedoparking.com', 'sedo.com'],
    bodyPatterns: [/sedoparking\.com/i, /this domain (?:may be|is) for sale/i]
  },
  {
    platform: 'Bodis',
    finalHostnames: ['bodis.com'],
    bodyPatterns: [/bodis\.com/i]
  },
  {
    platform: 'ParkingCrew',
    finalHostnames: ['parkingcrew.net', 'www.parkingcrew.net'],
    bodyPatterns: [/parkingcrew\.net/i]
  },
  {
    platform: 'Dan',
    finalHostnames: ['dan.com', 'www.dan.com', 'undeveloped.com'],
    bodyPatterns: [/dan\.com\/buy-domain/i, /undeveloped\.com\/buy-domain/i]
  },
  {
    platform: 'Uniregistry Market',
    finalHostnames: ['uniregistrymarket.link'],
    bodyPatterns: [/uniregistrymarket\.link/i, /uniregistry\.market/i]
  },
  {
    platform: 'Afternic Lander',
    bodyPatterns: [/afternic\.com\/domain\//i, /afternic\.com\/forsale/i]
  },
  // Generic last-resort signal — many platforms include explicit "this domain
  // is for sale" / "buy this domain" copy in their landing pages.
  {
    platform: 'Generic parking page',
    bodyPatterns: [
      /\bthis (?:premium )?domain (?:is|may be) (?:for sale|available)/i,
      /\bbuy this domain\b/i,
      /\bdomain is parked\b/i
    ]
  }
];

const PARKING_FETCH_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 100_000; // 100 KB is plenty for fingerprinting

async function fetchSnippet(url: string, signal: AbortSignal): Promise<{ finalUrl: string; body: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        // A real browser UA gets us the marketing landing page rather than
        // a bot-fence response on some platforms.
        'User-Agent': 'Mozilla/5.0 (compatible; LDNS/1.0; +https://ldns.com)',
        Accept: 'text/html,application/xhtml+xml'
      },
      redirect: 'follow',
      signal
    });
    if (!res.ok) return null;
    const reader = res.body?.getReader();
    if (!reader) return { finalUrl: res.url, body: '' };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BODY_BYTES) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
      if (total >= MAX_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        break;
      }
    }
    const body = new TextDecoder().decode(
      chunks.length === 1 ? chunks[0] : Buffer.concat(chunks.map((c) => Buffer.from(c)))
    );
    return { finalUrl: res.url, body };
  } catch {
    return null;
  }
}

/**
 * Detect well-known parking platforms by fetching the apex over HTTPS, then
 * (when the apex returns a tiny JS-redirect stub like GoDaddy CashParking
 * does) the parking-lander URL the stub points at.
 */
export async function checkParkingPage(domain: string): Promise<ForSaleListing | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PARKING_FETCH_TIMEOUT_MS);

  try {
    let response = await fetchSnippet(`https://${domain}/`, controller.signal);
    if (!response) {
      // Some parked domains only respond on http://
      response = await fetchSnippet(`http://${domain}/`, controller.signal);
      if (!response) return null;
    }

    // GoDaddy + several others ship a tiny stub that JS-redirects to a lander
    // path. Detect the stub by size + redirect script and refetch the target.
    const redirectMatch = response.body.match(
      /window\.location\.(?:href|replace\(?)\s*=?\s*["']([^"']+)["']/i
    );
    if (response.body.length < 2000 && redirectMatch) {
      const target = redirectMatch[1];
      const absUrl = target.startsWith('http')
        ? target
        : new URL(target, response.finalUrl).toString();
      const followed = await fetchSnippet(absUrl, controller.signal);
      if (followed) response = followed;
    }

    const finalHost = (() => {
      try {
        return new URL(response.finalUrl).hostname.toLowerCase();
      } catch {
        return '';
      }
    })();

    for (const sig of PARKING_SIGNATURES) {
      const hostHit = sig.finalHostnames?.some((h) => finalHost === h || finalHost.endsWith(`.${h}`));
      const bodyHit = sig.bodyPatterns?.some((rx) => rx.test(response.body));
      if (hostHit || bodyHit) {
        // listingUrl: prefer the final landed URL — that's what the user lands
        // on, often already the marketplace page.
        return {
          marketplace: 'parking',
          platform: sig.platform,
          domain,
          forSale: true,
          listingUrl: response.finalUrl
        };
      }
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Combined For-Sale Check ────────────────────────────────────────

export interface CheckForSaleOptions {
  dynadotApiKey?: string;
}

/**
 * Check if a domain is listed for sale across all supported marketplaces
 * Runs checks in parallel for performance
 */
export async function checkForSale(
  domain: string,
  options: CheckForSaleOptions = {}
): Promise<ForSaleResult> {
  const normalizedDomain = domain.toLowerCase().trim();

  // Run marketplace checks in parallel. Parking-page fingerprinting is the
  // fallback for domains not listed on the major API-backed marketplaces.
  const [afternicResult, dynadotResult, parkingResult] = await Promise.all([
    checkAfternic(normalizedDomain),
    checkDynadot(normalizedDomain, options.dynadotApiKey),
    checkParkingPage(normalizedDomain)
  ]);

  const listings: ForSaleListing[] = [];
  if (afternicResult) listings.push(afternicResult);
  if (dynadotResult) listings.push(dynadotResult);
  // Only surface the parking signal if no concrete marketplace hit — avoids
  // duplicate/competing rows when Afternic already has a price.
  if (parkingResult && listings.length === 0) listings.push(parkingResult);

  return {
    domain: normalizedDomain,
    listings,
    checkedAt: new Date().toISOString()
  };
}
