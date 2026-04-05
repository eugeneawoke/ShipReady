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
    boltPrompt: `Speed up your page's main content:
1. Add <link rel="preload"> for your hero image in <head>:
   <link rel="preload" as="image" href="/hero.webp">
2. Convert images to WebP format (use squoosh.app)
3. Add loading="eager" and fetchpriority="high" to your hero image
4. Remove or defer any scripts in <head> that aren't critical
5. Host fonts locally instead of loading from Google Fonts`,
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
    boltPrompt: `Stop your page from jumping around:
1. Add width and height attributes to every <img> tag:
   <img src="photo.jpg" width="800" height="600" alt="...">
2. Add CSS for images to prevent reflow:
   img { aspect-ratio: attr(width) / attr(height); }
3. If you load ads or embeds, wrap them in a fixed-height div
4. Avoid adding content at the top of the page after it loads (banners, cookie notices)`,
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
    boltPrompt: `Make your page respond faster to clicks:
1. Identify if you have large JavaScript files — split them or remove unused code
2. Debounce search/filter inputs (wait 300ms after typing stops)
3. Avoid doing heavy work on every click — cache results where possible
4. Check for synchronous fetch calls inside click handlers — make them async`,
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
    boltPrompt: `Show content to users faster:
1. Add preconnect hints in <head> for external resources:
   <link rel="preconnect" href="https://fonts.googleapis.com">
2. Move non-critical <script> tags to the bottom of <body>
3. Inline the CSS for your above-the-fold content in a <style> tag in <head>
4. Reduce the size of your HTML — remove unused HTML sections`,
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
    boltPrompt: `Improve your overall page speed:
1. Compress all images — use squoosh.app and convert to WebP
2. Minify your CSS and JS (most hosting platforms do this automatically)
3. Enable GZIP or Brotli compression on your server/hosting
4. Remove unused CSS — paste your CSS into purgecss.com to identify it
5. Reduce the number of third-party scripts loaded on the page`,
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
    boltPrompt: `Make your site accessible:
1. Add alt="" attribute to every <img> tag (describe what's in the image)
2. Add aria-label to buttons that only contain icons
3. Add <label for="..."> to every form input
4. Check text contrast — dark text on light background or vice versa
5. Make sure your headings go in order: h1, then h2, then h3 (no skipping)`,
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
    boltPrompt: `Add a title to your page:
Inside your HTML <head> tag, add:
<title>Your Page Name — Your Brand</title>

Tips:
- Keep it under 60 characters
- Include your most important keyword
- Add your brand name at the end`,
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
    boltPrompt: `Fix your page title length:
Edit your <title> tag to be between 50 and 60 characters:
<title>Your Main Keyword — Descriptive Phrase | Brand</title>

- Too short: adds no value, wastes the SEO opportunity
- Too long: Google cuts it off at ~60 characters in search results`,
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
    boltPrompt: `Add a meta description:
Inside your HTML <head> tag, add:
<meta name="description" content="Your page description here. 150-160 characters. Explain what visitors get and why they should click.">

Tips:
- Keep it between 150–160 characters
- Include your main keyword naturally
- Write it like an ad — make people want to click`,
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
    boltPrompt: `Fix your H1 heading:
Each page should have exactly one <h1> tag:
<h1>Your Main Page Headline Here</h1>

Rules:
- One per page (not zero, not two)
- Put your main keyword in it
- It should describe what the page is about
- Don't style other elements as h1 using CSS if they're not h1 tags`,
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
    boltPrompt: `Add a canonical tag to your page:
Inside your HTML <head> tag, add:
<link rel="canonical" href="https://yourdomain.com/this-page">

Use the full URL including https:// but without unnecessary query parameters.
This tells Google which version of the URL is the "official" one.`,
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
    boltPrompt: `Add Open Graph title to your page:
Inside your HTML <head> tag, add:
<meta property="og:title" content="Your Page Title Here">

This controls what title appears when your link is shared on:
- Twitter/X, Facebook, LinkedIn, Telegram, WhatsApp, Slack`,
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
    boltPrompt: `Add Open Graph description to your page:
Inside your HTML <head> tag, add:
<meta property="og:description" content="A compelling 1-2 sentence description of your page. Make people want to click.">

Keep it under 200 characters. This shows up under the title in link previews.`,
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
    boltPrompt: `Add to HTML <head>:
<meta property="og:image" content="https://YOURDOMAIN.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
Upload a 1200×630px image to your public folder.`,
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
    boltPrompt: `Fix your broken og:image:
1. Open the image URL from your og:image tag in a browser — check it loads
2. If it gives a 404, verify the image file exists in your public folder
3. Make sure the URL is the full absolute URL including https://
4. Replace the broken URL with a working one:
   <meta property="og:image" content="https://yourdomain.com/og-image.png">`,
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
    boltPrompt: `Add Twitter card tags to your page:
Inside your HTML <head> tag, add:
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Your Page Title">
<meta name="twitter:description" content="Your description">
<meta name="twitter:image" content="https://yourdomain.com/og-image.png">

"summary_large_image" shows a big image preview — the best format for engagement.`,
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
    boltPrompt: `Remove placeholder text from your site:
1. Search your HTML files for "Lorem ipsum", "Your name here", etc.
2. Replace every instance with your actual content
3. Check all pages — not just the homepage
4. Look inside components, modals, and less-visited pages too`,
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
    boltPrompt: `Enable HTTPS on your site:
1. If using Vercel, Netlify, or similar: HTTPS is automatic — just redeploy
2. If using shared hosting: enable SSL in your hosting control panel (usually free via Let's Encrypt)
3. After enabling, redirect all HTTP traffic to HTTPS in your server config or .htaccess:
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
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
    boltPrompt: `Add HSTS to your server response headers:
