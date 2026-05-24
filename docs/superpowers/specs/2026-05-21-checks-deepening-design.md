# Checks Deepening — Design Spec

> Date: 2026-05-21
> Status: approved
> Implemented after: `docs/feature-plans/2026-05-21-product-evolution.md`

---

## Goal

Углубить проверки ShipReady по трём категориям (Security, SEO, AI Visibility) чтобы покрыть gaps относительно конкурентов и рыночных трендов. Все новые проверки следуют существующей quality contract: confidence model, evidence, scoreEligible.

## Two-file output

- `docs/feature-plans/checks-deepening-main.md` — 3 фазы по уровню сложности
- `docs/feature-plans/checks-deepening-deferred.md` — платные API и сложные интеграции

---

## Phase 1 — Zero dependencies (Node built-ins + existing packages)

All checks go into Fast Truth Pass. No new npm packages. All use `dns.promises`, `cheerio`, or already-fetched data.

### Security additions (`lib/checks/security.ts`)

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `missing-spf` | SPF record missing via dns.promises TXT | verified | true |
| `missing-dmarc` | DMARC record missing / `p=none` | verified | true |
| `weak-dmarc-policy` | DMARC exists but `p=none` (no enforcement) | likely | false |
| `missing-caa` | CAA record missing | heuristic | false |
| `cookie-missing-secure` | Set-Cookie without Secure flag | verified | true |
| `cookie-missing-httponly` | Set-Cookie without HttpOnly on session cookies | verified | true |
| `cookie-missing-samesite` | Set-Cookie without SameSite | likely | false |
| `exposed-git-head` | `/.git/HEAD` returns 200 | verified | true |
| `exposed-source-map` | `.map` file accessible from `sourceMappingURL` | verified | true |
| `graphql-introspection-open` | `?query={__schema{types{name}}}` returns schema | verified | true |

### AI Visibility additions (`lib/checks/ai-visibility.ts`)

