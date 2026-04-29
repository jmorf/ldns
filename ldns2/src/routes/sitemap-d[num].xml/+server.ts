import { error } from '@sveltejs/kit';
import { WEBSITE, tool_pages, getDomainChunks, getTotalChunks } from '$lib/sitemap-data';
import { serveCached } from '$lib/server/edge-cache';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const num = parseInt(event.params.num, 10);
  const totalChunks = getTotalChunks();

  if (isNaN(num) || num < 1 || num > totalChunks) {
    throw error(404, 'Sitemap not found');
  }

  return serveCached(event, async () => {
    const chunks = getDomainChunks();
    const domains = chunks[num - 1];

    // No <lastmod>, no <changefreq>, no <priority>:
    //   - <lastmod> would be a lie — these are templated tool pages and we
    //     don't actually know when each domain's data last "changed".
    //   - <changefreq> and <priority> are officially ignored by Google.
    // Listing the URL alone is the most honest signal.
    const urls = domains.flatMap((domain) =>
      tool_pages.map(
        (tool) => `  <url>
    <loc>${WEBSITE}/${domain}${tool}</loc>
  </url>`
      )
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Content-Type': 'application/xml'
      }
    });
  });
};
