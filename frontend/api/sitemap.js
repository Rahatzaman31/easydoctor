import { supabase } from '../src/lib/supabase';

export default async function handler(req, res) {
  const BASE_URL = 'https://easydoctorrangpur01.vercel.app';

  try {
    // Fetch dynamic data from Supabase
    const [{ data: blogs }, { data: doctors }, { data: hospitals }] = await Promise.all([
      supabase.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
      supabase.from('doctors').select('id, updated_at').eq('status', 'active'),
      supabase.from('hospitals').select('id, updated_at').eq('status', 'active')
    ]);

    const staticPages = [
      '',
      '/specialist-doctors',
      '/hospitals-diagnostics',
      '/ambulance',
      '/blog',
      '/about-us',
      '/contact',
      '/join-as-doctor',
      '/join-as-hospital',
      '/register-ambulance',
      '/advertise',
      '/download',
      '/editorial-policy',
      '/data-edit-request'
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((page) => `
    <url>
      <loc>${BASE_URL}${page}</loc>
      <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
      <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>`)
    .join('')}
  ${(blogs || [])
    .map((post) => `
    <url>
      <loc>${BASE_URL}/blog/${post.slug}</loc>
      <lastmod>${new Date(post.updated_at).toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`)
    .join('')}
  ${(doctors || [])
    .map((doc) => `
    <url>
      <loc>${BASE_URL}/doctor/${doc.id}</loc>
      <lastmod>${new Date(doc.updated_at).toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`)
    .join('')}
  ${(hospitals || [])
    .map((hosp) => `
    <url>
      <loc>${BASE_URL}/hospital/${hosp.id}</loc>
      <lastmod>${new Date(hosp.updated_at).toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`)
    .join('')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
}
