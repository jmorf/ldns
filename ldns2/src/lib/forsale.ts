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

// ─── For-Sale Lander Fingerprint ────────────────────────────────────
//
// Goal: high-precision detection of "this domain is actively listed for sale"
// — NOT generic parking. A page can be parked (monetized with PPC ads) without
// being for sale; we don't want false positives like ntwd.com (GoDaddy
// CashParking, ad-only) showing as For Sale.
//
// We only flag when one of these hard signals fires:
//   1. The page redirects to a known marketplace BUY URL — hostname AND a
//      buy-style path (e.g. dan.com/buy-domain/, hugedomains.com/buy-domain.aspx,
//      sedo.com/sales/details/, afternic.com/forsale/).
//   2. The page body contains an outbound buy-this-domain link with the same
//      target domain (e.g. `<a href="https://hugedomains.com/buy-domain.aspx?d=…">`).
//   3. The page body contains explicit buy copy paired with a price tag
//      ("Buy now $X,XXX", "Make Offer · USD X,XXX") — generic "for sale" copy
//      alone is too noisy and doesn't fire.
//
// Domains that are merely parked on CashParking, ParkingCrew, Bodis, etc.
// without an explicit buy CTA are intentionally NOT flagged.

interface SaleSignature {
  /** Marketplace name surfaced in the UI (e.g. "HugeDomains", "Sedo"). */
  platform: string;
  /**
   * Hostname patterns the response chain ends up on. Combined with
   * `finalPathPatterns` so we only fire on actual buy URLs, not the
   * marketplace's homepage.
   */
  finalHostnames?: string[];
  /** Path substrings that confirm a buy/listing page on the matched host. */
  finalPathPatterns?: RegExp[];
  /**
   * Body patterns that, on their own (regardless of final URL), confirm an
   * embedded buy CTA — typically because a parked page links out to the
   * marketplace's buy URL with the domain as a query param.
   */
  bodyBuyLinkPatterns?: RegExp[];
}

const SALE_SIGNATURES: SaleSignature[] = [
  {
    platform: 'HugeDomains',
    finalHostnames: ['hugedomains.com', 'www.hugedomains.com'],
    // Every HugeDomains page IS a buy-this-domain page — they don't park
    // ad-only. Match the apex too as a fallback.
    finalPathPatterns: [/.*/],
    bodyBuyLinkPatterns: [/href=["']https?:\/\/(?:www\.)?hugedomains\.com\/[^"']*buy[^"']*/i]
  },
  {
    platform: 'Dan',
    finalHostnames: ['dan.com', 'www.dan.com', 'undeveloped.com'],
    finalPathPatterns: [/\/buy-domain\//i],
    bodyBuyLinkPatterns: [/href=["']https?:\/\/(?:www\.)?(?:dan|undeveloped)\.com\/buy-domain\//i]
  },
  {
    platform: 'Sedo',
    finalHostnames: ['sedo.com', 'www.sedo.com'],
    // Real Sedo for-sale URLs follow /search/?keyword= or /sales/details/ paths.
    finalPathPatterns: [/\/sales\//i, /\/buy-now\//i, /\/auction\//i],
    bodyBuyLinkPatterns: [/href=["']https?:\/\/(?:www\.)?sedo\.com\/(?:sales|buy-now|auction)\//i]
  },
  {
    platform: 'Afternic',
    finalHostnames: ['www.afternic.com', 'afternic.com'],
    finalPathPatterns: [/\/forsale\//i, /\/domain\//i],
    bodyBuyLinkPatterns: [/href=["']https?:\/\/(?:www\.)?afternic\.com\/(?:forsale|domain)\//i]
  },
  {
    platform: 'Uniregistry Market',
    finalHostnames: ['uniregistrymarket.link', 'market.uniregistry.com'],
    finalPathPatterns: [/.*/],
    bodyBuyLinkPatterns: [/href=["']https?:\/\/(?:[a-z0-9-]+\.)?uniregistrymarket\.link\//i]
  },
  {
    // Last-resort signal: explicit buy CTA + a price tag in the same body.
    // Requires BOTH so generic ads-only "this domain is for sale" copy
    // (which appears on CashParking landers as a tagline) doesn't fire.
    platform: 'Listed for sale',
    bodyBuyLinkPatterns: [
      /(?:buy now|buy this domain|make (?:an )?offer)[^<]{0,80}?(?:US?\$|EUR\s|€)\s?\d{2,7}/i,
      /(?:US?\$|€)\s?\d{2,7}[^<]{0,80}?(?:buy now|buy this domain|make (?:an )?offer)/i
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
 * Detect domains that are actively listed for sale by fetching the apex and
 * matching against high-precision marketplace signatures.
 *
 * Returns null for domains that are merely parked (PPC ads only) — caller
 * should not treat absence of a hit as definitive "not for sale", just
 * "no public sale signal we can detect".
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

    // Some lander platforms ship a tiny HTML stub at the apex that
    // JS-redirects to a path on the same host (e.g. GoDaddy's `/lander`).
    // Server-side fetch doesn't execute JS, so refetch the target.
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

    const finalUrl = (() => {
      try {
        return new URL(response.finalUrl);
      } catch {
        return null;
      }
    })();
    const finalHost = finalUrl?.hostname.toLowerCase() ?? '';
    const finalPath = finalUrl?.pathname ?? '';

    for (const sig of SALE_SIGNATURES) {
      // Strong signal A: the final URL lives on a marketplace host AND its
      // path matches a buy-page pattern. Either alone isn't enough — sedo.com
      // homepage is not a sale signal; ntwd.com landing on its own /lander
      // path with no marketplace host isn't either.
      const hostMatched = sig.finalHostnames?.some(
        (h) => finalHost === h || finalHost.endsWith(`.${h}`)
      );
      const pathMatched = sig.finalPathPatterns?.some((rx) => rx.test(finalPath));
      const finalMatched = hostMatched && pathMatched;

      // Strong signal B: the body links out to a marketplace buy URL.
      const bodyLinkMatched = sig.bodyBuyLinkPatterns?.some((rx) => rx.test(response.body));

      if (finalMatched || bodyLinkMatched) {
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
