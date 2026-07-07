# Next.js Rewrite Plan: فروشگاه قطعات یدکی خودرو

## Current Architecture

**Frontend**: Vite + React 19 SPA (client-side rendering)
**Backend**: Express.js + MongoDB (Mongoose) REST API
**Current SEO**: Basic `react-helmet-async` meta tags only — no SSR, no structured data

---

## Phase 1: Project Initialization

### 1.1 Scaffold
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

### 1.2 Project Structure
```
src/
  app/                    # App Router (pages)
    (public)/             # Public routes group
      page.tsx            # Home
      products/
        page.tsx          # Products listing
        [slug]/page.tsx   # Product detail
      categories/page.tsx
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
      checkout/page.tsx
      orders/page.tsx
      orders/[id]/page.tsx
      wishlist/page.tsx
      profile/page.tsx
      payment/result/page.tsx
      not-found.tsx
    (admin)/              # Admin routes group (CSR, not indexed)
      admin/
        layout.tsx
        page.tsx
        products/page.tsx
        categories/page.tsx
        cars/page.tsx
        orders/page.tsx
        coupons/page.tsx
        reviews/page.tsx
        users/page.tsx
        sellers/page.tsx
        seller-orders/page.tsx
        master-prices/page.tsx
        settings/page.tsx
    (seller)/             # Seller routes group (CSR, not indexed)
      seller/
        layout.tsx
        page.tsx
        products/page.tsx
        cart/page.tsx
        orders/page.tsx
        orders/[id]/page.tsx
    api/                  # Next.js API proxy routes (delegate to Express)
      [[...route]]/route.ts
    sitemap.ts
    robots.ts
    layout.tsx
    global.css
  components/
    layout/
      Header.tsx
      Footer.tsx
      AdminSidebar.tsx
      SellerSidebar.tsx
    ui/                   # Reusable UI primitives
    common/
      SEO.tsx
      StarRating.tsx
      Toast.tsx
      DarkModeToggle.tsx
      FavoriteButton.tsx
      WhatsAppButton.tsx
      BackToTop.tsx
      ScrollToTop.tsx
      ErrorBoundary.tsx
    product/
      ProductCard.tsx
      ProductGrid.tsx
      ProductFilters.tsx
      ReviewSection.tsx
  lib/
    api.ts                # Axios instance (same as current)
    utils/
      numbers.ts
      validation.ts
    hooks/
      useProducts.ts
      useAuth.ts
      useCart.ts
  providers/
    AuthProvider.tsx
    CartProvider.tsx
    QueryProvider.tsx
  services/               # API service functions (copy as-is)
    productService.ts
    orderService.ts
    reviewService.ts
    userService.ts
  types/
    index.ts              # TypeScript interfaces for all models
```

### 1.3 Dependencies to Port
**From package.json (client)**:
- `@tanstack/react-query` → keep
- `axios` → keep
- `moment-jalaali` → keep (or migrate to `date-fns-jalali`)
- `react-helmet-async` → **remove** (use Next.js metadata API)
- `react-router-dom` → **remove** (use Next.js App Router)
- Tailwind CSS v4 → keep (Next.js built-in support)
- `clsx`, `tailwind-merge` → add for className utilities

**New dependencies for SEO**:
- `next-sitemap` or Next.js built-in sitemap
- `schema-dts` for TypeScript-safe JSON-LD (optional)

### 1.4 Environment Variables
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_UPLOADS_URL=http://localhost:5000/uploads
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Phase 2: API Strategy

**Decision: Keep Express backend as standalone API.**
- Express has complex features (PDFKit, Multer, Zarinpal, CSV export, seed scripts)
- Migrating all of that to Next.js API routes would be risky and unnecessary
- Next.js will proxy `/api/*` and `/uploads/*` to Express in development

### Next.js Config (`next.config.ts`)
```ts
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/:path*` },
      { source: '/uploads/:path*', destination: `${UPLOADS_URL}/:path*` },
    ];
  },
};
```

### Express Backend Changes (Minimal)
- Remove `express.static(clientDist)` for production (Next.js serves its own build)
- Keep all API routes, auth, models, controllers exactly as-is
- Add CORS origin for Next.js dev server (`http://localhost:3000`)

---

## Phase 3: SEO Infrastructure

### 3.1 Metadata API (replaces react-helmet-async)
Every public page gets proper metadata:

```ts
// Example: Product Detail page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  return {
    title: `${product.name} | فروشگاه قطعات یدکی خودرو`,
    description: product.description?.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'product',
      locale: 'fa_IR',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description?.slice(0, 160),
    },
  };
}
```

### 3.2 JSON-LD Structured Data
Add for key pages:

