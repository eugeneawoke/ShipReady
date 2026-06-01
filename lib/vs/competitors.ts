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
    whyWins: [
      'AI visibility built in — llms.txt, per-bot crawler access (GPTBot/ClaudeBot/Perplexity), and schema.org citability checks. Ahrefs has none of this.',
      '20+ security audits included — CSP, HSTS, X-Frame-Options, SSL/TLS grading, open .env detection. Ahrefs is SEO-only.',
      'Start free with no credit card. $14/mo Pro vs $129/mo minimum for Ahrefs.',
    ],
    verdict: 'ShipReady gives solo founders a free AI visibility and security audit in seconds — without a $129/mo commitment.',
    features: [
      { label: 'AI visibility score', category: 'AI Visibility', shipready: true, competitor: false, note: 'No AI crawler or llms.txt checks' },
      { label: 'llms.txt + AI crawler checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'Real Lighthouse audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'AI fix prompts (Cursor, Claude)', category: 'Usability', shipready: true, competitor: false },
      { label: 'Weekly monitoring', category: 'Usability', shipready: true, competitor: true },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: 'Limited trial' },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$129' },
      { label: 'No setup required', category: 'Usability', shipready: true, competitor: true },
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
        a: 'Yes. ShipReady is free for 3 scans/month with no credit card required, and $14/mo for unlimited scans — vs Ahrefs at $129/mo minimum. ShipReady is optimized for technical site audits; Ahrefs is a backlink and keyword research platform.',
      },
      {
        q: 'Can ShipReady replace Ahrefs entirely?',
        a: 'Not for backlink analysis or keyword research. ShipReady is built for technical site audits — security, AI visibility, performance, SEO health. If you need keyword rankings or link building, Ahrefs remains the specialist. For solo founders who primarily want to fix site issues, ShipReady covers everything at a fraction of the cost.',
      },
    ],
  },

  'screaming-frog': {
    slug: 'screaming-frog',
    name: 'Screaming Frog',
    tagline: 'Desktop SEO crawler for technical site audits used by SEO agencies',
    pricingRange: '£199/yr',
    whyWins: [
      'Cloud-based — no download, no install, no Windows/Mac required. Paste a URL and get a full report in under a minute.',
      'AI visibility checks included — llms.txt, per-bot crawler access, schema.org, trust signals. Screaming Frog has none.',
      'Security audit built in — 20+ checks including CSP, HSTS, SSL Labs grading, cookie flags. Screaming Frog is SEO-only.',
    ],
    verdict: 'ShipReady delivers what Screaming Frog can\'t: AI visibility and security audits in a cloud tool that anyone can use without installation.',
    features: [
      { label: 'Cloud-based (no install)', category: 'Usability', shipready: true, competitor: false, note: 'Desktop app only' },
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: 'Partial', note: 'Via custom extraction, not built-in' },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Real Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: true },
      { label: 'Free tier', category: 'Pricing', shipready: true, competitor: 'Up to 500 URLs free' },
      { label: 'Price/month', category: 'Pricing', shipready: '$14', competitor: '£17' },
      { label: 'Weekly monitoring', category: 'Usability', shipready: true, competitor: false },
    ],
    weaknesses: [
      'Desktop-only — requires download and installation on Windows, Mac, or Linux',
      'No AI visibility checks — no llms.txt, GPTBot/ClaudeBot access, or citability validation',
      'No security header audit built in — requires manual configuration',
      'No Lighthouse performance integration — separate tooling needed',
      'Steep learning curve — not designed for solo founders or non-technical users',
    ],
    faq: [
      {
        q: 'What makes ShipReady better than Screaming Frog for small teams?',
        a: 'ShipReady is cloud-based — no download, no setup. It covers AI visibility, security headers, and Lighthouse performance in one URL-based scan. Screaming Frog is a powerful desktop crawler but requires installation and technical knowledge to interpret results.',
      },
      {
        q: 'Does ShipReady cover everything Screaming Frog does?',
        a: 'Screaming Frog excels at deep multi-page crawls with hundreds of SEO data points. ShipReady is better for fast, comprehensive site health checks — especially when you need AI visibility, security, and actionable fix prompts for Cursor or Claude.',
      },
    ],
  },

  semrush: {
    slug: 'semrush',
    name: 'Semrush',
    tagline: 'All-in-one SEO and content marketing platform for marketing teams',
    pricingRange: '$140–$500/mo',
    whyWins: [
      'Security audits Semrush doesn\'t have — CSP, HSTS, SSL Labs TLS grading, cookie flags, open .env detection, and 15+ more checks.',
      'AI visibility depth — per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), llms.txt validation, trust signals (G2, GitHub, Product Hunt). Semrush AI Toolkit costs extra.',
      '$14/mo free-tier included vs $140/mo minimum for Semrush. No account manager required.',
    ],
    verdict: 'ShipReady is the technical site audit Semrush never built — security, AI visibility, and Lighthouse performance in one free scan.',
    features: [
      { label: 'AI visibility score', category: 'AI Visibility', shipready: true, competitor: 'Partial', note: 'AI Toolkit add-on $52+/mo extra' },
      { label: 'Per-bot crawler access checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: false },
      { label: 'Real Lighthouse performance', category: 'Performance', shipready: true, competitor: false },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: true },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'AI fix prompts (Cursor, Claude)', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: 'Limited trial' },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$140' },
    ],
    weaknesses: [
      'No security audits — CSP, HSTS, X-Frame-Options, SSL grading are absent',
      'AI Visibility is an expensive add-on ($52+/mo) — not included in base plans',
      'No Lighthouse performance audit built in',
      'Entry price of $140/mo is prohibitive for solo founders',
      'Overbuilt for technical site audits — primarily a keyword and content tool',
    ],
    faq: [
      {
        q: 'Does Semrush check AI visibility?',
        a: 'Semrush has an AI Visibility Toolkit add-on starting at $52/mo on top of the base plan. It tracks brand mentions in AI responses but does not check llms.txt, per-bot crawler access, or schema.org citability signals. ShipReady includes all of these in the base $14/mo plan.',
      },
      {
        q: 'Is ShipReady a replacement for Semrush?',
        a: 'Not for keyword research, backlink analysis, or content marketing. ShipReady specializes in technical site audits — security, AI visibility, and performance. If you need those checks without paying $140-500/mo for a full SEO suite, ShipReady is the right tool.',
      },
    ],
  },

  'se-ranking': {
    slug: 'se-ranking',
    name: 'SE Ranking',
    tagline: 'SEO platform with rank tracking and site audit for growing businesses',
    pricingRange: '$52–$250/mo',
    whyWins: [
      'Security audits SE Ranking doesn\'t have — CSP, HSTS, SSL Labs TLS grading, cookie security flags, and 15+ more HTTP security checks.',
      'AI visibility depth — per-bot access validation (GPTBot, ClaudeBot, PerplexityBot), llms.txt, trust signals. SE Ranking\'s AI toolkit doesn\'t include llms.txt or per-bot checks.',
      'AI fix prompts — every issue comes with a ready-to-paste prompt for Cursor, Claude Code, or Windsurf. SE Ranking shows problems but not how to fix them in code.',
    ],
    verdict: 'ShipReady gives developers actionable security and AI visibility fixes SE Ranking doesn\'t offer — at a lower starting price.',
    features: [
      { label: 'AI visibility score', category: 'AI Visibility', shipready: true, competitor: 'Partial', note: 'AI Search Toolkit add-on required' },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Per-bot crawler access (GPTBot etc)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Cookie security flags', category: 'Security', shipready: true, competitor: false },
      { label: 'Real Lighthouse performance', category: 'Performance', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$52' },
    ],
    weaknesses: [
      'No security audit — CSP, HSTS, cookie flags, SSL grading not included',
      'AI Search Toolkit is a paid add-on — not in base plans',
      'No Lighthouse performance audit',
      'No AI fix prompts — reports issues but doesn\'t generate code-ready fixes',
      'Claude and some newer AI bots not in AI visibility coverage',
    ],
    faq: [
      {
        q: 'Does SE Ranking cover AI visibility?',
        a: 'SE Ranking has an AI Search Toolkit add-on that monitors brand mentions in ChatGPT, Gemini, and Perplexity. However it doesn\'t check llms.txt files, per-bot crawler access rules, or trust signals like G2 and GitHub. ShipReady covers all of these in the base plan.',
      },
      {
        q: 'What\'s the key difference for developers?',
        a: 'ShipReady generates AI fix prompts for every issue — ready to paste into Cursor, Claude Code, or Windsurf. SE Ranking identifies problems but doesn\'t provide code-ready fixes. ShipReady also includes security audits (CSP, HSTS, SSL) that SE Ranking lacks entirely.',
      },
    ],
  },

  otterly: {
    slug: 'otterly',
    name: 'Otterly',
    tagline: 'GEO monitoring tool tracking brand mentions across AI platforms',
    pricingRange: '$27–$489/mo',
    whyWins: [
      'All-in-one vs monitoring-only — ShipReady audits SEO, security, performance, and AI visibility together. Otterly only monitors brand mentions.',
      'Security audit built in — CSP, HSTS, SSL Labs grading, cookie flags, secrets detection. Otterly has no security checks.',
      'Real Lighthouse performance audit with CrUX data. Otterly doesn\'t measure your site\'s performance at all.',
    ],
    verdict: 'Otterly monitors if you\'re mentioned in AI responses. ShipReady tells you why you\'re not — and gives you the code to fix it.',
    features: [
      { label: 'AI visibility score', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'Per-bot crawler access checks', category: 'AI Visibility', shipready: true, competitor: 'Partial' },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit (title, meta, OG, canonical)', category: 'SEO', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'Real Lighthouse performance', category: 'Performance', shipready: true, competitor: false },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts (Cursor, Claude)', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$27' },
    ],
    weaknesses: [
      'Monitoring-only — shows brand mentions in AI responses but doesn\'t audit your site structure',
      'No security checks — CSP, HSTS, SSL, cookie flags completely absent',
      'No SEO audit — title tags, meta descriptions, OG tags not covered',
      'No Lighthouse or performance audit',
      'No AI fix prompts — reports visibility gaps but provides no code-ready fixes',
    ],
    faq: [
      {
        q: 'What\'s the difference between Otterly and ShipReady for AI visibility?',
        a: 'Otterly monitors whether your brand is mentioned in AI responses — useful for ongoing tracking. ShipReady audits your site\'s technical foundations for AI readiness: llms.txt, per-bot crawler access, schema.org, trust signals. ShipReady also includes security, performance, and SEO checks that Otterly lacks entirely.',
      },
      {
        q: 'Should I use both Otterly and ShipReady?',
        a: 'They serve different purposes. ShipReady identifies and fixes technical barriers to AI visibility. Otterly monitors brand mentions over time. If budget is a concern, start with ShipReady to fix your technical foundation — then add monitoring once you\'re visible.',
      },
    ],
  },
}

export const competitorSlugs = Object.keys(competitors)
