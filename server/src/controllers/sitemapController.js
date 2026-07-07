const Product = require('../models/Product');
const Category = require('../models/Category');
const config = require('../config');

const VALID_HOST = new URL(config.clientUrl).host;

exports.generateSitemap = async (req, res) => {
  try {
    const host = req.get('host');
    const baseUrl = host === VALID_HOST
      ? `${req.protocol}://${host}`
      : config.clientUrl;
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    const urls = [];
    urls.push({ loc: baseUrl, priority: 1.0, changefreq: 'daily' });
    urls.push({ loc: `${baseUrl}/products`, priority: 0.9, changefreq: 'daily' });
    urls.push({ loc: `${baseUrl}/categories`, priority: 0.8, changefreq: 'weekly' });

    products.forEach((p) => {
      urls.push({
        loc: `${baseUrl}/products/${p.slug}`,
        priority: 0.7,
        changefreq: 'weekly',
        lastmod: p.updatedAt,
      });
    });

    categories.forEach((c) => {
      urls.push({
        loc: `${baseUrl}/products?category=${c._id}`,
        priority: 0.6,
        changefreq: 'weekly',
        lastmod: c.updatedAt,
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('خطا در تولید sitemap');
  }
};
