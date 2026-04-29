import { WEBSITE, static_pages } from '$lib/sitemap-data';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${WEBSITE}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${static_pages
    .map(
      (page) => `  <url>
    <loc>${WEBSITE}/${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Cache-Control': 'max-age=0, s-maxage=3600',
      'Content-Type': 'application/xml',
    }
  });
}