In your server config (nginx example):
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

In Apache .htaccess:
Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"

Only do this after confirming HTTPS works correctly on all pages.`,
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
    boltPrompt: `Add X-Frame-Options header:
In nginx:
add_header X-Frame-Options "SAMEORIGIN" always;

In Apache:
Header always set X-Frame-Options "SAMEORIGIN"

Or if your hosting platform supports custom headers, add:
Key: X-Frame-Options
Value: SAMEORIGIN`,
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
    boltPrompt: `Add X-Content-Type-Options header:
In nginx:
add_header X-Content-Type-Options "nosniff" always;

In Apache:
Header always set X-Content-Type-Options "nosniff"

This is a simple one-line fix — just add it alongside your other headers.`,
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
    boltPrompt: `Add Referrer-Policy header:
In nginx:
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

In Apache:
Header always set Referrer-Policy "strict-origin-when-cross-origin"

This is low risk and easy to add alongside your other security headers.`,
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
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
      ].join('; ')
    }],
  }]
}
See Next.js docs for nonce-based CSP with App Router.`,
    boltPrompt: `Add a basic Content Security Policy:
In your server response headers, add:
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:

Start with Content-Security-Policy-Report-Only first to check for breakage, then switch to Content-Security-Policy once confirmed.`,
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
    boltPrompt: `Strengthen your Content Security Policy:
Remove 'unsafe-inline' and 'unsafe-eval' from your CSP header.

To remove 'unsafe-inline' for scripts:
- Move all inline <script> code to external .js files
- Remove onclick="" and other inline event handlers — use addEventListener instead

To remove 'unsafe-eval':
- Find and replace any eval() calls in your code
- Check if any libraries you use require eval (look for alternatives)`,
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
    boltPrompt: `Renew your SSL certificate before it expires:
1. Log in to your hosting control panel
2. Find SSL/TLS or HTTPS settings
3. Click "Renew" or "Auto-Renew" for your certificate

If you're using Let's Encrypt (free SSL):
- Run: certbot renew
- Enable auto-renewal so this never happens again

If you have a paid SSL certificate, contact your SSL provider to renew it.`,
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
    boltPrompt: `URGENT:
1. Immediately revoke all API keys that were in the exposed file
2. Never put .env files in your public folder
3. Store all secrets in your hosting platform's Environment Variables only
4. Redeploy your app`,
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
    boltPrompt: `URGENT — your API key is exposed in your HTML:
1. Immediately go to the API service (OpenAI, Stripe, etc.) and revoke the key
2. Generate a new key
3. NEVER put API keys directly in your HTML or JavaScript files
4. Move all API calls to your server-side backend code only
5. Use environment variables on your server — never expose them in client-side code
6. Redeploy and verify the key is no longer visible in view-source`,
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
    boltPrompt: `Fix mixed content warnings:
Find and replace all http:// with https:// in your HTML, CSS, and JavaScript files.

Common places to check:
- Image src attributes: <img src="http://..."> → <img src="https://...">
- CSS background-image URLs
- Script src attributes
- Iframe src attributes
- Any external API or CDN URLs

Add this to your <head> as a quick fix while you update the URLs:
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`,
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
    boltPrompt: `Add viewport meta tag to your page:
Inside your HTML <head> tag, add:
<meta name="viewport" content="width=device-width, initial-scale=1">

This is essential for every website — without it, your site looks broken on mobile phones.
It tells the browser to use the device's actual screen width instead of assuming a desktop.`,
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
    boltPrompt: `Remove the zoom restriction from your viewport:
Find this in your <head>:
<meta name="viewport" content="..., user-scalable=no">
or
<meta name="viewport" content="..., maximum-scale=1">

Remove the user-scalable=no and maximum-scale=1 parts:
<meta name="viewport" content="width=device-width, initial-scale=1">

Users should always be able to zoom in — this is an accessibility requirement.`,
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
    boltPrompt: `Add a favicon to your site:
1. Create a small 32×32px icon image (save as favicon.ico or favicon.png)
2. Place it in your public/root folder
3. Add to your HTML <head>:
   <link rel="icon" href="/favicon.ico" sizes="any">
   <link rel="icon" href="/favicon.png" type="image/png">

Use realfavicongenerator.net to generate all the different sizes needed.`,
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
    boltPrompt: `Add Apple touch icon:
1. Create a 180×180px PNG image of your logo
2. Save it as apple-touch-icon.png in your public folder
3. Add to your HTML <head>:
   <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

This makes your site look professional when added to iPhone/iPad home screens.`,
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
    boltPrompt: `Fix broken links on your site:
1. Go through each page and click every link to find the broken ones
2. For each broken link either:
   - Update the href to the correct URL
   - Remove the link if the page no longer exists
   - Create the missing page
3. Set up a redirect from the old URL to the new one in your server config
4. Add a custom 404 page so users have a helpful experience if they do hit a broken link`,
    docsUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/not-found',
  },
}
