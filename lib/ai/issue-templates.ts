import type { Issue } from '@/types/scan'

type IssueTemplate = Omit<Issue, 'value'>

export const T: Record<string, IssueTemplate> = {

  // ─────────────────────────────────────────
  // PERFORMANCE (6)
  // ─────────────────────────────────────────

  'lcp-slow': {
    id: 'lcp-slow',
    category: 'performance',
    severity: 'high',
    title: 'Largest Contentful Paint is too slow',
    description: 'LCP exceeds 2500ms — the main content takes too long to appear.',
    plainEnglish:
      `Your page's main image or headline takes more than 2.5 seconds to show up. Visitors see a blank or half-loaded page, and most will leave before it finishes loading.`,
    fixPrompt: `Fix slow LCP in my Next.js app:
1. Identify the LCP element (usually a hero image or h1) in Chrome DevTools > Performance
2. If it's an image:
   - Add priority prop: <Image src="..." priority />
   - Ensure the image is served in WebP/AVIF format
   - Use next/image with correct sizes prop
3. If it's text (h1/hero heading):
   - Use next/font to preload the font and eliminate font swap
   - Avoid placing the heading inside a lazy-loaded component
4. Check for render-blocking third-party scripts — move them to next/script with strategy="lazyOnload"
5. Enable Vercel Edge Network caching for static assets`,
    docsUrl: 'https://web.dev/articles/lcp',
  },

  'cls-high': {
    id: 'cls-high',
    category: 'performance',
    severity: 'high',
    title: 'Layout shifts detected (CLS)',
    description: 'Cumulative Layout Shift score exceeds 0.1 — page elements move after load.',
    plainEnglish:
      'Your page jumps around as it loads — buttons and text shift position, causing visitors to click the wrong thing. Google penalizes sites with this in search rankings.',
    fixPrompt: `Fix layout shifts in my Next.js app:
1. Always set explicit width and height on all images and videos:
   <Image src="..." width={800} height={600} alt="..." />
2. Reserve space for ads or dynamic content with a min-height container
3. Avoid inserting content above existing content after page load
4. If using fonts from next/font, add display: 'swap' option
5. Check for FOUT (flash of unstyled text) — use font-display: optional for non-critical fonts
6. Open Chrome DevTools > Performance > Layout Shift regions to identify offending elements`,
    docsUrl: 'https://web.dev/articles/cls',
  },

  'inp-slow': {
    id: 'inp-slow',
    category: 'performance',
    severity: 'medium',
    title: 'Interaction to Next Paint is slow',
    description: 'INP exceeds 200ms — the page feels sluggish when users click or type.',
    plainEnglish:
      "When visitors click a button or fill in a form, the page takes more than 200ms to respond. This makes your site feel slow and unresponsive, even if it loads quickly.",
    fixPrompt: `Fix slow INP in my Next.js app:
1. Identify slow interactions in Chrome DevTools > Performance > Interactions
2. Break up long JavaScript tasks — use setTimeout or scheduler.yield() to yield to the browser
3. Debounce or throttle expensive event handlers (search inputs, scroll handlers)
4. Move heavy computation to a Web Worker
5. Avoid synchronous localStorage or large DOM reads inside click handlers
6. Use React.memo and useMemo to prevent unnecessary re-renders on interaction`,
    docsUrl: 'https://web.dev/articles/inp',
  },

  'fcp-slow': {
    id: 'fcp-slow',
    category: 'performance',
    severity: 'medium',
    title: 'First Contentful Paint is slow',
    description: 'FCP exceeds 1800ms — visitors wait too long before seeing anything on screen.',
    plainEnglish:
      "Your page takes more than 1.8 seconds before showing any content at all. Visitors stare at a blank screen and may leave before your site even starts to appear.",
    fixPrompt: `Fix slow FCP in my Next.js app:
1. Enable Static Site Generation (SSG) or Incremental Static Regeneration (ISR) — avoid SSR for pages that don't need it
2. Reduce server response time — check Vercel Analytics for TTFB
3. Inline critical CSS (above-the-fold styles) — avoid render-blocking stylesheets
4. Preconnect to required origins in app/layout.tsx:
   <link rel="preconnect" href="https://fonts.googleapis.com" />
5. Remove or defer non-critical third-party scripts
6. Use next/font for fonts to eliminate render-blocking font requests`,
    docsUrl: 'https://web.dev/articles/fcp',
  },

  'perf-score-low': {
    id: 'perf-score-low',
    category: 'performance',
    severity: 'high',
    title: 'Performance score is below 70',
    description: 'Lighthouse performance score is under 70 on mobile.',
    plainEnglish:
      `Your site scores poorly on Google\'s performance test. Slow sites rank lower in search results and convert significantly fewer visitors into customers.`,
    fixPrompt: `Improve Lighthouse performance score in my Next.js app:
1. Run: npx lighthouse <url> --only-categories=performance --output=html
2. Fix the top opportunities shown in the report
3. Quick wins:
   - Replace <img> with next/image everywhere
   - Add next/font and remove Google Fonts <link> tags
   - Enable next.config.ts: { compress: true, images: { formats: ['image/avif', 'image/webp'] } }
   - Audit and remove unused npm packages (use next-bundle-analyzer)
4. Check Core Web Vitals in Vercel Analytics dashboard`,
    docsUrl: 'https://developer.chrome.com/docs/lighthouse/performance/',
  },

  'a11y-score-low': {
    id: 'a11y-score-low',
    category: 'performance',
    severity: 'medium',
    title: 'Accessibility score is below 70',
    description: 'Lighthouse accessibility score is under 70.',
    plainEnglish:
      'Your site is difficult or impossible to use for people with disabilities. This also hurts your SEO — search engines use many of the same signals as screen readers.',
    fixPrompt: `Improve accessibility in my Next.js app:
1. Run: npx lighthouse <url> --only-categories=accessibility --output=html
2. Fix all "Failing" items in the report — common issues:
   - Add alt text to all images: <Image alt="Descriptive text" ... />
   - Add aria-label to icon buttons: <button aria-label="Close menu">
   - Ensure colour contrast ratio is ≥4.5:1 (check with webaim.org/resources/contrastchecker)
   - Add <label> or aria-label to all form inputs
   - Ensure heading levels are sequential (h1 → h2 → h3, no skipping)
3. Install eslint-plugin-jsx-a11y and fix all warnings`,
    docsUrl: 'https://web.dev/accessibility/',
  },

  // ─────────────────────────────────────────
  // SEO / SOCIAL (16)
  // ─────────────────────────────────────────

  'missing-title': {
    id: 'missing-title',
    category: 'seo',
    severity: 'high',
    title: 'Page title is missing',
    description: 'No <title> tag found on the page.',
    plainEnglish:
      'Your page has no title. Browser tabs show a blank name, and Google has nothing to display in search results. This is one of the most basic SEO requirements.',
    fixPrompt: `Add a page title in my Next.js app:
In app/layout.tsx or the specific page file, add metadata export:
export const metadata: Metadata = {
  title: 'Your Page Title — Brand Name',
  // For dynamic pages use generateMetadata:
}
For dynamic pages (e.g. blog posts), use:
export async function generateMetadata({ params }) {
  return { title: \`\${post.title} — My Site\` }
}`,
    docsUrl: 'https://nextjs.org/docs/app/api-reference/functions/generate-metadata#title',
  },

  'title-length': {
    id: 'title-length',
    category: 'seo',
    severity: 'medium',
    title: 'Page title length is not optimal',
    description: 'Title is either too short (<30 chars) or too long (>60 chars).',
    plainEnglish:
      'Your page title is either too short to be descriptive, or too long and gets cut off in Google search results with "...". Both reduce click-through rates.',
    fixPrompt: `Fix title length in my Next.js app:
In app/layout.tsx or the page's metadata export:
export const metadata: Metadata = {
  title: {
    default: 'Descriptive Title Here — Brand Name', // aim for 50–60 chars
    template: '%s — Brand Name', // for inner pages
  },
}
Rule: 50–60 characters is ideal. Include the main keyword near the start.`,
    docsUrl: 'https://developers.google.com/search/docs/appearance/title-link',
  },

  'missing-description': {
    id: 'missing-description',
    category: 'seo',
    severity: 'high',
    title: 'Meta description is missing',
    description: 'No <meta name="description"> tag found.',
    plainEnglish:
      'Your page has no description. Google shows a random snippet of text from your page in search results instead, which often looks unprofessional and reduces clicks.',
    fixPrompt: `Add meta description in my Next.js app:
In app/layout.tsx or the page file:
export const metadata: Metadata = {
  description: 'Clear, compelling description of this page in 150–160 characters. Include your main keyword and a reason to click.',
}
For dynamic pages:
export async function generateMetadata({ params }) {
  return { description: post.excerpt.slice(0, 160) }
}`,
    docsUrl: 'https://developers.google.com/search/docs/appearance/snippet',
  },

  'missing-h1': {
    id: 'missing-h1',
    category: 'seo',
    severity: 'high',
    title: 'H1 heading is missing or duplicated',
    description: 'Page has 0 or more than 1 <h1> tag.',
    plainEnglish:
      'Every page should have exactly one main heading (H1) that tells Google what the page is about. Missing or multiple H1s confuse search engines and lower your rankings.',
    fixPrompt: `Fix H1 heading in my Next.js app:
1. Each page should have exactly one <h1> — put it in the page component, not layout
2. The h1 should contain your primary keyword for that page
3. In app/page.tsx:
   <h1 className="text-4xl font-bold">Your Primary Keyword Phrase</h1>
4. Run: grep -r "<h1" app/ to find all h1 tags and ensure one per page
5. Don't use h1 in shared layouts or components that render on multiple pages`,
    docsUrl: 'https://developers.google.com/search/docs/appearance/visual-elements-gallery',
  },

  'missing-canonical': {
    id: 'missing-canonical',
    category: 'seo',
    severity: 'medium',
    title: 'Canonical URL is missing',
    description: 'No <link rel="canonical"> tag found.',
    plainEnglish:
      'Without a canonical tag, Google might index multiple versions of your page (with/without www, with/without trailing slash) and split your SEO value between them.',
    fixPrompt: `Add canonical URL in my Next.js app:
Next.js 13+ App Router adds canonical automatically when you set metadataBase.
In app/layout.tsx:
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  alternates: { canonical: '/' }, // or the specific path
}
For dynamic pages:
export async function generateMetadata({ params }) {
  return {
    alternates: { canonical: \`/blog/\${params.slug}\` }
  }
}`,
    docsUrl: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },

  'missing-og-title': {
    id: 'missing-og-title',
    category: 'seo',
    severity: 'high',
    title: 'Open Graph title missing',
    description: 'No og:title meta tag found.',
    plainEnglish:
      'When someone shares your link on social media or messaging apps, no title appears — just a blank card or raw URL. This drastically reduces engagement with shared links.',
    fixPrompt: `Add og:title in my Next.js app:
In app/layout.tsx or the page file:
export const metadata: Metadata = {
  title: 'Your Page Title',
  openGraph: {
    title: 'Your Page Title — Optimized for Social Sharing',
    // og:title can be slightly different from <title> — more engaging
  },
}
Note: Next.js copies title to og:title automatically if you don't set openGraph.title separately.`,
    docsUrl: 'https://ogp.me/',
  },

  'missing-og-description': {
    id: 'missing-og-description',
    category: 'seo',
    severity: 'medium',
    title: 'Open Graph description missing',
    description: 'No og:description meta tag found.',
    plainEnglish:
      'When someone shares your link, no description shows under the title. Social media cards look incomplete and get fewer clicks than ones with clear descriptions.',
    fixPrompt: `Add og:description in my Next.js app:
In app/layout.tsx or the page file:
export const metadata: Metadata = {
  description: 'Your meta description',
  openGraph: {
    description: 'Slightly longer/different version for social sharing — up to 200 chars',
  },
}
Next.js copies the description to og:description automatically if not set separately.`,
    docsUrl: 'https://ogp.me/',
  },

  'missing-og-image': {
    id: 'missing-og-image',
    category: 'seo',
    severity: 'high',
    title: 'Open Graph image missing',
    description: 'No og:image meta tag found.',
    plainEnglish:
      'When someone shares your link on Twitter or Telegram, no image appears. This cuts click-through rates by up to 3×.',
    fixPrompt: `Add og:image to my Next.js app:
1. Create public/og-image.png (1200×630px)
2. In app/layout.tsx add to metadata:
   openGraph: { images: [{ url: '/og-image.png', width: 1200, height: 630 }] }
Or use app/opengraph-image.tsx with next/og for dynamic generation.`,
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/opengraph-image',
  },

  'og-image-invalid': {
    id: 'og-image-invalid',
    category: 'seo',
    severity: 'high',
    title: 'Open Graph image URL is broken',
    description: 'The og:image URL returns a non-200 status or is unreachable.',
    plainEnglish:
      'You have an og:image tag, but the image URL is broken — it returns an error. Social media sites will show a placeholder or nothing when your link is shared.',
    fixPrompt: `Fix broken og:image in my Next.js app:
1. Check the current og:image URL in your metadata — open it in a browser tab
2. If using a relative path, ensure metadataBase is set in app/layout.tsx:
   metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!)
3. If using next/og (opengraph-image.tsx), test the route at /opengraph-image
4. Ensure the image file exists in the public/ directory
5. Check Vercel deployment logs for image-related 404s`,
    docsUrl: 'https://developers.facebook.com/tools/debug/',
  },

  'placeholder-text': {
    id: 'placeholder-text',
    category: 'seo',
    severity: 'medium',
    title: 'Placeholder text found on page',
    description: 'Generic placeholder text like "lorem ipsum" or "your name here" found in page body.',
    plainEnglish:
      'Your page contains dummy text that was never replaced with real content. This looks unprofessional to visitors and can cause Google to rank your page as low-quality content.',
    fixPrompt: `Find and replace placeholder text in my Next.js app:
1. Search for placeholder strings:
   grep -ri "lorem ipsum\\|your name here\\|placeholder" app/ components/ --include="*.tsx" --include="*.ts"
2. Replace all found placeholder text with real content
3. Check all page components and any mock/seed data
4. If using CMS data, ensure all content fields are populated in production`,
  },

  'desc-length': {
    id: 'desc-length',
    category: 'seo',
    severity: 'low',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'Meta description length is not optimal',
    description: 'Meta description is either too short (<100 chars) or too long (>165 chars).',
    plainEnglish: 'Your meta description is either too short (under 100 chars) or too long (over 165 chars). Google typically shows 100–165 characters. Too short leaves value on the table; too long gets cut off with "…".',
    fixPrompt: 'Update the meta description to be between 120–160 characters. In Next.js, update the `description` field in `generateMetadata()`. Aim for: keyword-rich first 120 characters, compelling CTA in the last 30.',
  },

  'canonical-mismatch': {
    id: 'canonical-mismatch',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Canonical URL points to a different domain',
    description: 'The canonical tag hostname does not match the page hostname.',
    plainEnglish: 'The canonical tag says this page belongs to a different domain than the one you\'re actually on. Google will index the canonical domain\'s version and ignore this one, potentially splitting ranking signals.',
    fixPrompt: 'In Next.js, set `alternates: { canonical: process.env.NEXT_PUBLIC_APP_URL }` in `generateMetadata()`. Ensure `NEXT_PUBLIC_APP_URL` matches your actual production domain (no trailing slash).',
  },

  'canonical-double-slash': {
    id: 'canonical-double-slash',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Canonical URL contains a double-slash path',
    description: 'The canonical URL contains a malformed double-slash in the path.',
    plainEnglish: 'Your canonical URL has an extra slash in the path. Google may treat that as a different URL and split ranking signals.',
    fixPrompt: 'Normalize the base URL before building canonical URLs. In Next.js, strip the trailing slash from `NEXT_PUBLIC_APP_URL` and use `new URL(path, baseUrl).toString()` or `.replace(/\\/$/, "")` before concatenating paths.',
  },

  'missing-og-url': {
    id: 'missing-og-url',
    category: 'seo',
    severity: 'medium',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Open Graph URL missing',
    description: 'No og:url meta tag found.',
    plainEnglish: 'Social platforms and crawlers have no explicit canonical sharing URL for this page. This can weaken preview consistency across channels.',
    fixPrompt: 'Add `openGraph: { url: process.env.NEXT_PUBLIC_APP_URL }` or a page-specific absolute URL in Next.js metadata. Make sure it matches the canonical URL.',
  },

  'og-url-mismatch': {
    id: 'og-url-mismatch',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Open Graph URL points to a different domain',
    description: 'The og:url hostname does not match the page hostname.',
    plainEnglish: 'Your share preview says the page belongs to a different domain than the one visitors are on. That creates inconsistent social previews and indexing signals.',
    fixPrompt: 'Set `openGraph.url` to the same production domain used by the canonical URL. In Next.js, normalize `NEXT_PUBLIC_APP_URL` once and reuse it for canonical and Open Graph URL generation.',
  },

  'sensitive-page-indexable': {
    id: 'sensitive-page-indexable',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Sensitive page appears indexable',
    description: 'This private or low-value route has no noindex directive.',
    plainEnglish: 'This page looks like a report, dashboard, or account page, but search engines are not told to keep it out of the index.',
    fixPrompt: 'Add `robots: { index: false, follow: false }` metadata for private routes. In Next.js App Router, export `metadata` from the route page or add a route-specific noindex header.',
  },

  'page-noindex': {
    id: 'page-noindex',
    category: 'seo',
    severity: 'medium',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Page is marked noindex',
    description: 'The page has a robots noindex directive.',
    plainEnglish: 'Search engines are instructed not to index this page. This is correct for private pages, but a problem for public marketing or product pages.',
    fixPrompt: 'If this is a public page, remove the noindex directive from page metadata or headers. If it is private, keep noindex and make sure it is not included in sitemap.xml.',
  },

  'image-missing-alt': {
    id: 'image-missing-alt',
    category: 'seo',
    severity: 'medium',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Images are missing alt text',
    description: 'One or more non-decorative images do not have an alt attribute.',
    plainEnglish: 'Some images have no alt text. Screen readers and search engines lose context, and image search previews are weaker.',
    fixPrompt: 'Add descriptive `alt` text to meaningful images. In Next.js, every `<Image>` should have an `alt` prop. Use `alt=""` only for decorative images.',
  },

  'image-missing-dimensions': {
    id: 'image-missing-dimensions',
    category: 'seo',
    severity: 'medium',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Images are missing dimensions',
    description: 'One or more images are missing width/height attributes.',
    plainEnglish: 'Images without dimensions can cause layout shifts while the page loads. That hurts Core Web Vitals and makes the page feel unstable.',
    fixPrompt: 'Set explicit `width` and `height` on images, or reserve space with CSS `aspect-ratio`. In Next.js, prefer `<Image width={...} height={...} />` for known assets.',
  },

  'missing-structured-data': {
    id: 'missing-structured-data',
    category: 'seo',
    severity: 'medium',
    confidence: 'likely',
    scoreEligible: true,
    title: 'No structured data (JSON-LD) found',
    description: 'No <script type="application/ld+json"> blocks found on the page.',
    plainEnglish: 'No Schema.org JSON-LD blocks were found on this page. Structured data helps Google understand your content and display rich results. It also improves AI search visibility.',
    fixPrompt: 'Add at minimum an Organization or WebApplication schema in a `<script type="application/ld+json">` tag in your page `<head>`. In Next.js, inject it server-side in the root layout.',
  },

  'missing-operating-system': {
    id: 'missing-operating-system',
    category: 'seo',
    severity: 'medium',
    confidence: 'likely',
    scoreEligible: true,
    title: 'WebApplication schema is missing operatingSystem',
    description: 'WebApplication or SoftwareApplication JSON-LD is present but lacks the operatingSystem field.',
    plainEnglish: 'Your WebApplication or SoftwareApplication structured data is missing the `operatingSystem` field. Google requires this for Software rich results in search.',
    fixPrompt: 'Add `operatingSystem: "Web"` to your WebApplication JSON-LD schema. In Next.js, update the schema object in `app/layout.tsx` that contains `"@type": "WebApplication"`.',
  },

  'thin-llms-txt': {
    id: 'thin-llms-txt',
    category: 'ai_visibility',
    severity: 'medium',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'llms.txt file is too short',
    description: 'llms.txt was found but contains fewer than 100 words.',
    plainEnglish: 'Your llms.txt exists but has very few words. AI systems (Perplexity, ChatGPT, Claude) use this file to understand your product. A thin file means generic or wrong AI-generated summaries about your site.',
    fixPrompt: 'Expand llms.txt to at least 150 words. Include: a 1-paragraph product description, target audience, key features, a FAQ section (5+ Q&A pairs), and author/organization info. Save to `public/llms.txt`.',
  },

  'no-explicit-ai-crawlers': {
    id: 'no-explicit-ai-crawlers',
    category: 'ai_visibility',
    severity: 'low',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'No explicit AI crawler rules in robots.txt',
    description: 'robots.txt has no explicit rules for named AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot).',
    plainEnglish: 'Your robots.txt has no explicit rules for AI crawlers (GPTBot, ClaudeBot, PerplexityBot). While a wildcard `Allow: /` covers them, naming them explicitly signals AI-indexing intent and is best practice for AI search visibility.',
    fixPrompt: 'In `app/robots.ts`, add explicit Allow rules: `{ userAgent: "GPTBot", allow: "/" }`, `{ userAgent: "ClaudeBot", allow: "/" }`, `{ userAgent: "PerplexityBot", allow: "/" }`, `{ userAgent: "OAI-SearchBot", allow: "/" }`.',
  },

  'images-missing-alt': {
    id: 'images-missing-alt',
    category: 'seo',
    severity: 'medium',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'Images with empty or missing alt text',
    description: 'One or more non-decorative images have empty or missing alt attributes.',
    plainEnglish: 'Some images have no meaningful alt text. Screen readers read these as "image" with no context, hurting accessibility and image search visibility.',
    fixPrompt: 'Add descriptive alt text to all meaningful images. Use alt="" only for purely decorative images that also have role="presentation" or aria-hidden="true". In Next.js every <Image> requires an alt prop.',
  },

  'meta-robots-noindex': {
    id: 'meta-robots-noindex',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Page blocked from indexing via meta robots',
    description: 'meta[name="robots"] contains noindex — search engines will not index this page.',
    plainEnglish: 'A meta tag explicitly tells search engines not to index this page. If this is a public marketing or product page, removing noindex is critical for organic traffic.',
    fixPrompt: 'In Next.js, remove `robots: { index: false }` from the page metadata export or generateMetadata(). Check that no middleware or layout is injecting a noindex directive for this route.\n\nAfter deploying the fix, use Google Search Console → URL Inspection → Request Indexing to re-submit the page.',
    docsUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
  },

  'robots-txt-disallow': {
    id: 'robots-txt-disallow',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'URL disallowed in robots.txt',
    description: 'The scanned URL path is blocked by a Disallow rule in robots.txt for Googlebot or all crawlers.',
    plainEnglish: 'Your robots.txt file tells Google not to crawl this page. If this is a public page you want indexed, the Disallow rule needs to be removed or narrowed.',
    fixPrompt: 'In Next.js, update app/robots.ts and remove or narrow the Disallow rule that blocks this path. Check both wildcard (*) and Googlebot-specific rules. After deploying, use Google Search Console > URL Inspection to request re-crawling.',
    docsUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt',
  },

  'thin-internal-linking': {
    id: 'thin-internal-linking',
    category: 'seo',
    severity: 'low',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'Very few internal links on the page',
    description: 'Fewer than 3 internal anchor links found in the page body.',
    plainEnglish: 'This page has almost no links to other pages on your site. Internal links help Google discover and understand your site structure, and help visitors navigate. Most substantive pages should link to at least 3–5 related pages.',
    fixPrompt: 'Add at least 3 internal links from this page to related pages on your site. In Next.js, use <Link href="/related-page"> components. Good candidates: navigation links, related articles, CTAs pointing to other sections of your product.',
    docsUrl: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
  },

  'canonical-url-mismatch': {
    id: 'canonical-url-mismatch',
    category: 'seo',
    severity: 'medium',
    confidence: 'likely',
    scoreEligible: false,
    title: 'Canonical URL differs from page URL',
    description: 'The canonical tag points to a different URL than the current page after normalising trailing slashes.',
    plainEnglish: 'Your canonical tag points to a slightly different URL than the page you\'re on (e.g., with/without trailing slash, or a different path). Google will treat the canonical URL as the "real" version and may not index this one.',
    fixPrompt: 'In Next.js, ensure alternates.canonical in generateMetadata() exactly matches the production URL for this page. Set metadataBase to your NEXT_PUBLIC_APP_URL and use relative paths in alternates.canonical.',
    docsUrl: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },

  // ─────────────────────────────────────────
  // SECURITY (15)
  // ─────────────────────────────────────────

  'no-https': {
    id: 'no-https',
    category: 'security',
    severity: 'critical',
    title: 'Site is not served over HTTPS',
    description: 'The URL uses HTTP, not HTTPS — traffic is unencrypted.',
    plainEnglish:
      'Your site is not encrypted. Anyone on the same network can read or modify data your visitors send you — including passwords and form submissions. Browsers also show a "Not Secure" warning, which kills trust instantly.',
    fixPrompt: `Enable HTTPS for my Next.js app:
1. On Vercel: HTTPS is automatic — just deploy and use your .vercel.app or custom domain
2. For custom domain on Vercel: go to Project > Settings > Domains > add your domain — SSL is provisioned automatically
3. If self-hosting, use Let's Encrypt with Certbot: certbot --nginx -d yourdomain.com
4. Ensure NEXT_PUBLIC_APP_URL starts with https://
5. Add permanent redirect from HTTP to HTTPS in next.config.ts:
   async redirects() {
     return [{ source: '/:path*', has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }], destination: 'https://yourdomain.com/:path*', permanent: true }]
   }`,
    docsUrl: 'https://web.dev/articles/why-https-matters',
  },

  'missing-hsts': {
    id: 'missing-hsts',
    category: 'security',
    severity: 'high',
    title: 'HSTS header missing',
    description: 'Strict-Transport-Security response header is not set.',
    plainEnglish:
      'Your site allows browsers to connect over HTTP even though you have HTTPS. Attackers can intercept the first request and downgrade visitors to unencrypted HTTP. HSTS prevents this.',
    fixPrompt: `Add HSTS header in my Next.js app:
In next.config.ts, add to headers():
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    }],
  }]
}
Note: Only add this once your site is fully on HTTPS — HSTS cannot be easily reverted.`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
  },

  'missing-x-frame': {
    id: 'missing-x-frame',
    category: 'security',
    severity: 'medium',
    title: 'X-Frame-Options header missing',
    description: 'X-Frame-Options response header is not set.',
    plainEnglish:
      'Your site can be embedded in an invisible iframe on another website. Attackers use this technique (called "clickjacking") to trick your users into clicking things without realising it.',
    fixPrompt: `Add X-Frame-Options header in my Next.js app:
In next.config.ts:
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // SAMEORIGIN: allow iframes only from your own domain
      // DENY: block all iframes (use this if you never need embedding)
    ],
  }]
}`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
  },

  'missing-xcto': {
    id: 'missing-xcto',
    category: 'security',
    severity: 'medium',
    title: 'X-Content-Type-Options header missing',
    description: 'X-Content-Type-Options: nosniff header is not set.',
    plainEnglish:
      'Browsers can "sniff" your files and treat them as a different file type than intended. This can allow attackers to upload files that get executed as scripts. This header prevents that.',
    fixPrompt: `Add X-Content-Type-Options header in my Next.js app:
In next.config.ts:
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ],
  }]
}`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
  },

  'missing-referrer-policy': {
    id: 'missing-referrer-policy',
    category: 'security',
    severity: 'low',
    title: 'Referrer-Policy header missing',
    description: 'Referrer-Policy response header is not set.',
    plainEnglish:
      'When visitors click a link to leave your site, their browser sends your full URL (including any private query parameters) to the destination site. A referrer policy controls what gets shared.',
    fixPrompt: `Add Referrer-Policy header in my Next.js app:
In next.config.ts:
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  }]
}
'strict-origin-when-cross-origin' is a sensible default: sends full URL to same-origin, only the origin to cross-origin HTTPS, nothing to HTTP destinations.`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
  },

  'missing-csp': {
    id: 'missing-csp',
    category: 'security',
    severity: 'high',
    title: 'Content Security Policy missing',
    description: 'No Content-Security-Policy header found.',
    plainEnglish:
      "There's no policy controlling what scripts and resources your page can load. Without this, an attacker who injects any code into your page can do anything — steal cookies, redirect users, exfiltrate data.",
    fixPrompt: `Add Content-Security-Policy in my Next.js app:
In next.config.ts, start with a report-only policy to avoid breaking anything:
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy-Report-Only',
      value: [
        "default-src 'self'",
        "script-src 'self' 'nonce-{NONCE}'", // use next.js nonce support
        "style-src 'self'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
      ].join('; ')
    }],
  }]
}
See Next.js docs for nonce-based CSP with App Router.`,
    docsUrl: 'https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy',
  },

  'unsafe-csp': {
    id: 'unsafe-csp',
    category: 'security',
    severity: 'high',
    title: "CSP contains 'unsafe-inline' or 'unsafe-eval'",
    description: "Content-Security-Policy includes 'unsafe-inline' or 'unsafe-eval', weakening protection.",
    plainEnglish:
      "You have a Content Security Policy, but it includes 'unsafe-inline' or 'unsafe-eval' which largely defeats the purpose. It's like having a lock on your door but leaving the key in it.",
    fixPrompt: `Remove unsafe-inline/unsafe-eval from CSP in my Next.js app:
1. Replace 'unsafe-inline' for scripts with a nonce-based approach:
   - Next.js 13.4+ supports nonce via middleware:
   // middleware.ts
   import { NextRequest, NextResponse } from 'next/server'
   export function middleware(request: NextRequest) {
     const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
     const csp = \`script-src 'self' 'nonce-\${nonce}'\`
     const headers = new Headers(request.headers)
     headers.set('x-nonce', nonce)
     const response = NextResponse.next({ request: { headers } })
     response.headers.set('Content-Security-Policy', csp)
     return response
   }
2. For styles, prefer CSS Modules or Tailwind (no inline styles needed)
3. Remove 'unsafe-eval' — ensure no libraries use eval() (check bundle with next-bundle-analyzer)`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src',
  },

  'ssl-expiring': {
    id: 'ssl-expiring',
    category: 'security',
    severity: 'high',
    title: 'SSL certificate expiring soon',
    description: 'SSL certificate expires within 30 days.',
    plainEnglish:
      "Your HTTPS certificate is about to expire. Once it does, browsers will show a scary 'Your connection is not private' warning to every visitor — and most will immediately leave.",
    fixPrompt: `Renew SSL certificate:
If using Vercel: SSL is managed automatically — no action needed unless using a custom domain that was manually configured.

For custom certificates:
1. Check certificate expiry: openssl s_client -connect yourdomain.com:443 | openssl x509 -noout -dates
2. If using Let's Encrypt with Certbot: sudo certbot renew
3. Set up auto-renewal: add to crontab: 0 12 * * * /usr/bin/certbot renew --quiet
4. If using Cloudflare, certificates auto-renew — check the SSL/TLS dashboard`,
    docsUrl: 'https://letsencrypt.org/docs/renewing/',
  },

  'exposed-env-file': {
    id: 'exposed-env-file',
    category: 'security',
    severity: 'critical',
    title: 'Environment file publicly accessible',
    description: '.env or config file returns 200 at a public URL.',
    plainEnglish:
      'Your API keys and passwords are visible to anyone right now. Attackers scan for this automatically — rotate your keys immediately.',
    fixPrompt: `URGENT — do this now:
1. Go to OpenAI/Stripe/etc. dashboards and revoke all exposed keys
2. Generate new keys and add them to Vercel Environment Variables
3. Verify .env and .env.local are in .gitignore
4. Check next.config.js has no rewrites exposing .env
5. Redeploy`,
    docsUrl: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables',
  },

  'api-key-in-html': {
    id: 'api-key-in-html',
    category: 'security',
    severity: 'critical',
    title: 'API key found in page HTML',
    description: 'A secret API key pattern was detected in the page source.',
    plainEnglish:
      "A secret API key is visible in your page's HTML source code. Anyone can view-source your page and steal it — this is actively exploited by bots that scrape the web looking for this.",
    fixPrompt: `URGENT — remove exposed API key from HTML:
1. IMMEDIATELY revoke the exposed key in the respective service dashboard
2. Find where the key is leaking — search your codebase:
   grep -r "sk-\\|pk_live_\\|AIzaSy\\|AKIA" --include="*.tsx" --include="*.ts" --include="*.js"
3. Common causes:
   - NEXT_PUBLIC_ prefix on secret env vars (never use NEXT_PUBLIC_ for secrets)
   - Passing secret keys to client components as props
   - Calling server APIs directly from client-side fetch with embedded keys
4. Move the key to a server-only env var (no NEXT_PUBLIC_ prefix)
5. Create a server-side API route to proxy requests that need the key
6. Generate new key and add it only to Vercel server-side Environment Variables
7. Redeploy`,
    docsUrl: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser',
  },

  'mixed-content': {
    id: 'mixed-content',
    category: 'security',
    severity: 'high',
    title: 'Mixed content — HTTP resources on HTTPS page',
    description: 'Page loaded over HTTPS contains resources (scripts, images, styles) loaded over HTTP.',
    plainEnglish:
      'Your HTTPS page loads some resources (images, scripts, or styles) over insecure HTTP. Browsers block or warn about this, causing parts of your page to break or display incorrectly for visitors.',
    fixPrompt: `Fix mixed content in my Next.js app:
1. Find all HTTP resource URLs in your code:
   grep -r '"http://' --include="*.tsx" --include="*.ts" --include="*.css" app/ components/
2. Replace all http:// URLs with https:// equivalents
3. For external images, check if the domain supports HTTPS (most do)
4. In next.config.ts, add Content-Security-Policy with upgrade-insecure-requests:
   { key: 'Content-Security-Policy', value: "upgrade-insecure-requests;" }
5. Check third-party embed codes (maps, widgets) — update to their HTTPS versions`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content',
  },

  'missing-permissions-policy': {
    id: 'missing-permissions-policy',
    category: 'security',
    severity: 'low',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Missing Permissions-Policy header',
    description: 'Permissions-Policy response header is absent — browser features are unrestricted.',
    plainEnglish: 'Without a Permissions-Policy header, any script on your page can access the camera, microphone, geolocation, and other sensitive browser features. This is a defence-in-depth security header that limits exposure if you get XSS.',
    fixPrompt: 'In next.config.ts headers(), add: { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }. Adjust the value to allow only the features your site actually uses.',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy',
  },

  'missing-cookie-consent': {
    id: 'missing-cookie-consent',
    category: 'security',
    severity: 'medium',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'No cookie consent mechanism detected',
    description: 'Analytics/tracking scripts found but no cookie consent banner pattern detected.',
    plainEnglish: 'Your site loads tracking scripts (Google Analytics, Meta Pixel, etc.) but no cookie consent banner was found. GDPR and similar laws require informed consent before tracking EU visitors — fines can reach €20M.',
    fixPrompt: 'Add a cookie consent solution before your analytics scripts load. Options: (1) CookieYes or Cookiebot (managed SaaS), (2) react-cookie-consent package, (3) build a simple banner that conditionally loads analytics. In Next.js, wrap GA/GTM initialization in a consent check before calling gtag() or loading the script.',
    docsUrl: 'https://gdpr.eu/cookies/',
  },

  'missing-privacy-policy': {
    id: 'missing-privacy-policy',
    category: 'security',
    severity: 'medium',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'No privacy policy link found',
    description: 'No link to a privacy policy page was detected on this page.',
    plainEnglish: 'A privacy policy link is legally required in most jurisdictions if you collect any user data. It also builds trust with visitors who want to understand how their data is handled.',
    fixPrompt: 'Create a privacy policy page at /privacy and add a link to it in your site footer. In Next.js: (1) create app/privacy/page.tsx, (2) add <Link href="/privacy">Privacy Policy</Link> in your footer component. Use a privacy policy generator (e.g., Termly, PrivacyPolicies.com) as a starting template.',
  },

  'third-party-trackers': {
    id: 'third-party-trackers',
    category: 'security',
    severity: 'low',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'Third-party tracking scripts detected',
    description: 'External scripts from known tracker domains were found on the page.',
    plainEnglish: 'Your site loads scripts from third-party tracking services. Each tracker adds latency, can access cookies/localStorage, and represents a privacy surface. More trackers = slower page + more GDPR liability.',
    fixPrompt: 'Review each tracking script and remove any you don\'t actively use. For essential trackers, ensure: (1) consent gate before loading, (2) use next/script with strategy="afterInteractive", (3) configure the tracker to respect Do Not Track. Consider server-side analytics (Plausible, Fathom, PostHog cloud) which load no client-side tracker.',
  },

  // ─────────────────────────────────────────
  // SECURITY — DNS / Email / Cookies / Paths (added Phase 1)
  // ─────────────────────────────────────────

  'missing-spf': {
    id: 'missing-spf',
    category: 'security',
    severity: 'medium',
    title: 'No SPF record found',
    description: 'No SPF TXT record was found in the domain DNS.',
    plainEnglish: 'SPF tells email servers which servers are allowed to send email for your domain. Without it, anyone can send email pretending to be you, and your own emails may land in spam.',
    fixPrompt: 'Add an SPF TXT record to your DNS. Minimal example:\n  Name: @ (or your domain)\n  Type: TXT\n  Value: "v=spf1 include:_spf.google.com ~all"\nReplace the include with your actual email provider (Resend, SendGrid, Postmark, etc.). Use ~all (softfail) to start, tighten to -all once emails are confirmed working.',
    docsUrl: 'https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/',
  },

  'missing-dmarc': {
    id: 'missing-dmarc',
    category: 'security',
    severity: 'high',
    title: 'No DMARC record found',
    description: 'No DMARC TXT record at _dmarc.<domain> was found.',
    plainEnglish: 'DMARC tells email providers what to do when someone forges your domain in emails. Without it, phishing attacks using your domain name are trivially easy.',
    fixPrompt: 'Add a DMARC TXT record to your DNS:\n  Name: _dmarc\n  Type: TXT\n  Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com"\nStart with p=quarantine (suspicious emails go to spam) then move to p=reject once you confirm no false positives. The rua address receives aggregate reports.',
    docsUrl: 'https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/',
  },

  'weak-dmarc-policy': {
    id: 'weak-dmarc-policy',
    category: 'security',
    severity: 'medium',
    title: 'DMARC policy is set to none (monitoring only)',
    description: 'DMARC record exists but p=none — emails that fail DMARC are still delivered.',
    plainEnglish: 'Your DMARC record only monitors, it does not protect. Emails that fail DMARC (including spoofed phishing from your domain) are still delivered to inboxes.',
    fixPrompt: 'Change your DMARC policy from p=none to p=quarantine once you confirm your legitimate email sources all pass SPF or DKIM. Then graduate to p=reject for maximum protection:\n  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"',
  },

  'missing-caa': {
    id: 'missing-caa',
    category: 'security',
    severity: 'low',
    title: 'No CAA DNS record',
    description: 'No Certification Authority Authorization record found. Any CA can issue SSL certificates for this domain.',
    plainEnglish: 'Without a CAA record, any certificate authority in the world can issue an SSL certificate for your domain. A CAA record restricts which CAs are allowed.',
    fixPrompt: 'Add CAA records to restrict certificate issuance to your CA:\n  Name: @\n  Type: CAA\n  Value: 0 issue "letsencrypt.org"\n  Value: 0 issue "sectigo.com"\nAdd entries for each CA you use. This prevents unauthorized certificate issuance.',
  },

  // ── Cookie security flags ─────────────────────────────────

  'cookie-missing-secure': {
    id: 'cookie-missing-secure',
    category: 'security',
    severity: 'high',
    title: 'Cookie set without Secure flag',
    description: 'One or more Set-Cookie headers are missing the Secure flag.',
    plainEnglish: 'Without the Secure flag, cookies (including session tokens) can be sent over HTTP connections, making them visible to network attackers.',
    fixPrompt: 'Add the Secure flag to all cookies that contain sensitive data:\n  Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Lax\nIn Next.js API routes:\n  res.setHeader("Set-Cookie", serialize("session", value, { secure: true, httpOnly: true, sameSite: "lax" }))\nIn Supabase auth, cookies are managed by @supabase/ssr — ensure NEXT_PUBLIC_APP_URL uses https://.',
  },

  'cookie-missing-httponly': {
    id: 'cookie-missing-httponly',
    category: 'security',
    severity: 'high',
    title: 'Cookie set without HttpOnly flag',
    description: 'One or more Set-Cookie headers are missing the HttpOnly flag.',
    plainEnglish: 'Without HttpOnly, JavaScript on the page (including injected scripts from XSS attacks) can read your cookies, including session tokens.',
    fixPrompt: 'Add HttpOnly to all session and auth cookies:\n  Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax\nHttpOnly prevents document.cookie access from JavaScript. This does not affect server-side cookie reads.',
  },

  'cookie-missing-samesite': {
    id: 'cookie-missing-samesite',
    category: 'security',
    severity: 'medium',
    title: 'Cookie set without SameSite attribute',
    description: 'One or more cookies are missing the SameSite attribute, defaulting to browser behaviour.',
    plainEnglish: 'Without SameSite, cookies may be sent with cross-site requests, enabling CSRF attacks. Modern browsers default to Lax, but explicit is better.',
    fixPrompt: 'Add SameSite=Lax to all cookies (or Strict for sensitive sessions):\n  Set-Cookie: session=abc123; SameSite=Lax; Secure; HttpOnly\nUse SameSite=Strict for admin sessions. Use SameSite=None only if you need cross-site cookie sharing (requires Secure).',
  },

  // ── Exposed sensitive paths ───────────────────────────────

  'exposed-git-head': {
    id: 'exposed-git-head',
    category: 'security',
    severity: 'high',
    title: '.git directory is publicly accessible',
    description: '/.git/HEAD returned HTTP 200, meaning the git repository may be downloadable.',
    plainEnglish: 'Your .git directory is publicly accessible. Anyone can download your entire source code history, including any secrets or tokens that were ever committed.',
    fixPrompt: 'Block access to the .git directory at your web server or CDN level:\n\nVercel: add to vercel.json:\n  { "headers": [{ "source": "/.git/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] }] }\n  Better: ensure your deployment only serves the build output, not the source directory.\n\nNginx:\n  location ~ /\\.git { deny all; return 404; }\n\nApache: add to .htaccess:\n  RedirectMatch 404 /\\.git',
  },

  'exposed-source-map': {
    id: 'exposed-source-map',
    category: 'security',
    severity: 'medium',
    title: 'JavaScript source map publicly accessible',
    description: 'A .map file referenced in a script sourceMappingURL comment is publicly accessible.',
    plainEnglish: 'Your JavaScript source maps are publicly downloadable. This exposes your original source code, file structure, and potentially internal logic to anyone who looks.',
    fixPrompt: 'Disable source map generation in production builds:\n\nNext.js (next.config.js):\n  productionBrowserSourceMaps: false\n\nVite (vite.config.ts):\n  build: { sourcemap: false }\n\nAlternatively, restrict .map file access at CDN level (Vercel, Cloudflare) to only your monitoring IP range.',
  },

  'graphql-introspection-open': {
    id: 'graphql-introspection-open',
    category: 'security',
    severity: 'high',
    title: 'GraphQL introspection is enabled in production',
    description: 'A GraphQL introspection query returned the full schema.',
    plainEnglish: 'Your GraphQL API exposes its full schema publicly. Attackers can enumerate every query, mutation, and type to plan attacks without any prior knowledge of your system.',
    fixPrompt: 'Disable GraphQL introspection in production:\n\nApollo Server:\n  new ApolloServer({ introspection: process.env.NODE_ENV !== "production" })\n\nGraphQL Yoga:\n  createServer({ graphiql: false, maskedErrors: true })\n\nAlso disable the GraphiQL playground UI in production. Consider adding depth limiting and query complexity analysis.',
  },

  // ─────────────────────────────────────────
  // MOBILE (6)
  // ─────────────────────────────────────────

  'missing-viewport': {
    id: 'missing-viewport',
    category: 'mobile',
    severity: 'critical',
    title: 'Viewport meta tag missing',
    description: 'No <meta name="viewport"> tag found.',
    plainEnglish:
      'Your site has no mobile viewport configuration. On phones, it will render as a tiny desktop page that visitors have to zoom into to read anything — a guaranteed high bounce rate.',
    fixPrompt: `Add viewport meta tag in my Next.js app:
Next.js App Router sets the viewport automatically via the metadata API.
In app/layout.tsx:
export const metadata: Metadata = {
  // viewport is included by default in Next.js 13+
}
// Or if you need custom viewport settings:
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}
// Import: import type { Viewport } from 'next'`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag',
  },

  'blocking-viewport': {
    id: 'blocking-viewport',
    category: 'mobile',
    severity: 'high',
    title: 'Viewport blocks user scaling',
    description: 'Viewport meta tag contains user-scalable=no, preventing zoom.',
    plainEnglish:
      'Your site prevents users from zooming in on mobile. This is a serious accessibility issue — many people with visual impairments rely on zoom. Apple and Google also penalise this in their quality guidelines.',
    fixPrompt: `Remove user-scalable=no from viewport in my Next.js app:
In app/layout.tsx, update the viewport export:
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Remove: maximumScale: 1, userScalable: false
}
If set via <meta> tag directly, change:
content="width=device-width, initial-scale=1, user-scalable=no"
to:
content="width=device-width, initial-scale=1"`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag',
  },

  'missing-favicon': {
    id: 'missing-favicon',
    category: 'mobile',
    severity: 'low',
    title: 'Favicon is missing',
    description: 'No favicon link tag found in the page.',
    plainEnglish:
      'Your site has no favicon — the small icon that appears in browser tabs and bookmarks. It makes your site look unfinished and makes it harder for users to find your tab when they have many tabs open.',
    fixPrompt: `Add favicon in my Next.js app:
1. Create a favicon.ico or favicon.png (32×32px or 64×64px)
2. Place it in the app/ directory (Next.js 13+ App Router):
   app/favicon.ico  ← automatic, no code needed
3. Or use metadata:
   export const metadata: Metadata = {
     icons: {
       icon: '/favicon.ico',
       shortcut: '/favicon-16x16.png',
       apple: '/apple-touch-icon.png',
     },
   }
4. Generate all sizes from your logo using realfavicongenerator.net`,
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons',
  },

  'missing-web-manifest': {
    id: 'missing-web-manifest',
    category: 'mobile',
    severity: 'low',
    confidence: 'likely',
    scoreEligible: false,
    title: 'No web app manifest found',
    description: 'No <link rel="manifest"> found in head and /manifest.json returned non-200.',
    plainEnglish: 'Your site has no web app manifest. Without it, users who add your site to their home screen on Android get a generic browser icon and no app-like experience. It also helps Chrome show the "Add to Home Screen" prompt.',
    fixPrompt: 'In Next.js App Router, create app/manifest.ts: export default function manifest() { return { name: "Your App", short_name: "App", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#000000", icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }] } }. Next.js will serve this at /manifest.webmanifest automatically.',
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest',
  },

  'phone-numbers-not-linked': {
    id: 'phone-numbers-not-linked',
    category: 'mobile',
    severity: 'low',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'Phone numbers not linked for tap-to-call',
    description: 'Phone number patterns detected in body text without adjacent tel: links.',
    plainEnglish: 'Phone numbers on your page are plain text — mobile users cannot tap to call. Wrapping them in <a href="tel:+1234567890"> lets users call directly from the page, which significantly increases conversion on mobile.',
    fixPrompt: 'Wrap all phone numbers in tel: links. In React/Next.js: <a href="tel:+1234567890" className="...">(123) 456-7890</a>. Search your components for phone number patterns and replace with linked versions. Include the country code (+1 for US) in the href for international compatibility.',
  },

  // ─────────────────────────────────────────
  // LINKS (1)
  // ─────────────────────────────────────────

  'broken-links': {
    id: 'broken-links',
    category: 'seo',
    severity: 'high',
    title: 'Broken links found',
    description: 'One or more internal links return 404 or 5xx status.',
    plainEnglish:
      "Some links on your site lead to pages that don't exist. Visitors click them and hit a dead end, which damages trust. Google also crawls these links — broken ones hurt your SEO.",
    fixPrompt: `Fix broken links in my Next.js app:
1. Find all broken links — the scan value shows how many were found
2. Search for the broken URLs in your codebase:
   grep -r "href=" app/ components/ --include="*.tsx" | grep -v "node_modules"
3. Fix or remove links that point to non-existent pages
4. For permanently moved pages, add a redirect in next.config.ts:
   async redirects() {
     return [{ source: '/old-page', destination: '/new-page', permanent: true }]
   }
5. Add a custom 404 page at app/not-found.tsx to handle any remaining broken links gracefully`,
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/not-found',
  },

  // ─────────────────────────────────────────
  // ACCESSIBILITY (6)
  // ─────────────────────────────────────────

  'low-a11y-score': {
    id: 'low-a11y-score',
    category: 'accessibility',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Low Lighthouse accessibility score',
    description: 'Lighthouse accessibility score is below 70.',
    plainEnglish: 'Your site scores poorly on automated accessibility tests. This means real users — people using screen readers, keyboard navigation, or who need high contrast — likely struggle to use your site.',
    fixPrompt: 'Run: npx lighthouse <url> --only-categories=accessibility --output=html\nFix every "Failing" item. Common fixes: add alt text to images, add aria-label to icon buttons, ensure colour contrast ≥4.5:1, add <label> to form inputs, ensure headings are sequential.',
    docsUrl: 'https://web.dev/accessibility/',
  },

  'images-missing-alt-a11y': {
    id: 'images-missing-alt-a11y',
    category: 'accessibility',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Images missing alt text (accessibility)',
    description: 'One or more images have no alt attribute — screen readers cannot describe them.',
    plainEnglish: 'Some images have no alt attribute at all. Screen readers will say "image" with no context, or skip the image entirely. This is an unambiguous accessibility failure.',
    fixPrompt: 'Add alt attributes to all img elements. In Next.js every <Image> requires an alt prop. Use descriptive text for content images (alt="Product screenshot showing dashboard"), empty string for decorative images that also have role="presentation" (alt="" role="presentation").',
    docsUrl: 'https://www.w3.org/WAI/tutorials/images/decision-tree/',
  },

  'form-inputs-no-label': {
    id: 'form-inputs-no-label',
    category: 'accessibility',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Form inputs missing labels',
    description: 'One or more visible form inputs have no associated label, aria-label, or aria-labelledby.',
    plainEnglish: 'Some form fields have no label. Screen reader users cannot tell what the field is for. Placeholder text is not a substitute — it disappears when you start typing.',
    fixPrompt: 'Add a <label htmlFor="inputId"> paired with an <input id="inputId">, or add aria-label="Field purpose" to each input. In Next.js/React: <label htmlFor="email">Email address</label><input id="email" type="email" />. Never use placeholder as the only label.',
    docsUrl: 'https://www.w3.org/WAI/tutorials/forms/labels/',
  },

  'buttons-no-label': {
    id: 'buttons-no-label',
    category: 'accessibility',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Buttons without accessible label',
    description: 'One or more buttons have no visible text and no aria-label or aria-labelledby.',
    plainEnglish: 'Some buttons (icon buttons, hamburger menus, close buttons) have no accessible name. Screen readers will say "button" with no context — users cannot tell what clicking the button does.',
    fixPrompt: 'Add aria-label to icon buttons: <button aria-label="Close menu"><XIcon /></button>. Or wrap icon and hidden text: <button><XIcon aria-hidden="true" /><span className="sr-only">Close menu</span></button>. The sr-only class: position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0).',
    docsUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
  },

  'missing-lang-attribute': {
    id: 'missing-lang-attribute',
    category: 'accessibility',
    severity: 'medium',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Missing lang attribute on html element',
    description: 'The <html> element is missing a lang attribute — screen readers cannot select the correct language profile.',
    plainEnglish: 'Your page has no language declaration. Screen readers need this to choose the right pronunciation engine. Without it, content may be read in the wrong language, making it incomprehensible for visually impaired users.',
    fixPrompt: 'In Next.js App Router, set lang in app/layout.tsx: <html lang="en">. For multi-language sites, set the correct language code per locale. Use ISO 639-1 codes: en, de, fr, ru, etc.',
    docsUrl: 'https://www.w3.org/International/questions/qa-html-language-declarations',
  },

  'missing-skip-navigation': {
    id: 'missing-skip-navigation',
    category: 'accessibility',
    severity: 'low',
    confidence: 'heuristic',
    scoreEligible: false,
    title: 'No skip navigation link',
    description: 'No skip-to-main-content link found before the first navigation block.',
    plainEnglish: 'Keyboard and screen reader users have to tab through every navigation item on every page to reach the main content. A "skip to content" link at the top of the page lets them jump directly to the main area.',
    fixPrompt: 'Add a skip link as the very first element in <body>: <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2">Skip to content</a>. Then add id="main-content" to your <main> element.',
    docsUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/general/G1',
  },

  // ─────────────────────────────────────────
  // GEO / AEO (5)
  // ─────────────────────────────────────────

  'geo-missing-org-sameas': {
    id: 'geo-missing-org-sameas',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'Organization schema missing sameAs links',
    description: 'Organization JSON-LD is present but has no sameAs field linking to external profiles.',
    plainEnglish:
      'ChatGPT, Claude, and Perplexity use sameAs links to connect your website to your brand as a known entity. Without them, AI systems may not reliably attribute your content to your brand when answering questions — reducing how often your site gets cited.',
    fixPrompt: `Add sameAs to your Organization schema in app/layout.tsx.
sameAs is an array of authoritative URLs where your brand appears.

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Your Brand Name',
  url: 'https://yoursite.com',
  logo: 'https://yoursite.com/logo.svg',
  sameAs: [
    'https://twitter.com/yourhandle',
    'https://www.linkedin.com/company/yourcompany',
    'https://github.com/yourorg',
    // Add any profile on a known platform
  ],
}

This helps ChatGPT, Claude, and Perplexity connect your site
to your brand entity in their knowledge graphs.`,
    docsUrl: 'https://schema.org/sameAs',
  },

  'geo-missing-date-signal': {
    id: 'geo-missing-date-signal',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'No content date signal found',
    description:
      'The page has no datePublished, dateModified, article:published_time meta tag, or <time datetime> element.',
    plainEnglish:
      'Perplexity and Google AI Overview weight fresh content significantly higher. Without a date signal, your page may be treated as potentially outdated — reducing how often AI systems cite it in answers.',
    fixPrompt: `Add a date signal to your page. Choose the option that fits your content type:

Option 1 — Article schema (best for blog posts and content pages):
Add to your page's <head>:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "datePublished": "2026-05-09",
  "dateModified": "2026-05-09"
}
</script>

Option 2 — Open Graph meta (works for any page):
<meta property="article:modified_time" content="2026-05-09T00:00:00Z" />

Option 3 — Visible time element (best when date is shown to users):
<time dateTime="2026-05-09">Last updated: May 9, 2026</time>

In Next.js, add to generateMetadata() or the page's layout.`,
    docsUrl: 'https://schema.org/datePublished',
  },

  'geo-no-question-headings': {
    id: 'geo-no-question-headings',
    category: 'ai_visibility',
    severity: 'low',
    title: 'No question-format headings found',
    description:
      'None of the H2 or H3 headings start with a question word (What, How, Why, When, Who, Which, Can, Is, Are, Does, Do) or end with "?".',
    plainEnglish:
      'ChatGPT, Claude, and Perplexity extract headings as Q&A pairs and include them in answers with a link to your page. Pages with question-format headings are cited more often in AI responses.',
    fixPrompt: `Restructure at least 2-3 of your H2 or H3 headings as questions.

Examples (adapt to your content):
<h2>How does [your product] work?</h2>
<h2>What makes [your service] different?</h2>
<h3>Can I use [feature] for free?</h3>
<h3>Who is [product] designed for?</h3>
<h3>What does [product] check?</h3>

AI search engines extract these as Q&A pairs and reference them
when answering related user questions — attributing the answer to your page.`,
    docsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
  },

  'geo-answer-first-paragraph': {
    id: 'geo-answer-first-paragraph',
    category: 'ai_visibility',
    severity: 'low',
    title: 'First paragraph too short for AI citation',
    description:
      'The first meaningful paragraph has fewer than 50 words — below the range AI systems extract as citation passages.',
    plainEnglish:
      'AI systems like ChatGPT, Claude, and Perplexity extract the beginning of your page as citation passages. A short or absent opening paragraph means they have little useful content to cite, reducing how often your page appears in AI answers.',
    fixPrompt: `Expand the first paragraph of your page content to 50-170 words.

Answer-first principle: the opening paragraph should directly answer
the main question your page addresses — what it is, who it is for, why it matters.

Structure to aim for:
"[Product/service] is [clear description] that helps [target audience]
[achieve main benefit]. Unlike [alternatives], [your key differentiator].
[Specific capability] in [timeframe/context]."

Optimal length for AI citation passage: 130-170 words.
(Based on Princeton University GEO research, 2024: arxiv.org/abs/2311.09735)`,
    docsUrl: 'https://arxiv.org/abs/2311.09735',
  },

  // ─────────────────────────────────────────
  // SEO additions (1)
  // ─────────────────────────────────────────

  'seo-og-image-dimensions': {
    id: 'seo-og-image-dimensions',
    category: 'seo',
    severity: 'medium',
    title: 'OG image missing width and height',
    description: 'og:image is set but og:image:width and og:image:height are absent.',
    plainEnglish:
      'Twitter/X, LinkedIn, Telegram, and Discord need the image dimensions declared in your HTML to display the preview correctly. Without them, the preview may be skipped entirely or shown at the wrong size — reducing click-through rate when your link is shared.',
    fixPrompt: `Add og:image:width and og:image:height to your Open Graph metadata.

In Next.js app/layout.tsx or any page's generateMetadata():

export const metadata = {
  openGraph: {
    images: [{
      url: '/og-image.png',   // use absolute URL in production
      width: 1200,
      height: 630,
      alt: 'Descriptive text for the image',
    }],
  },
}

Standard OG image: 1200×630px (1.91:1 ratio).
Twitter summary_large_image also works best at 1200×628px.`,
    docsUrl: 'https://ogp.me/#structured',
  },

  'spa-no-ssr': {
    id: 'spa-no-ssr',
    category: 'seo',
    severity: 'high',
    title: 'Site appears to be a client-side SPA without server-side rendering',
    description: 'Page HTML contains almost no visible content — likely a React/Vue SPA that renders in the browser.',
    plainEnglish: "Google and AI crawlers see an empty page. They fetch your HTML but JavaScript hasn't run yet, so they see no content. This means you're invisible to search engines and AI assistants.",
    fixPrompt: 'Add server-side rendering (SSR) or static site generation (SSG). In Next.js use App Router with Server Components. If using Vite/React, consider switching to Next.js or adding a pre-rendering solution like vite-plugin-ssr.',
  },

  'missing-analytics': {
    id: 'missing-analytics',
    category: 'seo',
    severity: 'medium',
    title: 'No analytics tracking detected',
    description: 'No Google Analytics 4, Google Tag Manager, or Яндекс Метрика found on the page.',
    plainEnglish: "You can't improve what you don't measure. Without analytics you have no visibility into traffic, user behavior, or conversion goals.",
    fixPrompt: "Install Google Analytics 4 via Google Tag Manager (recommended). Steps:\n1. Create a GA4 property at analytics.google.com\n2. Create a GTM container at tagmanager.google.com\n3. Add GTM snippet to your <head> and <body>\n4. Configure GA4 tag inside GTM\n5. Set up conversion goals (form submits, button clicks)\nFor Яндекс: go to metrika.yandex.ru, create a counter, add the snippet.",
  },

  'keywords-not-in-title': {
    id: 'keywords-not-in-title',
    category: 'seo',
    severity: 'high',
    title: 'Primary topic not found in title or H1',
    description: "The page title and H1 heading don't clearly reflect what the site is about based on its description.",
    plainEnglish: "Your title tag and H1 are the strongest signals Google uses to understand what your page is about. If your main topic isn't there, you won't rank for it.",
    fixPrompt: 'Include your primary keyword in both the <title> tag and the <h1> heading. Title format: "Primary Keyword — Brand Name". H1 should match or closely echo the title. Avoid generic headings like "Welcome" or "Home".',
  },

  'redirect-chain': {
    id: 'redirect-chain',
    category: 'seo',
    severity: 'medium',
    title: 'Redirect chain detected',
    description: 'The URL goes through multiple redirects before reaching the final destination.',
    plainEnglish: 'Your URL redirects through 2+ hops before arriving at the page. This wastes crawl budget, passes less PageRank, and slows load time.',
    fixPrompt: 'Update all internal links to point directly to the final URL. If using a CDN or proxy, configure it to serve a single 301 to the canonical URL.',
  },

  'small-tap-targets': {
    id: 'small-tap-targets',
    category: 'mobile',
    severity: 'medium',
    title: 'Tap targets are too small',
    description: 'Some clickable elements are smaller than the 48×48px recommended by Google.',
    plainEnglish: 'Some buttons or links are too small to tap accurately on a phone. This frustrates mobile users and hurts your Google mobile score.',
    fixPrompt: 'Ensure all interactive elements (buttons, links) have a minimum size of 48×48px. In Tailwind: add min-h-12 min-w-12 to small buttons. Use padding instead of fixed height where possible.',
  },

  'mobile-font-too-small': {
    id: 'mobile-font-too-small',
    category: 'mobile',
    severity: 'medium',
    title: 'Font size too small on mobile',
    description: 'Text is smaller than 16px on mobile, causing readability issues.',
    plainEnglish: 'Some text is too small to read comfortably on mobile devices. Google flags this in mobile usability reports.',
    fixPrompt: 'Set base font size to at least 16px. In Tailwind: ensure body uses text-base (16px) or larger. Avoid text-xs (12px) for body copy.',
  },

  // ─────────────────────────────────────────
  // AI VISIBILITY — Per-bot crawler checks (Phase 1)
  // ─────────────────────────────────────────

  'oai-searchbot-blocked': {
    id: 'oai-searchbot-blocked',
    category: 'ai_visibility',
    severity: 'high',
    title: 'OAI-SearchBot is blocked in robots.txt',
    description: 'OAI-SearchBot (ChatGPT web search crawler) is disallowed in robots.txt.',
    plainEnglish: "ChatGPT's search crawler cannot index your site. When users ask ChatGPT questions, your site will not appear in answers even if it's relevant.",
    fixPrompt: 'In your robots.txt, add an explicit Allow for OAI-SearchBot:\n  User-agent: OAI-SearchBot\n  Allow: /\nNote: OAI-SearchBot is the search crawler (for ChatGPT answers). GPTBot is the training crawler. You can block GPTBot while allowing OAI-SearchBot if you want.',
    docsUrl: 'https://platform.openai.com/docs/bots/overview',
  },

  'gptbot-blocked': {
    id: 'gptbot-blocked',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'GPTBot is blocked in robots.txt',
    description: 'GPTBot (ChatGPT training crawler) is disallowed in robots.txt.',
    plainEnglish: "GPTBot trains ChatGPT's knowledge. Blocking it means your content won't be included in future ChatGPT model training. This may or may not be intentional.",
    fixPrompt: 'If you want your content in future ChatGPT models, remove the GPTBot disallow:\n  # Remove this:\n  User-agent: GPTBot\n  Disallow: /\n\nIf you intentionally blocked training (but want search), keep GPTBot blocked and only allow OAI-SearchBot.',
  },

  'claudebot-blocked': {
    id: 'claudebot-blocked',
    category: 'ai_visibility',
    severity: 'high',
    title: 'ClaudeBot is blocked in robots.txt',
    description: 'ClaudeBot or anthropic-ai user-agent is disallowed in robots.txt.',
    plainEnglish: "Anthropic's crawler cannot read your site. Claude will not be able to cite your content in answers.",
    fixPrompt: 'In your robots.txt, allow ClaudeBot:\n  User-agent: ClaudeBot\n  Allow: /\n  User-agent: anthropic-ai\n  Allow: /',
    docsUrl: 'https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-the-web-and-how-can-site-owners-block-the-crawler',
  },

  'perplexitybot-blocked': {
    id: 'perplexitybot-blocked',
    category: 'ai_visibility',
    severity: 'high',
    title: 'PerplexityBot is blocked in robots.txt',
    description: 'PerplexityBot is disallowed in robots.txt.',
    plainEnglish: "Perplexity AI's crawler cannot read your site. You won't appear in Perplexity search answers.",
    fixPrompt: 'In your robots.txt, allow PerplexityBot:\n  User-agent: PerplexityBot\n  Allow: /',
  },

  'deepseekbot-blocked': {
    id: 'deepseekbot-blocked',
    category: 'ai_visibility',
    severity: 'low',
    title: 'DeepSeekBot is blocked in robots.txt',
    description: 'DeepSeekBot user-agent is disallowed in robots.txt.',
    plainEnglish: "DeepSeek's crawler is blocked. DeepSeek is an emerging AI assistant with a growing user base.",
    fixPrompt: 'If you want your content visible in DeepSeek answers:\n  User-agent: DeepSeekBot\n  Allow: /',
  },

  // ─────────────────────────────────────────
  // AI VISIBILITY — llms.txt validation (Phase 1)
  // ─────────────────────────────────────────

  'llms-txt-no-description': {
    id: 'llms-txt-no-description',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'llms.txt has no product description',
    description: 'llms.txt file exists but contains no product description (> blockquote or description text).',
    plainEnglish: "Your llms.txt exists but doesn't explain what your product is. AI systems use the description to understand your site context.",
    fixPrompt: 'Add a description to your llms.txt using blockquote format (as per llmstxt.org spec):\n\n  # Your Product Name\n\n  > One-sentence description of what your product does and who it\'s for.\n\n  ## Key Pages\n  - /: Homepage\n  - /pricing: Pricing',
    docsUrl: 'https://llmstxt.org',
  },

  'llms-txt-no-sections': {
    id: 'llms-txt-no-sections',
    category: 'ai_visibility',
    severity: 'low',
    title: 'llms.txt has no structured sections',
    description: 'llms.txt exists but has no ## section headings.',
    plainEnglish: 'Your llms.txt is present but lacks structured sections. The llmstxt.org spec recommends ## sections to help AI systems navigate your content.',
    fixPrompt: 'Add ## sections to your llms.txt:\n\n  # Product Name\n  > Description\n\n  ## Key Pages\n  - /: Homepage description\n  - /docs: Documentation\n\n  ## About\n  Brief about the product.',
  },

  'llms-txt-broken-links': {
    id: 'llms-txt-broken-links',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'llms.txt references broken links',
    description: 'One or more URLs listed in llms.txt returned a non-200 status.',
    plainEnglish: "Your llms.txt lists pages that don't load. AI systems following these links will hit dead ends.",
    fixPrompt: 'Audit your llms.txt and remove or fix any broken URLs. Run: curl -I <url> for each listed URL to verify.',
  },

  // ─────────────────────────────────────────
  // SEO — Sitemap + Robots quality (Phase 2)
  // ─────────────────────────────────────────

  'sitemap-empty': {
    id: 'sitemap-empty',
    category: 'seo',
    severity: 'high',
    title: 'sitemap.xml exists but contains no URLs',
    description: 'A sitemap.xml was found but it has no <url> or <sitemap> entries.',
    plainEnglish: 'Your sitemap.xml is empty. Search engines and AI crawlers use sitemaps to discover pages — an empty sitemap provides no benefit.',
    fixPrompt: 'Regenerate your sitemap.xml to include all public pages:\n\nNext.js App Router: create app/sitemap.ts:\n  import type { MetadataRoute } from "next"\n  export default function sitemap(): MetadataRoute.Sitemap {\n    return [\n      { url: "https://yourdomain.com", lastModified: new Date() },\n      { url: "https://yourdomain.com/pricing", lastModified: new Date() },\n    ]\n  }',
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap',
  },

  'sitemap-lastmod-stale': {
    id: 'sitemap-lastmod-stale',
    category: 'seo',
    severity: 'low',
    title: 'Sitemap lastmod dates are stale',
    description: 'All lastmod dates in sitemap.xml are more than 6 months old.',
    plainEnglish: "Your sitemap's last-modified dates are old. Search engines use these to decide how often to recrawl — stale dates suggest the site isn't updated.",
    fixPrompt: 'Update lastmod to reflect actual last-modified dates in your sitemap. In Next.js sitemap.ts, set lastModified dynamically from your content system or use new Date() for actively maintained pages.',
  },

  'robots-no-sitemap-directive': {
    id: 'robots-no-sitemap-directive',
    category: 'seo',
    severity: 'medium',
    title: 'robots.txt has no Sitemap directive',
    description: 'robots.txt does not include a Sitemap: line pointing to sitemap.xml.',
    plainEnglish: 'Adding a Sitemap: directive to robots.txt helps all crawlers discover your sitemap immediately, without needing to guess or find it through other means.',
    fixPrompt: 'Add a Sitemap directive to your robots.txt:\n  Sitemap: https://yourdomain.com/sitemap.xml\n\nIn Next.js, you can create app/robots.ts:\n  export default function robots() {\n    return {\n      rules: { userAgent: "*", allow: "/" },\n      sitemap: "https://yourdomain.com/sitemap.xml",\n    }\n  }',
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots',
  },

  'robots-disallow-all': {
    id: 'robots-disallow-all',
    category: 'seo',
    severity: 'high',
    title: 'robots.txt blocks all crawlers from the entire site',
    description: 'robots.txt contains Disallow: / for * or Googlebot, blocking the whole site.',
    plainEnglish: 'Your robots.txt is telling Google and all crawlers not to index any page. This is often set accidentally during development and forgotten. Your entire site is invisible to search engines.',
    fixPrompt: 'Update robots.txt to allow crawling:\n  User-agent: *\n  Allow: /\n  Sitemap: https://yourdomain.com/sitemap.xml\n\nIn Next.js app/robots.ts:\n  export default function robots() {\n    return { rules: { userAgent: "*", allow: "/" }, sitemap: "https://yourdomain.com/sitemap.xml" }\n  }',
  },

  // ─────────────────────────────────────────
  // AI VISIBILITY — Semantic HTML + Schema (Phase 2)
  // ─────────────────────────────────────────

  'no-semantic-html': {
    id: 'no-semantic-html',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'No semantic HTML landmarks found',
    description: 'No <main>, <article>, or <section> tags found in the page body.',
    plainEnglish: 'AI agents and screen readers navigate pages using semantic HTML landmarks. Without them, your content structure is invisible to machines.',
    fixPrompt: 'Wrap your main content in semantic HTML elements:\n  <main> — primary content area (one per page)\n  <article> — self-contained content (blog posts, product descriptions)\n  <section> — thematic groupings with a heading\n  <nav> — navigation links\n  <aside> — secondary content\n\nIn React/Next.js, replace generic <div> containers with the appropriate semantic element.',
    docsUrl: 'https://web.dev/articles/ai-agent-site-ux',
  },

  'content-js-only': {
    id: 'content-js-only',
    category: 'ai_visibility',
    severity: 'high',
    title: 'Page has very little readable content in raw HTML',
    description: 'Fewer than 100 readable words found in the HTML before JavaScript runs.',
    plainEnglish: "AI crawlers and search engines fetch raw HTML before running JavaScript. If your page has little visible text in the HTML, they see an almost-empty page.",
    fixPrompt: "Ensure key content is server-side rendered (SSR) or statically generated:\n\nNext.js: Use Server Components (default in App Router) or generateStaticParams.\nReact SPA: Migrate to Next.js or add a pre-rendering solution.\nVerify: View Page Source — if you see your main headline and description there, you're good.",
  },

  'schema-missing-required-fields': {
    id: 'schema-missing-required-fields',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'Schema.org markup is missing required fields',
    description: 'A Schema.org type was detected but required fields for that type are missing.',
    plainEnglish: 'Your structured data has the right type but is incomplete. Google and AI systems may ignore incomplete schema.',
    fixPrompt: 'Check which fields are required for your schema type at schema.org and add them. Common required fields:\n  Organization: name, url\n  Product: name, offers\n  Article: headline, author, datePublished\n  FAQPage: mainEntity (array of Questions with acceptedAnswer)',
    docsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
  },

  // ─────────────────────────────────────────
  // SECURITY — TLS (Phase 3, SSL Labs)
  // ─────────────────────────────────────────

  'tls-old-protocol': {
    id: 'tls-old-protocol',
    category: 'security',
    severity: 'high',
    title: 'Old TLS protocol version supported (TLS 1.0 or 1.1)',
    description: 'The server accepts TLS 1.0 or TLS 1.1, which are deprecated and insecure.',
    plainEnglish: 'Your server still supports old encryption protocols from the early 2000s. These are known to have weaknesses. Modern browsers and security standards require TLS 1.2 or higher.',
    fixPrompt: 'Disable TLS 1.0 and 1.1 on your server. Most modern hosting handles this automatically:\n\nVercel: TLS 1.2+ is enforced by default — no action needed.\nCloudflare: Dashboard → SSL/TLS → Edge Certificates → Minimum TLS Version → set to TLS 1.2\nNginx: ssl_protocols TLSv1.2 TLSv1.3;\nApache: SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1',
  },

  'tls-weak-cipher': {
    id: 'tls-weak-cipher',
    category: 'security',
    severity: 'high',
    title: 'Weak TLS cipher suite detected',
    description: 'The server supports weak cipher suites (RC4, DES, NULL, EXPORT, or anonymous).',
    plainEnglish: "Your server uses outdated encryption methods that can be broken by attackers. This puts your users' data at risk.",
    fixPrompt: 'Disable weak cipher suites:\n\nNginx:\n  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;\n  ssl_prefer_server_ciphers off;\n\nApache:\n  SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256\n\nUse the Mozilla SSL Configuration Generator for your specific server.',
    docsUrl: 'https://ssl-config.mozilla.org/',
  },

  'tls-grade-low': {
    id: 'tls-grade-low',
    category: 'security',
    severity: 'medium',
    title: 'SSL Labs grade below A',
    description: 'SSL Labs assessed the TLS configuration and gave a grade below A.',
    plainEnglish: "Your HTTPS configuration scored below A on SSL Labs' independent assessment. This means there are TLS configuration improvements to make.",
    fixPrompt: "Run a full assessment at ssllabs.com/ssltest/ to see the detailed breakdown. Common fixes to reach A+:\n1. Enable HSTS (Strict-Transport-Security header)\n2. Disable TLS 1.0/1.1\n3. Use ECDHE key exchange\n4. Enable OCSP stapling",
    docsUrl: 'https://www.ssllabs.com/ssltest/',
  },

  // ─────────────────────────────────────────
  // SECURITY — CVE (Phase 3, OSV)
  // ─────────────────────────────────────────

  'vulnerable-js-lib': {
    id: 'vulnerable-js-lib',
    category: 'security',
    severity: 'high',
    title: 'JavaScript library with known CVE detected',
    description: 'A JavaScript library version was detected that has known security vulnerabilities in the OSV database.',
    plainEnglish: 'One of your JavaScript libraries has publicly known security vulnerabilities. Attackers actively scan for sites using these outdated versions.',
    fixPrompt: 'Update the affected library to the latest patched version:\n1. Check the CVE IDs listed in this report at https://osv.dev\n2. Update via npm: npm update <package-name>\n3. For CDN-loaded libraries, update the version number in your HTML\n4. Run npm audit after updating to confirm no remaining vulnerabilities',
    docsUrl: 'https://osv.dev',
  },

  // ─────────────────────────────────────────
  // PERFORMANCE — CrUX field data (Phase 3)
  // ─────────────────────────────────────────

  'crux-lcp-poor': {
    id: 'crux-lcp-poor',
    category: 'performance',
    severity: 'high',
    title: 'Real-user LCP is poor (CrUX field data)',
    description: "Google's Chrome User Experience Report shows real users experience LCP above 4000ms.",
    plainEnglish: 'Real visitors to your site experience the main content loading in more than 4 seconds. This is based on actual Chrome browser data from real users, not a lab test.',
    fixPrompt: 'This is real-user data showing slow load. Focus on: server response time, render-blocking resources, large images without priority loading. See the LCP guidance and also check the Lighthouse audit above for specific elements.',
    docsUrl: 'https://web.dev/articles/lcp',
  },

  'crux-cls-poor': {
    id: 'crux-cls-poor',
    category: 'performance',
    severity: 'medium',
    title: 'Real-user CLS is poor (CrUX field data)',
    description: "Google's Chrome User Experience Report shows real users experience CLS above 0.25.",
    plainEnglish: 'Real visitors see your page jumping around while it loads. This is measured from actual Chrome user data.',
    fixPrompt: 'Reserve space for images, ads, and dynamic content. Set explicit width and height on images. Avoid inserting content above existing elements after load.',
    docsUrl: 'https://web.dev/articles/cls',
  },

  'crux-inp-poor': {
    id: 'crux-inp-poor',
    category: 'performance',
    severity: 'medium',
    title: 'Real-user INP is poor (CrUX field data)',
    description: 'Chrome User Experience Report shows real users experience INP above 500ms.',
    plainEnglish: 'Real visitors find your page slow to respond to clicks and interactions. This is from actual user data.',
    fixPrompt: "Reduce JavaScript execution time. Break up long tasks. Defer non-critical scripts. Use React's useTransition for expensive state updates.",
    docsUrl: 'https://web.dev/articles/inp',
  },

  // ─────────────────────────────────────────
  // TRUST SIGNALS (phases 57–59)
  // ─────────────────────────────────────────

  'young-domain': {
    id: 'young-domain',
    category: 'ai_visibility',
    severity: 'low',
    title: 'New domain — limited AI trust signals',
    description: 'Domain registered less than 6 months ago.',
    plainEnglish: 'AI assistants and search engines build trust in sites over time. New domains have fewer authority signals, so it takes longer for AI to cite them. This is expected and resolves naturally as you build content, backlinks, and mentions.',
    fixPrompt: 'Accelerate trust-building: register on G2/Capterra/Product Hunt, get mentioned on Reddit and Hacker News, add Organization schema with sameAs links, and build backlinks from known sites.',
    scoreEligible: false,
  },

  'no-reddit-presence': {
    id: 'no-reddit-presence',
    category: 'ai_visibility',
    severity: 'low',
    title: 'No Reddit mentions found',
    description: 'No Reddit posts or discussions mentioning this domain were found.',
    plainEnglish: 'Reddit discussions are a major source AI assistants use when building answers. Sites mentioned in relevant subreddits are more likely to be cited by ChatGPT and Perplexity.',
    fixPrompt: 'Share your product in relevant subreddits (r/SaaS, r/indiehackers, r/webdev, etc.) by answering questions authentically and linking when relevant. Do not spam — contribute first.',
    scoreEligible: false,
  },

  'no-github-presence': {
    id: 'no-github-presence',
    category: 'ai_visibility',
    severity: 'low',
    title: 'No GitHub repositories found for this product',
    description: 'GitHub search found no public repos matching this domain or product name.',
    plainEnglish: 'Developer-facing products and SaaS tools with public GitHub repos get more AI citations. GitHub stars and README content are frequently crawled by AI training datasets.',
    fixPrompt: 'Create a public GitHub organization or repository for your product. Even a docs repo, example code, or issue tracker increases discoverability and trust for developer audiences.',
    scoreEligible: false,
  },

  'no-g2-listing': {
    id: 'no-g2-listing',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'Not listed on G2 or Capterra',
    description: 'No G2 or Capterra listing found for this product.',
    plainEnglish: "G2 and Capterra reviews are among the most-cited sources when AI assistants answer 'what is the best [software category]?' questions. Being absent means you're invisible in those comparisons.",
    fixPrompt: 'Create a free profile on G2 (g2.com/products/new) and Capterra (capterra.com/vendors/sign-up). Ask early users to leave a review. Even 3 reviews with detailed descriptions dramatically improve AI citation chance.',
    scoreEligible: false,
    docsUrl: 'https://www.g2.com/products/new',
  },

  'no-producthunt-listing': {
    id: 'no-producthunt-listing',
    category: 'ai_visibility',
    severity: 'low',
    title: 'Not found on Product Hunt',
    description: 'No Product Hunt listing found for this product.',
    plainEnglish: 'Product Hunt listings are frequently cited by AI when answering questions about new SaaS tools. A launch post also drives initial community trust signals.',
    fixPrompt: 'Submit your product to Product Hunt. Prepare a good tagline, screenshots, and a first comment from the maker. Time it for Tuesday–Thursday for maximum upvotes.',
    scoreEligible: false,
    docsUrl: 'https://www.producthunt.com/posts/new',
  },
}
