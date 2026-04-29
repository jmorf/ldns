import { error } from '@sveltejs/kit';
import { WEBSITE, tool_pages, getDomainChunks, getTotalChunks, getUpdatedDate } from '$lib/sitemap-data';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const num = parseInt(params.num, 10);
  const totalChunks = getTotalChunks();

  if (isNaN(num) || num < 1 || num > totalChunks) {
    throw error(404, 'Sitemap not found');
  }

  const chunks = getDomainChunks();
  const domains = chunks[num - 1];
  const updated = getUpdatedDate();

  const urls = domains.flatMap((domain) =>
    tool_pages.map(
      (tool) => `  <url>
    <loc>${WEBSITE}/${domain}${tool}</loc>
    <changefreq>daily</changefreq>
    <lastmod>${updated}</lastmod>
    <priority>0.7</priority>
  </url>`
    )
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Cache-Control': 'max-age=0, s-maxage=3600',
      'Content-Type': 'application/xml',
    }
  });
};
