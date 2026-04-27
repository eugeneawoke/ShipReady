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
    cursorPrompt: `Fix slow LCP in my Next.js app:
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
    cursorPrompt: `Fix layout shifts in my Next.js app:
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
    cursorPrompt: `Fix slow INP in my Next.js app:
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
    cursorPrompt: `Fix slow FCP in my Next.js app:
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
    cursorPrompt: `Improve Lighthouse performance score in my Next.js app:
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
    cursorPrompt: `Improve accessibility in my Next.js app:
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
  // SEO / SOCIAL (11)
  // ─────────────────────────────────────────

  'missing-title': {
    id: 'missing-title',
    category: 'seo',
    severity: 'high',
    title: 'Page title is missing',
    description: 'No <title> tag found on the page.',
    plainEnglish:
      'Your page has no title. Browser tabs show a blank name, and Google has nothing to display in search results. This is one of the most basic SEO requirements.',
    cursorPrompt: `Add a page title in my Next.js app:
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
    cursorPrompt: `Fix title length in my Next.js app:
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
    cursorPrompt: `Add meta description in my Next.js app:
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
    cursorPrompt: `Fix H1 heading in my Next.js app:
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
    cursorPrompt: `Add canonical URL in my Next.js app:
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
    cursorPrompt: `Add og:title in my Next.js app:
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
    cursorPrompt: `Add og:description in my Next.js app:
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
    cursorPrompt: `Add og:image to my Next.js app:
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
    cursorPrompt: `Fix broken og:image in my Next.js app:
1. Check the current og:image URL in your metadata — open it in a browser tab
2. If using a relative path, ensure metadataBase is set in app/layout.tsx:
   metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!)
3. If using next/og (opengraph-image.tsx), test the route at /opengraph-image
4. Ensure the image file exists in the public/ directory
5. Check Vercel deployment logs for image-related 404s`,
    docsUrl: 'https://developers.facebook.com/tools/debug/',
  },

  'missing-twitter-card': {
    id: 'missing-twitter-card',
    category: 'seo',
    severity: 'low',
    title: 'Twitter/X card meta tag missing',
    description: 'No twitter:card meta tag found.',
    plainEnglish:
      'Without this tag, Twitter/X may not show a rich link preview when your URL is shared. Links without rich cards get significantly less engagement.',
    cursorPrompt: `Add Twitter card meta tags in my Next.js app:
In app/layout.tsx or the page file:
export const metadata: Metadata = {
  twitter: {
    card: 'summary_large_image',
    title: 'Your Page Title',
    description: 'Your description',
    images: ['/og-image.png'],
    // creator: '@yourhandle', // optional
  },
}`,
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
  },

  'placeholder-text': {
    id: 'placeholder-text',
    category: 'seo',
    severity: 'medium',
    title: 'Placeholder text found on page',
    description: 'Generic placeholder text like "lorem ipsum" or "your name here" found in page body.',
    plainEnglish:
      'Your page contains dummy text that was never replaced with real content. This looks unprofessional to visitors and can cause Google to rank your page as low-quality content.',
    cursorPrompt: `Find and replace placeholder text in my Next.js app:
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
    cursorPrompt: 'Update the meta description to be between 120–160 characters. In Next.js, update the `description` field in `generateMetadata()`. Aim for: keyword-rich first 120 characters, compelling CTA in the last 30.',
  },

  'missing-twitter-image': {
    id: 'missing-twitter-image',
    category: 'seo',
    severity: 'medium',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Twitter/X card declares summary_large_image but no twitter:image is set',
    description: 'twitter:card is summary_large_image but no twitter:image meta tag was found.',
    plainEnglish: 'Your page uses `twitter:card = summary_large_image` but provides no `twitter:image` URL. Twitter/X will show a blank card. Set the image or downgrade the card type.',
    cursorPrompt: 'In Next.js `generateMetadata()`, add `twitter: { card: "summary_large_image", images: ["/og.png"] }`. Create a 1200×630 PNG at `public/og.png` as the default OG image.',
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
    cursorPrompt: 'In Next.js, set `alternates: { canonical: process.env.NEXT_PUBLIC_APP_URL }` in `generateMetadata()`. Ensure `NEXT_PUBLIC_APP_URL` matches your actual production domain (no trailing slash).',
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
    cursorPrompt: 'Add at minimum an Organization or WebApplication schema in a `<script type="application/ld+json">` tag in your page `<head>`. In Next.js, inject it server-side in the root layout.',
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
    cursorPrompt: 'Add `operatingSystem: "Web"` to your WebApplication JSON-LD schema. In Next.js, update the schema object in `app/layout.tsx` that contains `"@type": "WebApplication"`.',
  },

  'sitemap-double-slash': {
    id: 'sitemap-double-slash',
    category: 'seo',
    severity: 'high',
    confidence: 'verified',
    scoreEligible: true,
    title: 'Sitemap URL in robots.txt has a double-slash',
    description: 'The Sitemap: line in robots.txt contains a malformed URL with a double-slash after the protocol.',
    plainEnglish: 'The Sitemap: line in your robots.txt contains a malformed URL with a double-slash (e.g. `//sitemap.xml`). Googlebot cannot process this URL, so your sitemap is effectively invisible.',
    cursorPrompt: 'The root cause is `NEXT_PUBLIC_APP_URL` ending with a trailing slash. Fix: (1) Remove the trailing slash from `NEXT_PUBLIC_APP_URL` in your Vercel environment variables, (2) Add `.replace(/\\/$/, "")` when using this env var to build URLs in `app/robots.ts` and `app/sitemap.ts`.',
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
    cursorPrompt: 'Expand llms.txt to at least 150 words. Include: a 1-paragraph product description, target audience, key features, a FAQ section (5+ Q&A pairs), and author/organization info. Save to `public/llms.txt`.',
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
    cursorPrompt: 'In `app/robots.ts`, add explicit Allow rules: `{ userAgent: "GPTBot", allow: "/" }`, `{ userAgent: "ClaudeBot", allow: "/" }`, `{ userAgent: "PerplexityBot", allow: "/" }`, `{ userAgent: "OAI-SearchBot", allow: "/" }`.',
  },

  // ─────────────────────────────────────────
  // SECURITY (11)
  // ─────────────────────────────────────────

  'no-https': {
    id: 'no-https',
    category: 'security',
    severity: 'critical',
    title: 'Site is not served over HTTPS',
    description: 'The URL uses HTTP, not HTTPS — traffic is unencrypted.',
    plainEnglish:
      'Your site is not encrypted. Anyone on the same network can read or modify data your visitors send you — including passwords and form submissions. Browsers also show a "Not Secure" warning, which kills trust instantly.',
    cursorPrompt: `Enable HTTPS for my Next.js app:
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
    cursorPrompt: `Add HSTS header in my Next.js app:
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
    cursorPrompt: `Add X-Frame-Options header in my Next.js app:
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
    cursorPrompt: `Add X-Content-Type-Options header in my Next.js app:
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
    cursorPrompt: `Add Referrer-Policy header in my Next.js app:
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
    cursorPrompt: `Add Content-Security-Policy in my Next.js app:
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
    cursorPrompt: `Remove unsafe-inline/unsafe-eval from CSP in my Next.js app:
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
    cursorPrompt: `Renew SSL certificate:
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
    cursorPrompt: `URGENT — do this now:
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
    cursorPrompt: `URGENT — remove exposed API key from HTML:
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
    cursorPrompt: `Fix mixed content in my Next.js app:
1. Find all HTTP resource URLs in your code:
   grep -r '"http://' --include="*.tsx" --include="*.ts" --include="*.css" app/ components/
2. Replace all http:// URLs with https:// equivalents
3. For external images, check if the domain supports HTTPS (most do)
4. In next.config.ts, add Content-Security-Policy with upgrade-insecure-requests:
   { key: 'Content-Security-Policy', value: "upgrade-insecure-requests;" }
5. Check third-party embed codes (maps, widgets) — update to their HTTPS versions`,
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content',
  },

  // ─────────────────────────────────────────
  // MOBILE (4)
  // ─────────────────────────────────────────

  'missing-viewport': {
    id: 'missing-viewport',
    category: 'mobile',
    severity: 'critical',
    title: 'Viewport meta tag missing',
    description: 'No <meta name="viewport"> tag found.',
    plainEnglish:
      'Your site has no mobile viewport configuration. On phones, it will render as a tiny desktop page that visitors have to zoom into to read anything — a guaranteed high bounce rate.',
    cursorPrompt: `Add viewport meta tag in my Next.js app:
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
    cursorPrompt: `Remove user-scalable=no from viewport in my Next.js app:
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
    cursorPrompt: `Add favicon in my Next.js app:
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

  'missing-touch-icon': {
    id: 'missing-touch-icon',
    category: 'mobile',
    severity: 'low',
    title: 'Apple touch icon missing',
    description: 'No <link rel="apple-touch-icon"> tag found.',
    plainEnglish:
      "When iPhone or iPad users save your site to their home screen, there's no proper icon — iOS will use a screenshot instead, which looks terrible. Adding this takes 5 minutes.",
    cursorPrompt: `Add Apple touch icon in my Next.js app:
1. Create a 180×180px PNG image (your logo on a solid background)
2. Save as public/apple-touch-icon.png
3. In app/layout.tsx metadata:
   export const metadata: Metadata = {
     icons: {
       apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
     },
   }
Or place the file at app/apple-icon.png — Next.js handles it automatically.`,
    docsUrl: 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html',
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
    cursorPrompt: `Fix broken links in my Next.js app:
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
}
