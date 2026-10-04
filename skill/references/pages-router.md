# Pages Router — Metadata, Sitemap & Robots

Applies to Next.js with the `pages/` directory (all versions).

**Do not use this file for Vite or plain React apps.** Handle React metadata
according to the rendering strategy of that project.

---

## Rules

1. **Match project language** — see [language.md](language.md). Use `.tsx`/`.jsx`
   and `.ts`/`.js` matching the project.
2. Use `next/head` or a shared `SEO` component — never the App Router metadata
   exports in Pages Router.
3. Inject JSON-LD in the page component body, not only in `<Head>`.
4. Use `public/robots.txt` or an API route for robots rules.
5. Prefer a reusable `SEO` component over repeating Head tags on every page.

---

## next/head

The primary way to set metadata in Pages Router is the `<Head>` component
from `next/head`. It can be used in any page component.

### Page-level metadata pattern

```tsx
// pages/about.tsx
import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us — Site Name</title>
        <meta
          name="description"
          content="A clear description under 160 characters."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://example.com/about" />

        {/* Open Graph */}
        <meta property="og:title" content="About Us — Site Name" />
        <meta
          property="og:description"
          content="Same or slightly different from meta description."
        />
        <meta property="og:url" content="https://example.com/about" />
        <meta property="og:site_name" content="Site Name" />
        <meta property="og:image" content="https://example.com/og/about.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Us — Site Name" />
        <meta
          name="twitter:description"
          content="Twitter-specific description."
        />
        <meta name="twitter:image" content="https://example.com/og/about.png" />
      </Head>
      {/* page content */}
    </>
  );
}
```

### Reusable SEO component (recommended pattern)

Rather than repeating Head tags on every page, create a shared component:

```tsx
// components/SEO.tsx
import Head from "next/head";

type SEOProps = {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
};

export function SEO({
  title,
  description,
  canonical,
  ogImage = "https://example.com/og/default.png",
  ogType = "website",
  noIndex = false,
}: SEOProps) {
  const fullTitle = `${title} — Site Name`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
```

Usage:

```tsx
// pages/services.tsx
import { SEO } from "@/components/SEO";

export default function ServicesPage() {
  return (
    <>
      <SEO
        title="Web Development Services"
        description="Custom React and Next.js development for businesses."
        canonical="https://example.com/services"
      />
      {/* page content */}
    </>
  );
}
```

### Dynamic metadata for data-driven pages

```tsx
// pages/blog/[slug].tsx
import Head from "next/head";
import { GetStaticProps, GetStaticPaths } from "next";

type Post = {
  title: string;
  excerpt: string;
  slug: string;
  coverImage: string;
};

export default function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <Head>
        <title>{post.title} — Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://example.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:type" content="article" />
      </Head>
      {/* post content */}
    </>
  );
}
```

### hreflang (Multilingual)

Add alternate language links inside `<Head>`:

```tsx
<link rel="alternate" hrefLang="en" href="https://example.com/about" />
<link rel="alternate" hrefLang="fr" href="https://example.com/fr/about" />
<link rel="alternate" hrefLang="x-default" href="https://example.com/about" />
```

---

## sitemap.xml

Pages Router doesn't have a built-in sitemap API. The standard approach is a
custom API route or a build-time generated file.

### API route approach

```ts
// pages/api/sitemap.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const posts = await fetchAllPosts();

  const staticPages = ["", "/about", "/services", "/contact"];
  const dynamicPages = posts.map((p) => `/blog/${p.slug}`);
  const allPages = [...staticPages, ...dynamicPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>https://example.com${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(sitemap);
  res.end();
}
```

Add to `next.config.js` to serve at `/sitemap.xml`:

```js
async rewrites() {
  return [{ source: '/sitemap.xml', destination: '/api/sitemap' }]
}
```

Alternatively, use the `next-sitemap` package for a zero-config solution:

```bash
npm install next-sitemap
```

```js
// next-sitemap.config.js
module.exports = {
  siteUrl: "https://example.com",
  generateRobotsTxt: true,
  exclude: ["/admin/*", "/api/*"],
};
```

Add `"postbuild": "next-sitemap"` to package.json scripts.

---

## robots.txt

### Static file (simplest)

Create `public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### Dynamic (via API route)

```ts
// pages/api/robots.ts
export default function handler(req, res) {
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml`);
}
```

---

## Validation

See [validation.md](validation.md).
