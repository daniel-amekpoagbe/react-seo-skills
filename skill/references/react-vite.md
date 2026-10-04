# React + Vite — Metadata, Sitemap & Robots

Applies to Vite + React apps with `vite.config.ts` or `vite.config.js`.
Match file extensions to the project language; see [language.md](language.md).

## Rules

1. Match the project's language and file extensions.
2. Never suggest Next.js metadata exports, `generateMetadata`, `sitemap.ts`,
   or `robots.ts` for a Vite app.
3. React 19 can hoist `<title>`, `<meta>`, `<link>`, and `<script>` from JSX.
   Use `react-helmet-async` for React 16-18, its additional API, or SSR
   context handling. Never use the deprecated `react-helmet` package.
4. Place static crawl files in `public/`: `robots.txt` and `sitemap.xml`.
5. Warn about CSR limitations. Metadata can update after JavaScript executes,
   but initial HTML may be empty for non-JavaScript consumers. Recommend
   prerendering or SSR when route indexing matters.

## Agent Workflow

1. Detect the package manager from the lockfile.
2. Choose native React metadata or `react-helmet-async` based on the React
   version and the project's rendering needs.
3. If using Helmet, wrap the app root in `HelmetProvider` and create a shared
   `SEO` component for indexable routes.
4. Add site-wide defaults and per-route metadata using the chosen approach.
5. Create `public/robots.txt` and `public/sitemap.xml` when applicable.
6. Add `public/llms.txt` only when the project has a deliberate use for it.
7. Warn when the app is CSR-only and initial HTML matters.

## index.html Defaults

Keep fallback tags for the home route and non-JavaScript consumers. Per-route
metadata can override them through React or the chosen metadata library.

```html
<title>Site Name</title>
<meta name="description" content="Site-wide fallback description." />
<link rel="canonical" href="https://example.com/" />
```

## sitemap.xml and robots.txt

Create `public/sitemap.xml` with absolute URLs for every public route and
`public/robots.txt` with an intentional crawl policy and sitemap reference:

```txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

For generated sitemaps, write the file during the build or use the project's
existing build tooling. Do not use Next.js route conventions in Vite.

## React Metadata Pattern

For React 19, document metadata directly in the route component:

```tsx
export default function AboutPage() {
  return (
    <>
      <title>About Us - Site Name</title>
      <meta name="description" content="Learn about our team." />
      <link rel="canonical" href="https://example.com/about" />
      <main>{/* page content */}</main>
    </>
  );
}
```

For `react-helmet-async`, use a shared `SEO.tsx` or `SEO.jsx` component and
pass route-specific values rather than repeating metadata blocks.

## CSR and Prerendering

A default Vite SPA may render only an empty root element in the initial HTML.
Some crawlers, social fetchers, and link unfurlers may not execute JavaScript.
Recommend prerendering or SSR when indexable route content and metadata must be
present in the initial response. Do not imply that a metadata library makes a
client-only SPA server-rendered.

## GEO

| Asset            | Location                                    |
| ---------------- | ------------------------------------------- |
| `llms.txt`       | `public/llms.txt` when deliberately adopted |
| AI crawler rules | `public/robots.txt`                         |
| JSON-LD          | Route component or shared SEO component     |

See [geo.md](geo.md) for crawl policy guidance and
[validation.md](validation.md) for verification.
