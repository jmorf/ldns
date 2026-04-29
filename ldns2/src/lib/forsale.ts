// ─── For-Sale Marketplace Types ────────────────────────────────────────

export interface ForSaleListing {
  marketplace: 'afternic' | 'dynadot';
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

  // Run marketplace checks in parallel
  const [afternicResult, dynadotResult] = await Promise.all([
    checkAfternic(normalizedDomain),
    checkDynadot(normalizedDomain, options.dynadotApiKey)
  ]);

  const listings: ForSaleListing[] = [];

  if (afternicResult) {
    listings.push(afternicResult);
  }

  if (dynadotResult) {
    listings.push(dynadotResult);
  }

  return {
    domain: normalizedDomain,
    listings,
    checkedAt: new Date().toISOString()
  };
}
