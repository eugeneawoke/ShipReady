export type FeatureCategory = 'SEO' | 'Security' | 'AI Visibility' | 'Performance' | 'Pricing' | 'Usability'

export interface CompetitorFeature {
  label: string
  category: FeatureCategory
  shipready: true | false | string
  competitor: true | false | string
  note?: string
}

export interface CompetitorFaqItem {
  q: string
  a: string
}

export interface CompetitorData {
  slug: string
  name: string
  tagline: string
  pricingRange: string
  whyWins: [string, string, string]
  features: CompetitorFeature[]
  weaknesses: string[]
  verdict: string
  faq: CompetitorFaqItem[]
}

export const competitors: Record<string, CompetitorData> = {
  ahrefs: {
    slug: 'ahrefs',
    name: 'Ahrefs',
    tagline: 'Backlink analysis and keyword research platform for SEO professionals',
    pricingRange: '$129–$449/mo',
    verdict: 'ShipReady gives solo founders a free AI visibility and security audit in seconds — without a $129/mo commitment.',
    features: [
      { label: 'AI visibility score', shipready: true, competitor: false, note: 'No AI crawler or llms.txt checks' },
      { label: 'Security header audit', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', shipready: true, competitor: false },
      { label: 'Schema.org validation', shipready: true, competitor: 'Partial' },
      { label: 'Trust signals (G2, GitHub, PH)', shipready: true, competitor: false },
      { label: 'PDF export', shipready: true, competitor: true },
      { label: 'Weekly monitoring', shipready: true, competitor: true },
      { label: 'Free tier', shipready: true, competitor: 'Limited trial' },
      { label: 'Price/month (lowest paid)', shipready: '$14', competitor: '$129' },
      { label: 'Real Lighthouse audit', shipready: true, competitor: false },
      { label: 'Multi-page crawl', shipready: true, competitor: true },
    ],
    weaknesses: [
      'No AI visibility checks — misses llms.txt, GPTBot/ClaudeBot access, and citability signals',
      'No security header audits (CSP, HSTS, X-Frame-Options)',
      'Entry price is $129/mo — expensive for solo founders and small teams',
      'Focused on backlinks/keywords — not a technical site health tool',
      'No free tier for ongoing audits',
    ],
    faq: [
      {
        q: 'What does ShipReady check that Ahrefs does not?',
        a: 'ShipReady audits AI visibility (llms.txt, GPTBot/ClaudeBot access, Schema.org citability signals), HTTP security headers (CSP, HSTS, X-Frame-Options), and Lighthouse performance. Ahrefs focuses on backlinks and keyword data and does not cover these checks.',
      },
      {
        q: 'Is ShipReady a cheaper alternative to Ahrefs?',
        a: 'Yes. ShipReady is free for 3 scans/month with no credit card required, and $14/mo for unlimited scans — vs Ahrefs at $129/mo. ShipReady is optimized for technical site audits; Ahrefs is a backlink and keyword research platform.',
      },
      {
        q: 'Can ShipReady replace Ahrefs entirely?',
        a: 'For technical audits, AI visibility, and security checks — yes. For deep backlink analysis and keyword tracking, Ahrefs remains the specialist. Many teams use ShipReady for automated site health monitoring and Ahrefs for competitive keyword research.',
      },
    ],
  },

  'screaming-frog': {
    slug: 'screaming-frog',
    name: 'Screaming Frog',
    tagline: 'Desktop SEO crawler for technical audits and site structure analysis',
    pricingRange: '£149/yr (~$190/yr)',
    verdict: 'ShipReady gives you cloud-based audits with AI visibility checks in seconds — no desktop app, no crawl setup, no annual license.',
    features: [
      { label: 'AI visibility score', shipready: true, competitor: false },
      { label: 'Security header audit', shipready: true, competitor: 'Partial', note: 'Via custom extraction, not built-in' },
      { label: 'llms.txt + AI crawler validation', shipready: true, competitor: false },
      { label: 'Schema.org validation', shipready: true, competitor: true },
      { label: 'Trust signals (G2, GitHub, PH)', shipready: true, competitor: false },
      { label: 'PDF export', shipready: true, competitor: true },
      { label: 'Weekly monitoring', shipready: true, competitor: false },
      { label: 'Free tier', shipready: true, competitor: 'Up to 500 URLs' },
      { label: 'Price/month (lowest paid)', shipready: '$14', competitor: '~$16/mo (annual)' },
      { label: 'Real Lighthouse audit', shipready: true, competitor: false, note: 'Screaming Frog does not run Lighthouse' },
      { label: 'Multi-page crawl', shipready: true, competitor: true },
    ],
    weaknesses: [
      'Desktop app only — no browser-based audit, requires installation and setup',
      'No AI visibility checks — misses llms.txt, AI crawler permissions, and citability signals',
      'No real Lighthouse performance audit — uses Google PageSpeed API as an add-on',
      'No weekly monitoring or email alerts',
      'Not suitable for non-technical users unfamiliar with crawler configuration',
    ],
    faq: [
      {
        q: 'What does ShipReady have that Screaming Frog does not?',
        a: 'ShipReady is cloud-based (no install), runs a real Lighthouse mobile audit, checks AI visibility (llms.txt, GPTBot/ClaudeBot access, Schema.org citability), and offers weekly monitoring with email alerts. Screaming Frog is a powerful desktop crawler but does not cover these areas.',
      },
      {
        q: 'Does ShipReady replace Screaming Frog for technical SEO?',
        a: "ShipReady covers the most impactful technical checks — title/meta, canonical, sitemap, robots.txt, structured data, security headers, and AI visibility — in a cloud-based audit. Screaming Frog's depth in crawl configuration and redirect mapping makes it better for complex site migrations.",
      },
      {
        q: 'Is ShipReady easier to use than Screaming Frog?',
        a: 'Yes. ShipReady is browser-based: paste a URL, get a report in seconds. Screaming Frog requires a desktop installation, crawl configuration, and manual export. ShipReady is designed for founders and developers who need actionable results fast.',
      },
    ],
  },

  semrush: {
    slug: 'semrush',
    name: 'Semrush',
    tagline: 'All-in-one marketing platform covering SEO, PPC, content, and social media',
    pricingRange: '$139.95–$499.95/mo',
    verdict: 'ShipReady gives you a free, honest technical audit with AI visibility in under a minute — without a $140/mo subscription.',
    features: [
      { label: 'AI visibility score', shipready: true, competitor: false, note: 'No llms.txt or AI crawler checks' },
      { label: 'Security header audit', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', shipready: true, competitor: false },
      { label: 'Schema.org validation', shipready: true, competitor: 'Partial' },
      { label: 'Trust signals (G2, GitHub, PH)', shipready: true, competitor: false },
      { label: 'PDF export', shipready: true, competitor: true },
      { label: 'Weekly monitoring', shipready: true, competitor: true },
      { label: 'Free tier', shipready: true, competitor: 'Limited (10 queries/day)' },
      { label: 'Price/month (lowest paid)', shipready: '$14', competitor: '$139.95' },
      { label: 'Real Lighthouse audit', shipready: true, competitor: false },
      { label: 'Multi-page crawl', shipready: true, competitor: true },
    ],
    weaknesses: [
      'Entry price is $139.95/mo — one of the most expensive tools in the category',
      'No AI visibility checks — does not audit llms.txt, GPTBot/ClaudeBot, or AI citability signals',
      'No HTTP security header audits (CSP, HSTS, X-Frame-Options)',
      'Does not run a real Lighthouse mobile performance audit',
      'Free tier is very limited at 10 queries/day',
    ],
    faq: [
      {
        q: 'What does ShipReady check that Semrush does not?',
        a: 'ShipReady audits AI visibility (llms.txt, AI crawler robots.txt rules, Schema.org entity signals), HTTP security headers, and runs a real Lighthouse mobile audit. Semrush focuses on keyword ranking, traffic estimates, and competitive research — not AI readiness or security headers.',
      },
      {
        q: 'Is ShipReady a Semrush alternative for site audits?',
        a: 'For technical site audits — yes, and at a fraction of the cost. ShipReady is $14/mo for unlimited scans vs Semrush at $139.95/mo. For keyword research, rank tracking, and competitive intelligence, Semrush is still the industry leader.',
      },
      {
        q: 'Which tool is better for AI search visibility?',
        a: 'ShipReady is purpose-built for AI visibility. It checks llms.txt presence, per-bot robots.txt rules, FAQ schema, Organization sameAs links, answer-first content signals, and performs trust signal lookups. Semrush does not audit any of these.',
      },
    ],
  },

  'se-ranking': {
    slug: 'se-ranking',
    name: 'SE Ranking',
    tagline: 'All-in-one SEO platform with rank tracking and site audit features',
    pricingRange: '$65–$259/mo',
    verdict: 'ShipReady delivers honest technical audits with AI visibility and security checks — without the rank-tracking overhead.',
    features: [
      { label: 'AI visibility score', shipready: true, competitor: false },
      { label: 'Security header audit', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', shipready: true, competitor: false },
      { label: 'Schema.org validation', shipready: true, competitor: 'Partial' },
      { label: 'Trust signals (G2, GitHub, PH)', shipready: true, competitor: false },
      { label: 'PDF export', shipready: true, competitor: true },
      { label: 'Weekly monitoring', shipready: true, competitor: true },
      { label: 'Free tier', shipready: true, competitor: '14-day trial' },
      { label: 'Price/month (lowest paid)', shipready: '$14', competitor: '$65' },
      { label: 'Real Lighthouse audit', shipready: true, competitor: false },
      { label: 'Multi-page crawl', shipready: true, competitor: true },
    ],
    weaknesses: [
      'No AI visibility checks — no llms.txt, AI crawler, or citability audits',
      'No HTTP security header audits',
      'Does not run a real Lighthouse performance audit',
      'No free tier — only a 14-day trial',
      'Primarily a rank-tracking tool; site audit is secondary functionality',
    ],
    faq: [
      {
        q: 'What does ShipReady check that SE Ranking does not?',
        a: 'ShipReady checks AI visibility (llms.txt, GPTBot/ClaudeBot access, Schema.org entity signals, FAQ schema, answer-first content), HTTP security headers, and runs a real Lighthouse mobile audit. SE Ranking\'s site audit focuses on traditional on-page SEO and does not cover AI search readiness.',
      },
      {
        q: 'Is ShipReady cheaper than SE Ranking?',
        a: 'Yes. ShipReady starts at $14/mo for unlimited scans with a free tier available (3 scans/mo, no credit card). SE Ranking starts at $65/mo with a 14-day trial only.',
      },
      {
        q: 'When would I choose SE Ranking over ShipReady?',
        a: 'Choose SE Ranking when you need keyword rank tracking and competitor keyword gap analysis across multiple domains. Choose ShipReady when you need technical site health audits, AI visibility checks, and security audits — especially for modern web apps and AI-first marketing.',
      },
    ],
  },

  otterly: {
    slug: 'otterly',
    name: 'Otterly',
    tagline: 'AI search visibility monitoring for brands and content marketers',
    pricingRange: '$69–$299/mo',
    verdict: 'ShipReady combines technical audit with AI visibility checks in one free tool — no separate monitoring subscription needed.',
    features: [
      { label: 'AI visibility score', shipready: true, competitor: true, note: 'Different approach: prompt-based monitoring' },
      { label: 'Security header audit', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', shipready: true, competitor: false },
      { label: 'Schema.org validation', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', shipready: true, competitor: 'Partial' },
      { label: 'PDF export', shipready: true, competitor: false },
      { label: 'Weekly monitoring', shipready: true, competitor: true },
      { label: 'Free tier', shipready: true, competitor: false },
      { label: 'Price/month (lowest paid)', shipready: '$14', competitor: '$69' },
      { label: 'Real Lighthouse audit', shipready: true, competitor: false },
      { label: 'Multi-page crawl', shipready: true, competitor: false },
    ],
    weaknesses: [
      'No free tier — requires a paid subscription from day one',
      'No technical SEO or security audits — only AI mention monitoring',
      'Does not check llms.txt or AI crawler robots.txt rules',
      'No Lighthouse performance audit',
      'No multi-page crawl or Schema.org validation',
    ],
    faq: [
      {
        q: 'How does ShipReady differ from Otterly for AI visibility?',
        a: "Otterly monitors whether your brand appears in AI-generated responses to prompts (brand mention tracking). ShipReady audits the technical factors that affect whether AI can find, access, and cite your site: llms.txt, AI crawler permissions, Schema.org entity signals, FAQ schema, and answer-first content structure. Both are complementary.",
      },
      {
        q: 'Is ShipReady free compared to Otterly?',
        a: 'Yes. ShipReady offers 3 free scans/month with no credit card required. Otterly has no free tier. ShipReady Pro is $14/mo vs Otterly at $69/mo.',
      },
      {
        q: 'Does ShipReady cover everything Otterly monitors?',
        a: 'ShipReady covers the technical side of AI visibility — the signals that determine whether AI can crawl and cite your site. Otterly tracks actual brand mentions in AI responses (prompt-based monitoring). For a complete AI search strategy, both tools are useful at different stages.',
      },
    ],
  },
}

export const competitorSlugs = Object.keys(competitors)
