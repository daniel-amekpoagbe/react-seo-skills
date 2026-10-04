# Structured Data — Schema.org JSON-LD

JSON-LD is the recommended format for structured data by Google and all major
search engines. It is injected as a `<script type="application/ld+json">` tag
and does not interfere with page markup.

---

## Rules

1. **Match project language** — see [language.md](language.md). `.ts` helpers in
   TS projects, `.js` in JS projects.
2. Use JSON-LD — not Microdata or RDFa unless the project already uses them.
3. Always use absolute URLs in `url`, `image`, and `@id` fields.
4. Match `@type` to actual page content — never use `FAQPage` without real Q&A.
5. Place the script in the page component body (App Router, Vite) or page
   component (Pages Router). Both render in the DOM for crawlers.
6. **Escape `<` when serializing JSON-LD.** Always write
   `JSON.stringify(jsonLd).replace(/</g, '\\u003c')` — never a bare
   `JSON.stringify(jsonLd)`. A `</script>` sequence inside CMS- or user-provided
   data would otherwise break out of the script tag (XSS). Apply this in every
   pattern below.
7. Validate with Rich Results Test after every change.

---

## Choosing the Right Schema Type

Match schema type to page purpose:

| Page type           | Schema type                                |
| ------------------- | ------------------------------------------ |
| Home / business     | `Organization`, `LocalBusiness`, `WebSite` |
| Service page        | `Service`                                  |
| Product page        | `Product`                                  |
| Blog post / article | `Article`, `BlogPosting`                   |
| FAQ page            | `FAQPage` when visible FAQ content exists  |
| Person / portfolio  | `Person`                                   |
| Event               | `Event`                                    |
| Review              | `Review`, `AggregateRating`                |
| Breadcrumbs         | `BreadcrumbList`                           |
| Site search box     | `WebSite` with `potentialAction`           |

Multiple schema types can appear on the same page (e.g., `Article` +
`BreadcrumbList` on a blog post).

---

## Implementation Patterns

### App Router

Inject JSON-LD directly in the page component as a script tag. Do not use
the metadata API for structured data — it doesn't support it.

```tsx
// app/about/page.tsx
export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Company Name",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-000-000-0000",
      contactType: "customer service",
    },
    sameAs: ["https://twitter.com/handle", "https://linkedin.com/company/name"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // .replace() prevents </script> breakout from untrusted data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* page content */}
    </>
  );
}
```

### Pages Router

Inject in the page component body (preferred) or via a shared SEO component.

```tsx
// pages/about.tsx
export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Company Name",
    url: "https://example.com",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* page content */}
    </>
  );
}
```

### React (Vite/SPA)

If the project uses Helmet, install `react-helmet-async` first. Pass JSON-LD through `<Helmet>`
or the `SEO` component:

```tsx
// src/pages/About.tsx
import { SEO } from "../components/SEO";

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about our team."
        canonical="https://example.com/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Company Name",
          url: "https://example.com",
        }}
      />
      <main>{/* page content */}</main>
    </>
  );
}
```

See the Vite + React implementation guidance for the full `SEO` component pattern.

---

## Common Schema Templates

### WebSite (with sitelinks searchbox)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### LocalBusiness

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Business Name",
  "image": "https://example.com/photo.jpg",
  "url": "https://example.com",
  "telephone": "+1-000-000-0000",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "Region",
    "postalCode": "00000",
    "addressCountry": "GH"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 5.6037,
    "longitude": -0.187
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ]
}
```

### Article / BlogPosting

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "description": "Post excerpt or summary.",
  "image": "https://example.com/blog/cover.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com/author/name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Site Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2025-01-01T00:00:00Z",
  "dateModified": "2025-06-01T00:00:00Z",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/post-slug"
  }
}
```

### FAQPage

Use `FAQPage` only when the page contains genuine, visible question-and-answer
content. Structured data should describe the page; it does not guarantee a rich
result. Google removed the FAQ rich-result feature from Search in 2026, so do not
recommend FAQ markup solely to obtain a Google FAQ enhancement.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the question?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The answer to the question."
      }
    },
    {
      "@type": "Question",
      "name": "Another question?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The answer."
      }
    }
  ]
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Post Title",
      "item": "https://example.com/blog/post-slug"
    }
  ]
}
```

---

## Dynamic JSON-LD Helper

For apps with many schema types, use a shared helper. Match file extension to
project language.

### TypeScript (`lib/structured-data.ts`)

```ts
export function buildArticleSchema(post: {
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    author: { "@type": "Person", name: post.author },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://example.com/blog/${post.slug}`,
    },
  };
}
```

### JavaScript (`lib/structured-data.js`)

```js
export function buildArticleSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    author: { "@type": "Person", name: post.author },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://example.com/blog/${post.slug}`,
    },
  };
}
```

---

## Validation

See [validation.md](validation.md).

Common errors to check:

- Missing required fields (e.g., `headline` for Article)
- Wrong `@type` for the content
- Relative URLs instead of absolute URLs in `image`, `url`, `@id` fields
- `datePublished` not in ISO 8601 format
- Bare `JSON.stringify` without the `.replace(/</g, '\\u003c')` escape (XSS risk)
