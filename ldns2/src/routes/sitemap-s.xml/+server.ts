import { WEBSITE, static_pages } from '$lib/sitemap-data';
import { serveCached } from '$lib/server/edge-cache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  return serveCached(event, async () => {
    // Drop <changefreq> and <priority> — Google has officially ignored both
    // since 2017 and lying to crawlers about freshness can hurt trust.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${WEBSITE}</loc>
  </url>
${static_pages
      .map(
        (page) => `  <url>
    <loc>${WEBSITE}/${page}</loc>
  </url>`
      )
      .join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Content-Type': 'application/xml'
      }
    });
  });
};
