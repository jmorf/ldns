import type { TechDetection } from './types';

interface TechPattern {
  header: string;
  match: string | RegExp;
  name: string;
  category: TechDetection['category'];
}

const TECH_PATTERNS: TechPattern[] = [
  // CDN
  { header: 'cf-ray', match: '', name: 'Cloudflare', category: 'cdn' },
  { header: 'cf-cache-status', match: '', name: 'Cloudflare', category: 'cdn' },
  { header: 'server', match: /^cloudflare$/i, name: 'Cloudflare', category: 'cdn' },
  { header: 'x-amz-cf-id', match: '', name: 'CloudFront', category: 'cdn' },
  { header: 'x-cache', match: /cloudfront/i, name: 'CloudFront', category: 'cdn' },
  { header: 'fastly-debug-digest', match: '', name: 'Fastly', category: 'cdn' },
  { header: 'x-akamai-transformed', match: '', name: 'Akamai', category: 'cdn' },
  { header: 'x-true-cache-key', match: '', name: 'Akamai', category: 'cdn' },

  // Server software
  { header: 'server', match: /nginx/i, name: 'nginx', category: 'server' },
  { header: 'server', match: /apache/i, name: 'Apache', category: 'server' },
  { header: 'server', match: /^gws$/i, name: 'Google Web Server', category: 'server' },
  { header: 'server', match: /amazons3/i, name: 'Amazon S3', category: 'server' },

  // Frameworks
  { header: 'x-powered-by', match: /next\.js/i, name: 'Next.js', category: 'framework' },
  { header: 'x-powered-by', match: /express/i, name: 'Express.js', category: 'framework' },
  { header: 'x-powered-by', match: /php/i, name: 'PHP', category: 'framework' },
  { header: 'x-aspnet-version', match: '', name: 'ASP.NET', category: 'framework' },
  { header: 'x-drupal-cache', match: '', name: 'Drupal', category: 'framework' },
  { header: 'x-wordpress', match: '', name: 'WordPress', category: 'platform' },
  { header: 'x-pingback', match: /xmlrpc\.php/i, name: 'WordPress', category: 'platform' },

  // Platforms
  { header: 'x-vercel-id', match: '', name: 'Vercel', category: 'platform' },
  { header: 'x-shopify-stage', match: '', name: 'Shopify', category: 'platform' },
  { header: 'x-github-request-id', match: '', name: 'GitHub Pages', category: 'platform' },
  { header: 'x-wix-request-id', match: '', name: 'Wix', category: 'platform' },
  { header: 'x-squarespace-did', match: '', name: 'Squarespace', category: 'platform' },

  // Hosting
  { header: 'x-amz-request-id', match: '', name: 'AWS S3', category: 'hosting' },
  { header: 'via', match: /vegur/i, name: 'Heroku', category: 'hosting' },
  { header: 'x-fly-request-id', match: '', name: 'Fly.io', category: 'hosting' },
  { header: 'x-render-origin-server', match: '', name: 'Render', category: 'hosting' },
];

/**
 * Detect technologies from HTTP response headers.
 * Returns deduplicated array of detected technologies grouped by category.
 */
export function detectTechnologies(headers: Record<string, string>): TechDetection[] {
  const seen = new Set<string>();
  const results: TechDetection[] = [];

  // Normalize header keys to lowercase for matching
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalizedHeaders[key.toLowerCase()] = value;
  }

  for (const pattern of TECH_PATTERNS) {
    const headerKey = pattern.header.toLowerCase();
    const headerValue = normalizedHeaders[headerKey];

    if (headerValue === undefined) continue;

    let matched = false;

    if (pattern.match === '') {
      // Presence-based: header exists = match
      matched = true;
    } else if (pattern.match instanceof RegExp) {
      matched = pattern.match.test(headerValue);
    } else {
      matched = headerValue.toLowerCase().includes(pattern.match.toLowerCase());
    }

    if (matched && !seen.has(pattern.name)) {
      seen.add(pattern.name);
      results.push({ name: pattern.name, category: pattern.category });
    }
  }

  return results;
}