| Check ID | What | Confidence | scoreEligible |
|---|---|---|---|
| `oai-searchbot-blocked` | OAI-SearchBot blocked in robots.txt | verified | true |
| `claudebot-blocked` | ClaudeBot / anthropic-ai blocked | verified | true |
| `perplexitybot-blocked` | PerplexityBot blocked | verified | true |
| `deepseekbot-blocked` | DeepSeekBot blocked | heuristic | false |
| `llms-txt-no-description` | llms.txt exists but has no product description | likely | false |
| `llms-txt-broken-links` | llms.txt references URLs that return non-200 | likely | false |
| `llms-txt-no-sections` | llms.txt has no structured sections (##) | heuristic | false |

Note: existing `ai-crawlers-blocked` check is REPLACED by individual per-bot checks. The summary issue is removed to avoid double-penalising. Per-bot issues are shown in AI Visibility category with individual evidence.

---

## Phase 2 — Light npm (3–4 new packages)

Checks go into Fast Truth Pass where cheerio-based, Deep Pass where heavier.

New packages: `fast-xml-parser`, `jsonld` (or custom JSON-LD validator), `robots-parser` (verify if already installed).

### SEO additions (`lib/checks/seo.ts`)

| Check ID | What | Confidence | scoreEligible | Pass |
|---|---|---|---|---|
| `sitemap-empty` | sitemap.xml exists but has 0 URLs | verified | true | Fast |
| `sitemap-lastmod-stale` | All lastmod dates > 6 months ago | heuristic | false | Fast |
| `sitemap-url-not-canonical` | Sitemap URLs differ from canonical | likely | false | Fast |
| `robots-no-sitemap-directive` | robots.txt has no `Sitemap:` line | verified | true | Fast |
| `robots-disallow-all` | `Disallow: /` for Googlebot or `*` | verified | true | Fast |

### AI Visibility additions (`lib/checks/ai-visibility.ts`)

| Check ID | What | Confidence | scoreEligible | Pass |
|---|---|---|---|---|
| `no-semantic-html` | No `<main>`, `<article>`, `<section>` in body | likely | false | Fast |
| `content-js-only` | Body text < 100 words in raw HTML (JS-rendered) | likely | true | Fast | Note: product evolution adds `spa-no-ssr` (React root + < 50 words). This check is broader: catches any CMS/framework thin HTML, not only SPA roots. Not a duplicate — different detection logic and broader applicability. |
| `no-organization-sameas` | Organization schema exists but no `sameAs` links | heuristic | false | Fast |
| `no-about-contact-page` | No internal links to /about or /contact | heuristic | false | Fast |
| `schema-missing-required-fields` | Detected schema type missing required fields | likely | true | Deep |

---

## Phase 3 — Free external APIs + AI layer

These are free APIs (no cost) or existing OpenAI budget. Deep Pass or Enrichment Pass.

### Security (`lib/checks/security.ts`)

| Check ID | API | What | Pass |
|---|---|---|---|
| `tls-old-protocol` | SSL Labs API (free) | TLS 1.0 / 1.1 detected | Deep |
| `tls-weak-cipher` | SSL Labs API (free) | Weak cipher suite | Deep |
| `tls-grade-low` | SSL Labs API (free) | SSL Labs grade below A | Deep |

SSL Labs caveat: API response can take 5–30 seconds on first assessment. Implementation must use `AbortSignal.timeout(35_000)` and return `measurement: 'unavailable'` on timeout — never block scan completion.
| `vulnerable-js-lib` | OSV API (free, Google) | Detected JS lib version has known CVE | Deep |

OSV dependency: requires tech fingerprint (JS lib names + versions) detected earlier in Deep Pass via `<script src>` pattern matching. OSV query runs after fingerprint is available, before enrichment.

### Performance (`lib/checks/performance or index.ts`)

| Check ID | API | What | Pass |
|---|---|---|---|
| `crux-lcp-poor` | PSI API (free Google key) | Field LCP p75 > 4s from real users | Deep |
| `crux-cls-poor` | PSI API (free Google key) | Field CLS p75 > 0.25 | Deep |
| `crux-inp-poor` | PSI API (free Google key) | Field INP p75 > 500ms | Deep |

Note: CrUX data is only available for sites with sufficient traffic. Falls back to `unavailable` measurement state if no field data.

### AI Visibility — AI Enrichment layer (OpenAI, existing budget)

| Feature | What | Tier | Pass |
|---|---|---|---|
| Content citability score | AI analyses text for facts, tables, FAQ patterns, datePublished | Pro | Enrichment |
| Answer Gap analysis | "For this site's niche, what content gaps reduce AI citation?" | Pro wow-insight | Enrichment |

These use the existing `generate-evidence-enrichment.ts` call structure. Answer Gap becomes a second Pro-only enrichment call (~$0.02 extra).

---

## Scan flow integration summary

| Phase | Pass | Why |
|---|---|---|
| Phase 1 checks | Fast Truth Pass | dns.promises / existing headers / cheerio on loaded HTML |
| Phase 2 SEO/HTML checks | Fast Truth Pass | XML parse / cheerio |
| Phase 2 schema validation | Deep Pass | jsonld parser is heavier |
| Phase 3 SSL Labs / OSV / PSI | Deep Pass | External async calls |
| Phase 3 AI layer | Enrichment Pass | OpenAI calls |

---

## Deferred file covers

- Ahrefs API — backlinks, keyword data (paid)
- Semrush API — SEO/PPC data (paid)
- DataForSEO — SERP data, rank tracking (paid)
- Google Search Console OAuth — complex integration, requires domain ownership
- Bing Webmaster Tools — complex integration
- OWASP ZAP active scan — requires domain verification, legal constraints
- NVD + EPSS pipeline — full CVE scoring with exploit probability (complex, free but heavy)
- MCP Server Cards (`/.well-known/mcp.json`) — emerging standard, not yet adopted
- Agent Analytics via Vercel CDN — separate product tier (Promptwatch-style)

---

## Success criteria

- Phase 1 ships: +10 new verified checks with zero new dependencies
- Phase 2 ships: sitemap/robots/schema quality visible in report
- Phase 3 ships: SSL grade, real CrUX data, CVE alerts in Deep Pass
- All new checks have `confidence`, `evidence[]`, and `scoreEligible` set correctly
- No new check silently passes on fetch failure — must use `unavailable` measurement state