| Page | Schema Type |
|------|------------|
| Home | `WebSite`, `Organization` |
| Product Detail | `Product` |
| Products | `ItemList` |
| Categories | `CollectionPage` |
| Breadcrumb | `BreadcrumbList` (all pages) |

### 3.3 Sitemap (`src/app/sitemap.ts`)
Built-in Next.js sitemap generation — dynamic, no separate route needed:
```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    fetchProducts({ isActive: true }),
    fetchCategories({ isActive: true }),
  ]);
  return [
    { url: '', priority: 1, changeFrequency: 'daily' },
    { url: '/products', priority: 0.9, changeFrequency: 'daily' },
    { url: '/categories', priority: 0.8, changeFrequency: 'weekly' },
    ...products.map(p => ({
      url: `/products/${p.slug}`,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
      lastModified: p.updatedAt,
    })),
    ...categories.map(c => ({
      url: `/products?category=${c._id}`,
      priority: 0.6,
      changeFrequency: 'weekly' as const,
    })),
  ];
}
```

### 3.4 Robots (`src/app/robots.ts`)
```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/seller/', '/api/', '/profile', '/orders'] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

### 3.5 SEO Component (for dynamic meta within client components)
A thin wrapper around `useMemo` for cases where generateMetadata can't be used (e.g., admin pages that still need a title).

---

## Phase 4: Rendering Strategy

| Page | Strategy | Reasoning |
|------|----------|-----------|
| Home | **ISR** (revalidate: 300s) | Dynamic content (festival, featured). Fresh enough |
| Products List | **SSR** + searchParams | URL-based filtering/sorting requires server render |
| Product Detail | **ISR** (revalidate: 3600s) | Static for 1 hour, fast for most visits |
| Categories | **ISR** (revalidate: 3600s) | Rarely changes |
| Login / Register | **CSR** | No SEO value, auth-dependent |
| Checkout | **CSR** | Auth/cart-dependent |
| Orders / Profile | **CSR** | User-specific, no SEO value |
| Admin / Seller | **CSR** | Dashboard, not indexed |
| NotFound | **Static** | Simple 404 page |

### Data Fetching Pattern
```ts
// lib/api.ts — Server-side fetch helper
export async function fetchFromAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${process.env.API_URL}${path}`;
  const res = await fetch(url, { next: { revalidate: 3600 }, ...options });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Services use this for server components
export const getProductBySlug = (slug: string) =>
  fetchFromAPI<ProductResponse>(`/products/${slug}`);
```

---

## Phase 5: Page-by-Page Migration Order

### 5.1 Core Layout (Day 1-2)
- `src/app/layout.tsx` — Root layout with HTML lang="fa", dir="rtl", fonts
- `Header.tsx` — Port with Next.js Link (no react-router)
- `Footer.tsx` — Port as-is
- `providers/` — AuthProvider, CartProvider, QueryProvider
- `lib/api.ts` — Axios instance with token refresh (same as current)
- Global CSS with Tailwind

### 5.2 Public Pages — Static/ISR (Day 2-3)
1. **Home** — ISR with revalidation. Port festival banner, categories grid, featured products
2. **Categories** — ISR. Port category listing
3. **NotFound** — Static

### 5.3 Public Pages — SSR (Day 3-4)
4. **Products** — SSR with searchParams. Port filters, sort, pagination, grid
5. **Product Detail** — ISR. Port image gallery, specs, compatible cars, reviews

### 5.4 Public Pages — CSR (Day 4-5)
6. **Login** / **Register** — Port auth forms
7. **ForgotPassword** / **ResetPassword** — Port
8. **Checkout** — Port cart, address, coupon, payment method
9. **Orders** — Port order list
10. **OrderDetail** — Port
11. **PaymentResult** — Port
12. **Wishlist** — Port
13. **Profile** — Port

### 5.5 Admin Pages — CSR (Day 5-7)
All admin pages ported as client components with `"use client"`:
- Dashboard, Products, Categories, Cars, Orders, Coupons, Reviews, Users, Sellers, Master Prices, Settings, Seller Orders

### 5.6 Seller Pages — CSR (Day 7-8)
- Dashboard, Products, Cart, Orders, OrderDetail

---

## Phase 6: Security — Carry Forward & Enhance

### From Current Backend (keep in Express):
| Feature | Middleware |
|---------|-----------|
| Helmet headers | `helmet()` |
| CORS | `cors({ origin: config.clientUrl, credentials: true })` |
| Rate limiting | `express-rate-limit` (global + auth-specific) |
| Mongo sanitize | `express-mongo-sanitize` |
| HPP (param pollution) | `hpp()` |
| XSS | `xss` + custom `sanitizeBody` middleware |
| JWT with refresh tokens | `jsonwebtoken` |
| Password hashing | `bcryptjs` (12 rounds) |
| Input validation | `express-validator` |
| File upload limits | `multer` with size/santiy checks |
| Safe static serving | `dotfiles: 'deny'`, `X-Content-Type-Options: nosniff` |

