import { WEBSITE, getTotalChunks, getUpdatedDate } from '$lib/sitemap-data';
import { serveCached } from '$lib/server/edge-cache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  return serveCached(event, async () => {
    const updated = getUpdatedDate();
    const totalChunks = getTotalChunks();

    const sitemaps = [
      `  <sitemap>
    <loc>${WEBSITE}/sitemap-s.xml</loc>
    <lastmod>${updated}</lastmod>
  </sitemap>`
    ];

    for (let i = 1; i <= totalChunks; i++) {
      sitemaps.push(`  <sitemap>
    <loc>${WEBSITE}/sitemap-d${i}.xml</loc>
    <lastmod>${updated}</lastmod>
  </sitemap>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;

    return new Response(xml, {
      headers: {
        // Cache-Control here is honoured by both the browser and
        // (via the edge-cache helper above) Cloudflare's edge.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Content-Type': 'application/xml'
      }
    });
  });
};
