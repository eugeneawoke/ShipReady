import type { IssueCategory, ScanResult } from '@/types/scan'
import type { Issue } from '@/types/scan'

export interface CheckCatalogEntry {
  id: string
  name: string
  detail: string
}

export const CHECK_CATALOG: Record<IssueCategory, CheckCatalogEntry[]> = {
  performance: [
    { id: 'lcp-slow', name: 'LCP under 2.5s', detail: 'Main content becomes visible fast enough for a real mobile user.' },
    { id: 'cls-high', name: 'No layout shifts (CLS)', detail: 'Visible content stays stable during load and does not jump unexpectedly.' },
    { id: 'inp-slow', name: 'Fast click response (INP under 200ms)', detail: 'Interactive elements respond without long main-thread delays.' },
    { id: 'fcp-slow', name: 'First paint under 1.8s (FCP)', detail: 'Users see the first rendered content quickly after navigation.' },
    { id: 'perf-score-low', name: 'Lighthouse performance score ≥70', detail: 'The measured Lighthouse mobile performance result stays above the baseline threshold.' },
    { id: 'a11y-score-low', name: 'Accessibility score ≥70', detail: 'Measured accessibility issues stay below the current report threshold.' },
  ],
  seo: [
    { id: 'missing-title', name: 'Title tag present', detail: 'The page ships a crawlable HTML title that search engines can index.' },
    { id: 'title-length', name: 'Title length is reasonable', detail: 'The title stays within a useful snippet range instead of being truncated or vague.' },
    { id: 'missing-description', name: 'Meta description present', detail: 'The page includes a visible description for search snippets and previews.' },
    { id: 'missing-h1', name: 'Single H1 heading', detail: 'Primary content has a clear top-level heading.' },
    { id: 'missing-canonical', name: 'Canonical URL set', detail: 'Search engines receive an explicit canonical URL for the current page.' },
    { id: 'missing-og-title', name: 'Open Graph title present', detail: 'Shared links expose a usable social preview title.' },
    { id: 'missing-og-description', name: 'Open Graph description present', detail: 'Shared links expose a usable social preview description.' },
    { id: 'missing-og-image', name: 'Open Graph image present', detail: 'Shared links expose an image for richer previews.' },
    { id: 'og-image-invalid', name: 'Open Graph image is accessible', detail: 'The OG image URL returns a fetchable image response.' },
    { id: 'missing-twitter-card', name: 'Twitter/X card present', detail: 'The page defines card metadata for X/Twitter link previews.' },
    { id: 'placeholder-text', name: 'No placeholder text detected', detail: 'Visible copy looks intentional instead of leftover scaffolding.' },
    { id: 'broken-links', name: 'No broken internal links detected', detail: 'Discovered internal links resolve successfully.' },
  ],
  security: [
    { id: 'no-https', name: 'HTTPS enabled', detail: 'The page loads over HTTPS without downgrading to insecure transport.' },
    { id: 'missing-hsts', name: 'HSTS header present', detail: 'Browsers receive an instruction to keep using HTTPS on future visits.' },
    { id: 'missing-x-frame', name: 'X-Frame-Options present', detail: 'The page protects against basic clickjacking framing.' },
    { id: 'missing-xcto', name: 'X-Content-Type-Options present', detail: 'Browsers are told not to MIME-sniff ambiguous responses.' },
    { id: 'missing-referrer-policy', name: 'Referrer-Policy present', detail: 'Outgoing navigation limits how much referrer data is leaked.' },
    { id: 'missing-csp', name: 'Content-Security-Policy present', detail: 'The page declares a CSP baseline for script and resource loading.' },
    { id: 'unsafe-csp', name: 'CSP avoids unsafe-inline/eval', detail: 'The current policy avoids the most permissive script execution shortcuts.' },
    { id: 'ssl-expiring', name: 'SSL certificate valid for 30+ days', detail: 'The current certificate is not close to expiry.' },
    { id: 'exposed-env-file', name: 'No exposed .env files', detail: 'Common secret file paths are not publicly reachable.' },
    { id: 'api-key-in-html', name: 'No API keys in HTML source', detail: 'Fetched markup does not expose obvious token-like credentials.' },
    { id: 'mixed-content', name: 'No mixed HTTP/HTTPS content', detail: 'The page avoids insecure subresources on an HTTPS origin.' },
  ],
  mobile: [
    { id: 'missing-viewport', name: 'Viewport meta tag present', detail: 'Mobile browsers receive an explicit responsive viewport setting.' },
    { id: 'blocking-viewport', name: 'Viewport allows user scaling', detail: 'The page does not block browser zoom for accessibility.' },
    { id: 'missing-favicon', name: 'Favicon present', detail: 'Browsers can fetch a tab icon for the site.' },
    { id: 'missing-touch-icon', name: 'Apple touch icon present', detail: 'iOS devices can save a recognizable home-screen icon.' },
  ],
  ai_visibility: [
    { id: 'missing-schema-org', name: 'Schema.org structured data present', detail: 'The page publishes machine-readable structured data.' },
    { id: 'missing-faq-schema', name: 'FAQ schema present when relevant', detail: 'FAQ-style content includes an explicit structured representation.' },
    { id: 'poor-heading-hierarchy', name: 'Heading hierarchy is coherent', detail: 'Content is segmented into a machine-readable heading outline.' },
    { id: 'thin-content', name: 'Sufficient content depth', detail: 'The page contains enough substantive copy to answer user questions.' },
    { id: 'missing-llms-txt', name: 'llms.txt present', detail: 'AI crawlers can discover a dedicated machine-readable guidance file.' },
    { id: 'ai-crawlers-blocked', name: 'AI crawlers allowed', detail: 'Robots directives do not block the relevant AI/answer engine bots.' },
    { id: 'missing-sitemap', name: 'Sitemap present', detail: 'The site exposes a crawlable sitemap file.' },
    { id: 'missing-author-entity', name: 'Author or organization entity present', detail: 'The page publishes an attributable author or organization signal.' },
  ],
  accessibility: [
    { id: 'low-a11y-score', name: 'Lighthouse accessibility score ≥70', detail: 'Automated accessibility audits show a passing score.' },
    { id: 'images-missing-alt-a11y', name: 'All images have alt text', detail: 'Every non-decorative image has a descriptive alt attribute.' },
    { id: 'form-inputs-no-label', name: 'Form inputs are labelled', detail: 'Every visible form control has an associated label or aria attribute.' },
    { id: 'buttons-no-label', name: 'Buttons have accessible names', detail: 'Every button has visible text or an aria-label.' },
    { id: 'missing-lang-attribute', name: 'HTML lang attribute present', detail: 'The html element declares the page language.' },
    { id: 'missing-skip-navigation', name: 'Skip navigation link present', detail: 'Keyboard users can skip to main content without tabbing through navigation.' },
  ],
}

export function getPassedChecksForCategory(category: IssueCategory, result: ScanResult): CheckCatalogEntry[] {
  return getPassedChecksForIssues(category, result[category].issues)
}

export function getPassedChecksForIssues(category: IssueCategory, issues: Issue[]): CheckCatalogEntry[] {
  const failedIds = new Set(issues.filter(issue => issue.severity !== 'pass').map(issue => issue.id))
  return CHECK_CATALOG[category].filter(entry => !failedIds.has(entry.id))
}
