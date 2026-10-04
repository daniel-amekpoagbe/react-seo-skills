# App Router — Metadata, Sitemap & Robots

Applies to Next.js 13.2+ with the `app/` directory.

**Do not use this file for Vite or plain React apps.** Handle React metadata
according to the rendering strategy of that project.

---

## Rules

1. **Match project language** — see [language.md](language.md). Use `.tsx`/`.ts`
   in TypeScript projects, `.jsx`/`.js` in JavaScript projects.
2. Export `metadata` or `generateMetadata` from Server Components — never use
   `next/head` in App Router. Import the `Metadata` type from `next`.
3. Set `metadataBase` in the root layout for absolute OG image URLs.
4. Inject JSON-LD in page components — the metadata API does not support it.
5. Place `sitemap.ts` / `sitemap.js` and `robots.ts` / `robots.js` in `app/`.

---

## Metadata API

Next.js App Router provides two ways to set metadata:

### Static Metadata

Use when the page content is fixed (home, about, services).

```tsx
// app/page.tsx or app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title — Site Name",
  description: "A clear, keyword-rich description under 160 characters.",
  authors: [{ name: "Author Name" }],
  robots: "index, follow",
  alternates: {
    canonical: "https://example.com/page-slug",
  },
  openGraph: {
    title: "Page Title — Site Name",
    description: "Same or slightly different from meta description.",
    url: "https://example.com/page-slug",
    siteName: "Site Name",
    images: [
      {
        url: "https://example.com/og/page-slug.png",
        width: 1200,
        height: 630,
        alt: "Descriptive alt text for the OG image",
      },
    ],
    locale: "en_US",
    type: "website", // or 'article' for blog posts
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Title — Site Name",
    description: "Twitter-specific description (can be shorter).",
    images: ["https://example.com/og/page-slug.png"],
    creator: "@twitterhandle",
  },
};
```

### Dynamic Metadata

Use when the page is driven by data (blog posts, product pages, user profiles).

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  return {
    title: `${post.title} — Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://example.com/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [{ url: post.coverImage, width: 1200, height: 630 }],
    },
  };
}
```

**Check the project's `next` version in `package.json` before writing this code:**

- **Next.js 15+:** `params` is a `Promise`. Type it as `Promise<{ slug: string }>`
  and `await` it (as shown above).
- **Next.js 14 and earlier:** `params` is a plain object. Type it as
  `{ slug: string }` and do not `await` it.

### Default Metadata in layout.tsx

Set site-wide fallback metadata in the root layout. Page-level metadata merges
and overrides these values.

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"), // required for absolute OG URLs
  title: {
    default: "Site Name",
    template: "%s — Site Name", // page titles render as "Page Title — Site Name"
  },
  description: "Site-wide fallback description.",
  openGraph: {
    siteName: "Site Name",
    locale: "en_US",
    type: "website",
  },
};
```

### hreflang (Multilingual)

```tsx
export const metadata: Metadata = {
  alternates: {
    canonical: "https://example.com/about",
    languages: {
      en: "https://example.com/about",
      fr: "https://example.com/fr/about",
      "x-default": "https://example.com/about",
    },
  },
};
```

---

## sitemap.ts

Place at `app/sitemap.ts`. Next.js generates `/sitemap.xml` automatically.

Note: Google largely ignores `changeFrequency` and `priority`. Include them only
if you have a reason — `url` and `lastModified` matter most.

### Static sitemap

```ts
// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}
```

### Dynamic sitemap

```ts
// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchAllPosts(); // your data fetching

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    { url: "https://example.com", lastModified: new Date(), priority: 1 },
    ...postEntries,
  ];
}
```

---

## robots.ts

Place at `app/robots.ts`. Next.js generates `/robots.txt` automatically.

```ts
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

If the site's documented crawl policy intentionally allows a specific service,
add a matching rule. Do not add service-specific rules solely because the site
targets Google AI features:

```ts
rules: [
  { userAgent: '*', allow: '/' },
  { userAgent: 'GPTBot', allow: '/' },
  { userAgent: 'ClaudeBot', allow: '/' },
  { userAgent: 'PerplexityBot', allow: '/' },
  { userAgent: 'GoogleOther', allow: '/' },
],
```

---

## Validation

See [validation.md](validation.md).
