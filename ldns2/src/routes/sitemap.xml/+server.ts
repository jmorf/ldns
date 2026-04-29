import { WEBSITE, getTotalChunks, getUpdatedDate } from '$lib/sitemap-data';

export async function GET() {
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
      'Cache-Control': 'max-age=0, s-maxage=3600',
      'Content-Type': 'application/xml',
    }
  });
}