### New for Next.js:
- **Next.js built-in security headers** via `next.config.ts`:
  ```ts
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  }
  ```
- **No sensitive data in client components** — never import server-side secrets
- **CSRF protection** for API calls (if needed beyond token auth)
- **Input validation** on both client (form) and server (Express still validates)
- **HTTP-only cookies** for tokens instead of localStorage (enhancement):
  - Store JWT in secure, httpOnly cookies
  - Refresh token rotation
  - This is a security upgrade from current localStorage approach

---

## Phase 7: Performance & Quality

### 7.1 Image Optimization
- Replace all `<img>` with `next/image`
- Configure `remotePatterns` in `next.config.ts` for uploaded images
- Use `sizes` attribute for responsive images
- Lazy loading by default
- WebP conversion via Next.js built-in optimizer

### 7.2 Font Optimization
```ts
// src/app/layout.tsx
import localFont from 'next/font/local';
const vazirFont = localFont({ src: './fonts/Vazir.woff2', variable: '--font-vazir' });
```

### 7.3 Bundle Optimization
- Use `next/dynamic` for admin/seller pages (loaded only when needed)
- Route segments code-split automatically by App Router
- Lazy-load heavy libraries (PDFKit, xlsx) only when needed

### 7.4 TypeScript
- Define types for all models (Product, User, Order, etc.)
- Strict TypeScript mode
- Type-safe API responses

### 7.5 Linting & Formatting
- ESLint with Next.js config
- Prettier for consistent formatting

---

## Phase 8: Verification & Testing

### 8.1 SEO Verification
- [ ] Lighthouse scores (90+ Performance, Accessibility, Best Practices, SEO)
- [ ] Google Structured Data Testing Tool passes for JSON-LD
- [ ] Sitemap valid and reachable at `/sitemap.xml`
- [ ] Robots.txt valid and reachable at `/robots.txt`
- [ ] All public pages have unique meta titles/descriptions
- [ ] Open Graph preview works on social media
- [ ] Canonical URLs set on all pages
- [ ] No duplicate content issues

### 8.2 Functional Verification
- [ ] All 32 pages render correctly
- [ ] Auth (login, register, logout, token refresh) works
- [ ] Product search, filter, sort, pagination works
- [ ] Cart (add, remove, update, persist) works
- [ ] Checkout flow completes (coupon, address, payment)
- [ ] Admin CRUD operations work
- [ ] Seller operations work
- [ ] File upload works
- [ ] Invoice download works
- [ ] Payment callback works

### 8.3 Security Verification
- [ ] No secrets in client bundle
- [ ] CSP headers properly set
- [ ] Auth tokens not accessible via XSS
- [ ] Rate limiting active
- [ ] Input sanitization active
- [ ] File upload restrictions active

---

## Migration Summary

| Metric | Current | After Rewrite |
|--------|---------|---------------|
| Rendering | CSR only | SSR + ISR + CSR hybrid |
| SEO Meta | react-helmet-async | Next.js Metadata API |
| Structured Data | None | JSON-LD (Product, WebSite, BreadcrumbList, ItemList) |
| Sitemap | Custom Express route | Built-in Next.js sitemap |
| Images | `<img>` no optimization | `next/image` with WebP, lazy, responsive |
| Routing | react-router-dom | App Router (file-based) |
| Auth tokens | localStorage | localStorage (optionally httpOnly cookies) |
| Data fetching | TanStack Query (client) | TanStack Query + Server Components fetch |
| TypeScript | none in client | Full TypeScript |
| Build size | Vite bundle | Next.js optimized, code-split |

---

## Estimated Timeline (Solo Dev)

| Phase | Estimated Time |
|-------|---------------|
| 1: Init & Config | 0.5 day |
| 2: Core Layout & Providers | 1 day |
| 3: Public Pages (static/ISR) | 1 day |
| 4: Public Pages (SSR) | 1 day |
| 5: Public Pages (CSR) | 2 days |
| 6: Admin Pages | 2 days |
| 7: Seller Pages | 1 day |
| 8: SEO & Metadata | 1 day |
| 9: Security & Headers | 0.5 day |
| 10: Image Optimization & Perf | 1 day |
| 11: Testing & QA | 1 day |
| **Total** | **~12 days** |

---

## How to Start

```
# 1. Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
npm install @tanstack/react-query axios moment-jalaali clsx tailwind-merge
npm remove react-router-dom react-helmet-async

# 3. Update Express server:
#    - Add CORS origin for localhost:3000
#    - Remove express.static(clientDist) block (Next.js serves itself)
#    - Keep everything else identical

# 4. Start migrating pages in order above
```
