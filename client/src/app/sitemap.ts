import type { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1, changeFrequency: 'daily' },
    { url: `${SITE_URL}/products`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${SITE_URL}/categories`, priority: 0.8, changeFrequency: 'weekly' },
  ];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/products?limit=200`),
      fetch(`${API_URL}/categories`),
    ]);

    if (productsRes.ok) {
      const { products } = await productsRes.json();
      products.forEach((p: { slug: string; updatedAt?: string }) => {
        entries.push({
          url: `${SITE_URL}/products/${p.slug}`,
          priority: 0.7,
          changeFrequency: 'weekly',
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        });
      });
    }

    if (categoriesRes.ok) {
      const { categories } = await categoriesRes.json();
      categories.forEach((c: { _id: string; updatedAt?: string }) => {
        entries.push({
          url: `${SITE_URL}/products?category=${c._id}`,
          priority: 0.6,
          changeFrequency: 'weekly',
          lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
        });
      });
    }
  } catch {
    // If API is not available, still serve the static entries
  }

  return entries;
}
