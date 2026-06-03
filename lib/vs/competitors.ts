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
    verdict: 'Glook gives solo founders a free AI visibility and security audit in seconds — without a $129/mo commitment.',
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
        q: 'What does Glook check that Ahrefs does not?',
        a: 'Glook audits AI visibility (llms.txt, GPTBot/ClaudeBot access, Schema.org citability signals), HTTP security headers (CSP, HSTS, X-Frame-Options), and Lighthouse performance. Ahrefs focuses on backlinks and keyword data and does not cover these checks.',
      },
      {
        q: 'Is Glook a cheaper alternative to Ahrefs?',
        a: 'Yes. Glook is free for 3 scans/month with no credit card required, and $14/mo for unlimited scans — vs Ahrefs at $129/mo minimum. Glook is optimized for technical site audits; Ahrefs is a backlink and keyword research platform.',
      },
      {
        q: 'Can Glook replace Ahrefs entirely?',
        a: 'Not for backlink analysis or keyword research. Glook is built for technical site audits — security, AI visibility, performance, SEO health. If you need keyword rankings or link building, Ahrefs remains the specialist. For solo founders who primarily want to fix site issues, Glook covers everything at a fraction of the cost.',
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
    verdict: 'Glook delivers what Screaming Frog can\'t: AI visibility and security audits in a cloud tool that anyone can use without installation.',
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
        q: 'What makes Glook better than Screaming Frog for small teams?',
        a: 'Glook is cloud-based — no download, no setup. It covers AI visibility, security headers, and Lighthouse performance in one URL-based scan. Screaming Frog is a powerful desktop crawler but requires installation and technical knowledge to interpret results.',
      },
      {
        q: 'Does Glook cover everything Screaming Frog does?',
        a: 'Screaming Frog excels at deep multi-page crawls with hundreds of SEO data points. Glook is better for fast, comprehensive site health checks — especially when you need AI visibility, security, and actionable fix prompts for Cursor or Claude.',
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
    verdict: 'Glook is the technical site audit Semrush never built — security, AI visibility, and Lighthouse performance in one free scan.',
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
        a: 'Semrush has an AI Visibility Toolkit add-on starting at $52/mo on top of the base plan. It tracks brand mentions in AI responses but does not check llms.txt, per-bot crawler access, or schema.org citability signals. Glook includes all of these in the base $14/mo plan.',
      },
      {
        q: 'Is Glook a replacement for Semrush?',
        a: 'Not for keyword research, backlink analysis, or content marketing. Glook specializes in technical site audits — security, AI visibility, and performance. If you need those checks without paying $140-500/mo for a full SEO suite, Glook is the right tool.',
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
    verdict: 'Glook gives developers actionable security and AI visibility fixes SE Ranking doesn\'t offer — at a lower starting price.',
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
        a: 'SE Ranking has an AI Search Toolkit add-on that monitors brand mentions in ChatGPT, Gemini, and Perplexity. However it doesn\'t check llms.txt files, per-bot crawler access rules, or trust signals like G2 and GitHub. Glook covers all of these in the base plan.',
      },
      {
        q: 'What\'s the key difference for developers?',
        a: 'Glook generates AI fix prompts for every issue — ready to paste into Cursor, Claude Code, or Windsurf. SE Ranking identifies problems but doesn\'t provide code-ready fixes. Glook also includes security audits (CSP, HSTS, SSL) that SE Ranking lacks entirely.',
      },
    ],
  },

  otterly: {
    slug: 'otterly',
    name: 'Otterly',
    tagline: 'GEO monitoring tool tracking brand mentions across AI platforms',
    pricingRange: '$27–$489/mo',
    whyWins: [
      'All-in-one vs monitoring-only — Glook audits SEO, security, performance, and AI visibility together. Otterly only monitors brand mentions.',
      'Security audit built in — CSP, HSTS, SSL Labs grading, cookie flags, secrets detection. Otterly has no security checks.',
      'Real Lighthouse performance audit with CrUX data. Otterly doesn\'t measure your site\'s performance at all.',
    ],
    verdict: 'Otterly monitors if you\'re mentioned in AI responses. Glook tells you why you\'re not — and gives you the code to fix it.',
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
        q: 'What\'s the difference between Otterly and Glook for AI visibility?',
        a: 'Otterly monitors whether your brand is mentioned in AI responses — useful for ongoing tracking. Glook audits your site\'s technical foundations for AI readiness: llms.txt, per-bot crawler access, schema.org, trust signals. Glook also includes security, performance, and SEO checks that Otterly lacks entirely.',
      },
      {
        q: 'Should I use both Otterly and Glook?',
        a: 'They serve different purposes. Glook identifies and fixes technical barriers to AI visibility. Otterly monitors brand mentions over time. If budget is a concern, start with Glook to fix your technical foundation — then add monitoring once you\'re visible.',
      },
    ],
  },

  'google-pagespeed': {
    slug: 'google-pagespeed',
    name: 'Google PageSpeed Insights',
    tagline: 'Free Google tool measuring Core Web Vitals and Lighthouse performance',
    pricingRange: 'Free',
    whyWins: [
      'Security audits PageSpeed doesn\'t have — CSP, HSTS, SSL Labs TLS grading, cookie flags, secrets detection, and 15+ HTTP security checks.',
      'AI visibility coverage — llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), schema.org, and trust signals. PageSpeed only measures performance.',
      'AI fix prompts — every issue generates a ready-to-paste prompt for Cursor or Claude Code. PageSpeed shows scores but no actionable code fixes.',
    ],
    verdict: 'PageSpeed Insights measures performance. Glook measures everything — and tells you exactly how to fix it.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade', category: 'Security', shipready: true, competitor: false },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit (title, meta, OG, canonical)', category: 'SEO', shipready: true, competitor: 'Partial', note: 'Basic meta only' },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: false },
      { label: 'Core Web Vitals (Lighthouse)', category: 'Performance', shipready: true, competitor: true },
      { label: 'CrUX real-world field data', category: 'Performance', shipready: true, competitor: true },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Weekly monitoring', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price/month (Pro)', category: 'Pricing', shipready: '$14', competitor: 'Free forever' },
    ],
    weaknesses: [
      'Performance-only — no security, AI visibility, or SEO checks',
      'No actionable fix prompts — shows scores but not how to fix issues in code',
      'No weekly monitoring — single snapshot only',
      'No AI visibility checks — llms.txt, crawler access, trust signals absent',
      'Limited SEO coverage — only basic meta checks',
    ],
    faq: [
      {
        q: 'If PageSpeed Insights is free, why use Glook?',
        a: 'PageSpeed Insights only measures performance (Lighthouse scores and Core Web Vitals). Glook also audits security headers, AI visibility, SEO tags, schema.org, and trust signals — plus generates AI fix prompts for every issue so you can paste fixes into Cursor or Claude directly.',
      },
      {
        q: 'Does Glook use Google\'s real CrUX data?',
        a: 'Yes. Glook pulls Chrome User Experience Report (CrUX) data for real-world Core Web Vitals alongside a full Lighthouse audit. You get both lab data and real-world field data in one report.',
      },
    ],
  },

  gtmetrix: {
    slug: 'gtmetrix',
    name: 'GTmetrix',
    tagline: 'Web performance testing tool with waterfall charts and video playback',
    pricingRange: 'Free–$41/mo',
    whyWins: [
      'Security audits GTmetrix doesn\'t have — CSP, HSTS, SSL Labs TLS grading, cookie flags, open .env, and 15+ more HTTP security checks.',
      'AI visibility coverage — llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), schema.org citability. GTmetrix is performance-only.',
      'AI fix prompts for every issue — paste directly into Cursor or Claude Code. GTmetrix shows waterfall charts but no actionable code fixes.',
    ],
    verdict: 'GTmetrix benchmarks your site\'s speed. Glook tells you what\'s actually blocking users, search engines, and AI from finding you — and how to fix it.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: true },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'Waterfall chart', category: 'Performance', shipready: false, competitor: true },
      { label: 'Historical tracking', category: 'Usability', shipready: false, competitor: true },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$5.83' },
    ],
    weaknesses: [
      'Performance-only — no security, AI visibility, or SEO audit',
      'No AI fix prompts — shows issues but no code-ready solutions',
      'No AI visibility checks — llms.txt, per-bot crawlers, trust signals absent',
      'No security audit — CSP, HSTS, SSL grading not included',
      'Requires account for historical data and advanced features',
    ],
    faq: [
      {
        q: 'What does Glook cover that GTmetrix doesn\'t?',
        a: 'Glook adds security audits (CSP, HSTS, SSL Labs grading, cookie flags), AI visibility checks (llms.txt, GPTBot/ClaudeBot access, schema.org), full SEO audit, and AI fix prompts. GTmetrix focuses on performance waterfall analysis, historical tracking, and video playback.',
      },
      {
        q: 'Is Glook better for performance testing than GTmetrix?',
        a: 'GTmetrix has deeper performance tooling — waterfall charts, video recording, multi-location testing, and historical trends. Glook runs a full Lighthouse audit with CrUX data, which covers the metrics that matter most for Google rankings. For pure performance debugging, GTmetrix is excellent. For overall site health including security and AI visibility, Glook is more complete.',
      },
    ],
  },

  securityheaders: {
    slug: 'securityheaders',
    name: 'SecurityHeaders.com',
    tagline: 'Free HTTP security header checker used by 250M+ website scans',
    pricingRange: 'Free',
    whyWins: [
      'Full site audit vs headers-only — Glook checks security headers plus SEO, performance (Lighthouse), AI visibility, mobile readiness, and 60+ more checks.',
      'AI visibility coverage — llms.txt, per-bot crawler access, schema.org, trust signals. SecurityHeaders.com checks only HTTP response headers.',
      'AI fix prompts — every failing check generates code-ready instructions for Cursor or Claude Code. SecurityHeaders.com shows grades but no fix code.',
    ],
    verdict: 'SecurityHeaders.com grades your headers. Glook audits your entire site — including the headers — and generates the code to fix every issue.',
    features: [
      { label: 'CSP header check', category: 'Security', shipready: true, competitor: true },
      { label: 'HSTS header check', category: 'Security', shipready: true, competitor: true },
      { label: 'X-Frame-Options check', category: 'Security', shipready: true, competitor: true },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Cookie security flags', category: 'Security', shipready: true, competitor: false },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: false },
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Weekly monitoring', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price/month (Pro)', category: 'Pricing', shipready: '$14', competitor: 'Free forever' },
    ],
    weaknesses: [
      'Headers-only — no SEO, performance, AI visibility, or mobile checks',
      'No AI fix prompts — gives grades but no code to implement fixes',
      'No monitoring — single-point check, not continuous tracking',
      'No Lighthouse or Core Web Vitals data',
      'No AI visibility or llms.txt coverage',
    ],
    faq: [
      {
        q: 'SecurityHeaders.com is free forever. Why use Glook?',
        a: 'SecurityHeaders.com is excellent for a quick header grade. Glook includes all those header checks plus Lighthouse performance, SEO audit, AI visibility (llms.txt, per-bot crawlers, schema.org), and AI fix prompts. If you only need to check headers, SecurityHeaders.com works. If you want a complete site audit with actionable fixes, Glook covers everything in one scan.',
      },
      {
        q: 'Does Glook check all the same headers as SecurityHeaders.com?',
        a: 'Yes. Glook checks CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy — plus SSL Labs TLS grading and cookie security flags that SecurityHeaders.com does not cover.',
      },
    ],
  },

  'mozilla-observatory': {
    slug: 'mozilla-observatory',
    name: 'Mozilla Observatory',
    tagline: 'Free security best practices checker from Mozilla with 47M+ scans',
    pricingRange: 'Free',
    whyWins: [
      'Full site audit vs security-only — Glook covers SEO, performance (Lighthouse), AI visibility, mobile readiness, and 90+ checks. Mozilla Observatory checks security best practices only.',
      'AI visibility coverage — llms.txt, per-bot crawler access (GPTBot, ClaudeBot), schema.org, trust signals. Mozilla Observatory has none of this.',
      'AI fix prompts — paste into Cursor or Claude Code immediately. Mozilla Observatory shows a score and grade but no code to fix issues.',
    ],
    verdict: 'Mozilla Observatory audits security. Glook audits security plus everything else your site needs to be found by Google and AI.',
    features: [
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: true },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false, note: 'Links to external SSL Labs' },
      { label: 'Cookie security flags', category: 'Security', shipready: true, competitor: false },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: false },
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'SEO audit (title, meta, OG, canonical)', category: 'SEO', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Weekly monitoring', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price/month (Pro)', category: 'Pricing', shipready: '$14', competitor: 'Free forever' },
    ],
    weaknesses: [
      'Security-only — no SEO, performance, AI visibility, or mobile checks',
      'No AI fix prompts — provides grades but not the code to fix issues',
      'No monitoring — single-run check only',
      'No Lighthouse or Core Web Vitals data',
      'No AI visibility checks whatsoever',
    ],
    faq: [
      {
        q: 'Is Mozilla Observatory still relevant in 2026?',
        a: 'Mozilla Observatory remains a solid quick-check for HTTP security headers. Glook runs all the same security checks plus a full Lighthouse audit, AI visibility (llms.txt, AI crawlers, schema.org), SEO audit, and generates AI fix prompts for every issue — making it a complete replacement for Observatory plus much more.',
      },
      {
        q: 'Does Glook score the same security headers Mozilla Observatory does?',
        a: 'Yes. Glook checks CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and all headers Mozilla Observatory covers. It also adds SSL Labs TLS grading, cookie security flags, and detection of exposed secrets that Observatory does not audit.',
      },
    ],
  },

  'hubspot-aeo': {
    slug: 'hubspot-aeo',
    name: 'HubSpot AEO Grader',
    tagline: 'Free one-shot AI visibility audit with 100-point score and PDF report',
    pricingRange: 'Free',
    whyWins: [
      'Technical depth — Glook checks llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), cookie security flags, SSL Labs grading. HubSpot AEO Grader checks 5 high-level metrics.',
      'Security + performance included — CSP, HSTS, Lighthouse scores, Core Web Vitals. HubSpot AEO Grader is AI visibility only.',
      'Continuous monitoring — weekly alerts when scores drop. HubSpot AEO Grader is a one-time snapshot with no ongoing tracking.',
    ],
    verdict: 'HubSpot AEO Grader is a great starting point. Glook goes 10× deeper — with security, performance, and the code to fix every issue.',
    features: [
      { label: 'AI visibility score', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: 'Partial' },
      { label: 'Per-bot crawler access (GPTBot etc)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'Full SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade', category: 'Security', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Weekly monitoring', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price/month (Pro)', category: 'Pricing', shipready: '$14', competitor: 'Free forever' },
    ],
    weaknesses: [
      'AI visibility only — no security, performance, or full SEO audit',
      'Only 5 metrics in a 100-point score — not granular enough to act on',
      'No ongoing monitoring — one-time PDF snapshot',
      'No AI fix prompts — gives a score but no code to improve it',
      'No security checks of any kind',
    ],
    faq: [
      {
        q: 'Is HubSpot AEO Grader a replacement for a full AI visibility audit?',
        a: 'HubSpot AEO Grader is a good entry-point overview. Glook goes deeper — checking llms.txt line by line, per-bot access rules for GPTBot/ClaudeBot/PerplexityBot, trust signals like G2 and GitHub stars, and schema.org structured data. Glook also generates the code to fix each issue.',
      },
      {
        q: 'What does Glook have that HubSpot\'s grader doesn\'t?',
        a: 'Security audits (CSP, HSTS, SSL Labs TLS grading, cookie flags), full Lighthouse performance audit with Core Web Vitals, complete SEO tag audit, weekly monitoring with email alerts, and AI fix prompts for every issue — ready to paste into Cursor or Claude Code.',
      },
    ],
  },

  cheeeck: {
    slug: 'cheeeck',
    name: 'Cheeeck',
    tagline: 'URL-based multi-check site audit for developers and indie hackers',
    pricingRange: '$8–$25/mo',
    whyWins: [
      'AI fix prompts formatted for coding tools — paste directly into Cursor, Claude Code, or Windsurf. Cheeeck reports issues but doesn\'t generate code-ready prompts.',
      'AI visibility checks — llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), trust signals (G2, GitHub, Product Hunt). Cheeeck doesn\'t cover AI visibility.',
      '90+ checks vs ~30 — SSL Labs TLS grading, OSV vulnerability database, CrUX real-world field data, per-bot crawler access, cookie flags, DNS security (SPF/DMARC/CAA).',
    ],
    verdict: 'Cheeeck is the closest alternative to Glook — but Glook has AI fix prompts, AI visibility, and 3× more checks.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: true },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Cookie security flags', category: 'Security', shipready: true, competitor: false },
      { label: 'OSV vulnerability database check', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit (title, meta, OG, canonical)', category: 'SEO', shipready: true, competitor: true },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: true },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts (Cursor, Claude)', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$8' },
    ],
    weaknesses: [
      'No AI visibility checks — llms.txt, per-bot crawler access, and trust signals not covered',
      'No AI fix prompts — reports issues but doesn\'t generate code for Cursor or Claude',
      'No SSL Labs TLS grading — basic SSL check only',
      'No CrUX real-world Core Web Vitals field data',
      'No free tier — paid subscription required from day one',
    ],
    faq: [
      {
        q: 'How does Glook compare to Cheeeck in terms of checks covered?',
        a: 'Cheeeck covers ~30 audit parameters across SEO, performance, security, and UX. Glook covers 90+ checks including AI visibility (llms.txt, per-bot crawler access, trust signals), SSL Labs TLS grading, OSV vulnerability database, CrUX real-world Core Web Vitals, cookie security flags, and DNS security (SPF/DMARC/CAA).',
      },
      {
        q: 'What is the biggest difference between Glook and Cheeeck?',
        a: 'AI fix prompts and AI visibility. Glook generates ready-to-paste prompts for Cursor, Claude Code, and Windsurf for every issue. It also checks if your site is accessible to AI crawlers (GPTBot, ClaudeBot, PerplexityBot) and measures trust signals like G2 reviews and GitHub stars — checks Cheeeck doesn\'t have.',
      },
    ],
  },

  'moz-pro': {
    slug: 'moz-pro',
    name: 'Moz Pro',
    tagline: 'SEO platform with Domain Authority, keyword tracking, and link analysis',
    pricingRange: '$99–$599/mo',
    whyWins: [
      'Security audits Moz doesn\'t have — CSP, HSTS, SSL Labs TLS grading, cookie flags, open .env detection, and 15+ HTTP security checks.',
      'AI visibility coverage — llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), trust signals. Moz Pro is SEO-only with no AI visibility checks.',
      '$14/mo vs $99/mo minimum, free tier with no credit card. Moz Pro requires a paid subscription and is built for professional SEO agencies.',
    ],
    verdict: 'Moz Pro is built for SEO agencies tracking keywords and backlinks. Glook is built for developers fixing site issues — including ones Moz doesn\'t check.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit (title, meta, OG, canonical)', category: 'SEO', shipready: true, competitor: true },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: 'Partial' },
      { label: 'Keyword rank tracking', category: 'SEO', shipready: false, competitor: true },
      { label: 'Backlink analysis / DA', category: 'SEO', shipready: false, competitor: true },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$99' },
    ],
    weaknesses: [
      'No security audits — CSP, HSTS, SSL grading, cookie flags completely absent',
      'No AI visibility checks — llms.txt, per-bot crawlers, trust signals not covered',
      'No Lighthouse performance audit',
      'Entry price of $99/mo is expensive for solo founders',
      'No AI fix prompts — reports issues but no code to fix them',
    ],
    faq: [
      {
        q: 'When should I use Moz Pro vs Glook?',
        a: 'Use Moz Pro if you need keyword rank tracking, Domain Authority scores, and backlink analysis — these are things Glook doesn\'t do. Use Glook if you need security audits, AI visibility checks, Lighthouse performance, and AI fix prompts. Many teams use both: Moz for SEO strategy, Glook for technical site health.',
      },
      {
        q: 'Is Glook a cheaper alternative to Moz Pro?',
        a: 'Yes for technical site audits. Glook is $14/mo (free tier available) vs Moz Pro at $99/mo minimum. Glook covers security, AI visibility, and performance that Moz Pro doesn\'t. For keyword research and link building, Moz Pro is the specialist tool.',
      },
    ],
  },

  sitebulb: {
    slug: 'sitebulb',
    name: 'Sitebulb',
    tagline: 'Desktop technical SEO crawler with visual reports for SEO professionals',
    pricingRange: '$15–$40/mo',
    whyWins: [
      'Cloud-based — no download, no install. Paste a URL and get your full report in under a minute. Sitebulb requires a desktop application on Windows or Mac.',
      'AI visibility coverage — llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), trust signals. Sitebulb is technical SEO only with no AI visibility.',
      'Security audits built in — CSP, HSTS, SSL Labs TLS grading, cookie flags, open .env detection. Sitebulb doesn\'t check HTTP security headers.',
    ],
    verdict: 'Sitebulb is a powerful desktop crawler for SEO agencies. Glook is the cloud-based alternative that adds security and AI visibility without the installation.',
    features: [
      { label: 'Cloud-based (no install)', category: 'Usability', shipready: true, competitor: false, note: 'Desktop app required' },
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO technical audit', category: 'SEO', shipready: true, competitor: true },
      { label: 'Schema.org validation', category: 'SEO', shipready: true, competitor: true },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'Core Web Vitals (CrUX)', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: 'Trial only' },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$15' },
    ],
    weaknesses: [
      'Desktop-only — requires download and installation on Windows or Mac',
      'No AI visibility checks — llms.txt, per-bot crawlers, trust signals absent',
      'No HTTP security header audits',
      'No Lighthouse audit — separate tooling required for performance scores',
      'Steep learning curve — designed for professional SEO practitioners',
    ],
    faq: [
      {
        q: 'What does Glook do better than Sitebulb?',
        a: 'Glook is cloud-based (no installation), covers AI visibility (llms.txt, AI crawler access, trust signals), includes HTTP security audits (CSP, HSTS, SSL Labs), runs Lighthouse performance audits, and generates AI fix prompts. Sitebulb excels at deep multi-page crawls with visual chart reports for SEO specialists.',
      },
      {
        q: 'Can Glook replace Sitebulb for technical SEO?',
        a: 'For a fast, comprehensive site health check — yes. Sitebulb goes deeper on multi-page crawl visualization and is built for large-scale site audits by SEO agencies. Glook is better suited for developers and founders who need a quick, actionable report covering security, AI visibility, and performance alongside SEO.',
      },
    ],
  },

  rankscale: {
    slug: 'rankscale',
    name: 'Rankscale',
    tagline: 'AI visibility audit platform covering 20 AI platforms with technical depth',
    pricingRange: '$20–$780/mo',
    whyWins: [
      'All-in-one audit — Glook checks security (CSP, HSTS, SSL Labs), performance (Lighthouse, CrUX), and SEO alongside AI visibility. Rankscale is AI visibility only.',
      'Predictable pricing — $14/mo flat vs Rankscale\'s credit-based model where costs scale with usage. Glook free tier included, no card required.',
      'AI fix prompts — every issue generates code for Cursor, Claude Code, or Windsurf. Rankscale identifies AI visibility gaps but provides no actionable fix code.',
    ],
    verdict: 'Rankscale tracks 20 AI platforms deeply. Glook tracks 5 AI platforms and also audits your security, performance, and SEO — in one report for $14/mo.',
    features: [
      { label: 'AI visibility score', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'AI platforms covered', category: 'AI Visibility', shipready: '5–6', competitor: '20', note: 'Rankscale covers more AI platforms' },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'Per-bot crawler access checks', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: 'Partial' },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price model', category: 'Pricing', shipready: 'Flat $14/mo', competitor: 'Credit-based' },
    ],
    weaknesses: [
      'AI visibility only — no security, performance, or SEO checks',
      'Credit-based pricing — costs scale unpredictably with usage',
      'No AI fix prompts — identifies gaps but provides no code to fix them',
      'No security audits — CSP, HSTS, SSL grading absent',
      'LLM-based scoring can give different results on repeat runs (non-deterministic)',
    ],
    faq: [
      {
        q: 'Rankscale covers 20 AI platforms. Doesn\'t that make it better?',
        a: 'Rankscale goes deeper on AI monitoring across more platforms. Glook focuses on the 5-6 AI platforms that drive the most traffic (ChatGPT, Claude, Perplexity, Gemini, Bing AI) and pairs that with security, performance, and SEO audits in one scan. Most sites need the full technical foundation fixed before monitoring more AI platforms adds value.',
      },
      {
        q: 'Which should I choose — Rankscale or Glook?',
        a: 'If you only need AI visibility monitoring across 20+ platforms, Rankscale is thorough. If you need a complete site audit covering security (CSP, HSTS, SSL), performance (Lighthouse, CrUX), SEO, and AI visibility — with code-ready fixes — Glook is the better starting point. You can always add Rankscale for monitoring after Glook fixes the technical foundations.',
      },
    ],
  },

  peec: {
    slug: 'peec',
    name: 'Peec.ai',
    tagline: 'AI visibility monitoring platform with $21M Series A, used by Wix and ElevenLabs',
    pricingRange: '€89–€449/mo',
    whyWins: [
      'Built for new sites — Peec openly says "not for brand new startups." Glook audits sites with zero history and shows exactly what to fix to become visible in AI.',
      'Security + performance included — CSP, HSTS, SSL Labs grading, Lighthouse, CrUX. Peec.ai is AI visibility monitoring only.',
      'From $14/mo vs €89/mo minimum for Peec. Free tier with no credit card. No sales call required.',
    ],
    verdict: 'Peec.ai monitors your AI brand presence. Glook audits the technical foundation that makes brand presence possible — at a fraction of the cost.',
    features: [
      { label: 'AI visibility monitoring', category: 'AI Visibility', shipready: 'Audit', competitor: 'Continuous monitoring' },
      { label: 'AI platforms covered', category: 'AI Visibility', shipready: '5–6', competitor: '9' },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Per-bot crawler access', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'New site support', category: 'Usability', shipready: true, competitor: false, note: 'Peec: "not for new startups"' },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: false },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '€89' },
    ],
    weaknesses: [
      'Self-described "not for brand new startups" — requires existing brand presence',
      'Monitoring-only — shows brand mentions but doesn\'t audit technical foundations',
      'No security, SEO, or performance checks',
      'No AI fix prompts — provides a score, not code to improve it',
      '€89/mo minimum — 6× more expensive than Glook Pro',
    ],
    faq: [
      {
        q: 'Peec.ai raised $21M. Doesn\'t that mean it\'s better?',
        a: 'Peec.ai is an excellent AI brand monitoring platform for established companies tracking their presence across 9 AI systems. It\'s built for companies like Wix and ElevenLabs. Glook is built for solo founders, developers, and early-stage startups who need to fix their technical site foundations first — before there\'s brand presence to monitor.',
      },
      {
        q: 'Should I use Peec.ai or Glook?',
        a: 'Start with Glook to audit and fix your site\'s technical AI readiness — llms.txt, crawler access, schema.org, trust signals, security, performance. Then use Peec.ai if you want to track your brand mentions across AI platforms at scale. Peec themselves say they\'re not the right fit for brand new sites.',
      },
    ],
  },

  profound: {
    slug: 'profound',
    name: 'Profound',
    tagline: 'Enterprise AI visibility platform valued at $1B, used by Figma and DocuSign',
    pricingRange: '$99–$5000+/mo',
    whyWins: [
      'Self-serve, instant access — no sales call, no onboarding, no 1-3 week setup. Scan your URL and get results in under a minute.',
      'Security + performance + SEO included — CSP, HSTS, Lighthouse, CrUX, full SEO audit. Profound is AI visibility only.',
      '$14/mo free tier vs $199/mo minimum for Profound. Built for founders and indie developers, not Fortune 500 companies.',
    ],
    verdict: 'Profound is the enterprise solution backed by Sequoia. Glook is for solo founders who need AI visibility, security, and performance audits without a sales call.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: true },
      { label: 'AI content agents (write + publish)', category: 'AI Visibility', shipready: false, competitor: 'Enterprise only' },
      { label: 'llms.txt validation', category: 'AI Visibility', shipready: true, competitor: 'Partial' },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: false },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts (Cursor, Claude)', category: 'Usability', shipready: true, competitor: false },
      { label: 'Self-serve (no sales call)', category: 'Usability', shipready: true, competitor: 'Starter only' },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month (entry paid)', category: 'Pricing', shipready: '$14', competitor: '$99' },
    ],
    weaknesses: [
      'Requires 1-3 week onboarding for full enterprise setup',
      'ChatGPT-only on $99/mo Starter plan — full coverage starts at $399/mo',
      'No security, performance, or SEO audit — AI visibility monitoring only',
      'No AI fix prompts — identifies gaps but provides no code-ready solutions',
      'Designed for enterprise teams, not individual developers or indie founders',
    ],
    faq: [
      {
        q: 'Profound is valued at $1 billion. Should I use it instead of Glook?',
        a: 'Profound is built for enterprise clients like Figma, DocuSign, and Target — with multi-team workflows, content agents that publish directly to CMS, and enterprise-grade monitoring across 10+ AI platforms. Glook is built for developers and founders who need a fast, complete technical site audit covering security, performance, and AI visibility — without a sales call or enterprise budget.',
      },
      {
        q: 'What does Glook cover that Profound doesn\'t?',
        a: 'Glook audits security (CSP, HSTS, SSL Labs TLS grading, cookie flags, open .env detection), performance (Lighthouse mobile audit, Core Web Vitals, CrUX data), and full SEO (title tags, meta, OG, canonical, schema.org). Profound focuses exclusively on AI visibility monitoring and content agents.',
      },
    ],
  },

  vibeeval: {
    slug: 'vibeeval',
    name: 'VibeEval',
    tagline: 'Security audit tool for AI-generated apps using Playwright-based attack simulation',
    pricingRange: '$19/mo',
    whyWins: [
      'Full site audit vs security-only — Glook covers SEO, AI visibility (llms.txt, per-bot crawlers, trust signals), and Lighthouse performance alongside security. VibeEval is security-only.',
      'No installation required — Glook is cloud-based. VibeEval requires a Chrome extension.',
      'AI visibility coverage — checks if AI crawlers (GPTBot, ClaudeBot, PerplexityBot) can access your site, validates llms.txt, and measures trust signals. VibeEval doesn\'t check AI visibility at all.',
    ],
    verdict: 'VibeEval simulates attacks on your security. Glook audits security plus AI visibility, SEO, and performance — in one cloud scan with no extension to install.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: true },
      { label: 'SSL/TLS grade', category: 'Security', shipready: true, competitor: true },
      { label: 'Playwright attack simulation', category: 'Security', shipready: false, competitor: true, note: 'VibeEval\'s unique feature' },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: true },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'Cloud-based (no install)', category: 'Usability', shipready: true, competitor: false, note: 'Requires Chrome extension' },
      { label: 'AI fix prompts', category: 'Usability', shipready: true, competitor: 'Partial' },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: false },
      { label: 'Price/month', category: 'Pricing', shipready: '$14', competitor: '$19' },
    ],
    weaknesses: [
      'Security-only — no SEO, AI visibility, or performance audit',
      'Requires Chrome extension installation',
      'No AI visibility checks — llms.txt, per-bot crawlers, trust signals absent',
      'Not designed for non-technical founders — Playwright-based attack simulation has a learning curve',
      'No weekly monitoring or continuous tracking',
    ],
    faq: [
      {
        q: 'What makes VibeEval different from Glook\'s security checks?',
        a: 'VibeEval uses Playwright to simulate real attacks — broken access control, leaked API keys, authentication bypass. Glook checks static security posture: CSP, HSTS, SSL Labs TLS grading, cookie flags, open .env exposure, SPF/DMARC/CAA. VibeEval\'s dynamic attack simulation is unique; Glook\'s advantage is covering security alongside SEO, AI visibility, and performance in one scan.',
      },
      {
        q: 'Should I use both VibeEval and Glook?',
        a: 'They complement each other. VibeEval for runtime attack simulation on apps with complex auth flows. Glook for static security posture, AI visibility, SEO health, and performance — all in one cloud-based report with AI fix prompts.',
      },
    ],
  },

  shipsecure: {
    slug: 'shipsecure',
    name: 'ShipSecure.io',
    tagline: 'Freemium security scanner with AI fix prompts for solo developers',
    pricingRange: 'Freemium',
    whyWins: [
      'AI visibility coverage ShipSecure doesn\'t have — llms.txt, per-bot crawler access (GPTBot, ClaudeBot, PerplexityBot), schema.org, trust signals (G2, GitHub, Product Hunt).',
      'SEO + performance included — full meta/OG audit, Lighthouse mobile scores, Core Web Vitals. ShipSecure is security-only.',
      '90+ checks vs ~20 — SSL Labs TLS grading, OSV vulnerability database, CrUX real-world data, DNS security (SPF/DMARC/CAA), cookie flags, per-bot AI crawler access.',
    ],
    verdict: 'ShipSecure fixes security. Glook fixes security, SEO, performance, and AI visibility — in one scan with more checks and a lower price.',
    features: [
      { label: 'AI visibility checks', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'llms.txt + AI crawler validation', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Trust signals (G2, GitHub, PH)', category: 'AI Visibility', shipready: true, competitor: false },
      { label: 'Security header audit', category: 'Security', shipready: true, competitor: true },
      { label: 'SSL/TLS grade (SSL Labs)', category: 'Security', shipready: true, competitor: false },
      { label: 'Cookie security flags', category: 'Security', shipready: true, competitor: true },
      { label: 'Open .env / secrets detection', category: 'Security', shipready: true, competitor: true },
      { label: 'OSV vulnerability database', category: 'Security', shipready: true, competitor: false },
      { label: 'SEO audit', category: 'SEO', shipready: true, competitor: false },
      { label: 'Lighthouse performance audit', category: 'Performance', shipready: true, competitor: false },
      { label: 'AI fix prompts (Cursor, Claude)', category: 'Usability', shipready: true, competitor: true },
      { label: 'Free tier (no card)', category: 'Pricing', shipready: true, competitor: true },
      { label: 'Price/month (Pro)', category: 'Pricing', shipready: '$14', competitor: 'Freemium (limited)' },
    ],
    weaknesses: [
      'Security-only — no SEO, AI visibility, or performance audit',
      'No AI visibility checks — llms.txt, per-bot crawlers, trust signals absent',
      'No Lighthouse performance audit',
      'No SSL Labs TLS grading — basic HTTPS check only',
      'No OSV vulnerability database integration',
    ],
    faq: [
      {
        q: 'ShipSecure is free — why use Glook?',
        a: 'ShipSecure covers security checks and generates AI fix prompts — similar to Glook\'s security module. Glook also covers AI visibility (llms.txt, per-bot crawler access, trust signals), full SEO audit (title, meta, OG, canonical, schema.org), Lighthouse performance, and Core Web Vitals. If security is your only concern, ShipSecure works. For a complete site audit, Glook covers 90+ checks across 6 categories.',
      },
      {
        q: 'What security checks does Glook have that ShipSecure doesn\'t?',
        a: 'Glook adds SSL Labs TLS grading (A+ to F score), OSV vulnerability database check for known CVEs in detected JS libraries, DNS security checks (SPF, DMARC, CAA records), and CrUX real-world performance data. Both tools check security headers and exposed secrets.',
      },
    ],
  },
}

export const competitorSlugs = [
  'ahrefs',
  'screaming-frog',
  'semrush',
  'se-ranking',
  'otterly',
  'google-pagespeed',
  'gtmetrix',
  'securityheaders',
  'mozilla-observatory',
  'hubspot-aeo',
  'cheeeck',
  'moz-pro',
  'sitebulb',
  'rankscale',
  'peec',
  'profound',
  'vibeeval',
  'shipsecure',
] as const
