# Checks Deepening — Main Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Углубить проверки ShipReady по трём категориям — Security, SEO, AI Visibility — добавив 25+ новых checks в три фазы по уровню сложности, без нарушения существующей quality contract (confidence/evidence/scoreEligible).

**Architecture:** Все новые проверки встраиваются в существующие файлы `lib/checks/security.ts`, `lib/checks/seo.ts`, `lib/checks/ai-visibility.ts` по тому же паттерну: шаблон в `lib/ai/issue-templates.ts` → запись в `CONFIDENCE_MAP` в `lib/checks/issue-meta.ts` → логика в check-файле. Phase 1 — только Node built-ins и уже установленные пакеты (Fast Truth Pass). Phase 2 — 2 новых npm пакета. Phase 3 — существующие провайдеры PSI и новые бесплатные API (SSL Labs, OSV).

**Prerequisite:** `docs/feature-plans/2026-05-21-product-evolution.md` должен быть полностью реализован перед стартом этого плана. Он добавляет `per-platform AI readiness` (Task 4.1) — этот план его расширяет, не дублирует.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Node `dns.promises`, cheerio (already installed), `fast-xml-parser` (new), `robots-parser` (new), SSL Labs API (free), OSV API (free), PSI API (already wired in `lib/providers/pagespeed.ts`), OpenAI (existing)

---

## File Map

### Phase 1 — Zero deps
- **Modify:** `lib/ai/issue-templates.ts` — add 17 new templates
- **Modify:** `lib/checks/issue-meta.ts` — add 17 new CONFIDENCE_MAP entries
- **Modify:** `lib/checks/security.ts` — DNS checks, cookie flags, expanded path probes
- **Modify:** `lib/checks/ai-visibility.ts` — replace `ai-crawlers-blocked` with per-bot checks, llms.txt validation

### Phase 2 — Light npm
- **Modify:** `package.json` — add `fast-xml-parser`, `robots-parser`
- **Modify:** `lib/checks/seo.ts` — sitemap quality, robots.txt quality
- **Modify:** `lib/checks/ai-visibility.ts` — semantic HTML, schema required fields
- **Modify:** `lib/ai/issue-templates.ts` — add 8 new templates
- **Modify:** `lib/checks/issue-meta.ts` — add 8 new entries

### Phase 3 — Free APIs + AI layer
- **Create:** `lib/providers/ssllabs.ts` — SSL Labs API client
- **Create:** `lib/providers/osv.ts` — OSV CVE lookup client
- **Modify:** `lib/checks/security.ts` — TLS checks from SSL Labs, CVE issues from OSV
- **Modify:** `lib/checks/index.ts` — wire SSL Labs + OSV in Deep Pass, wire CrUX issues from existing PSI data, wire Pro AI content checks
- **Modify:** `lib/ai/issue-templates.ts` — add 5 new templates
- **Modify:** `lib/checks/issue-meta.ts` — add 5 new entries
- **Modify:** `lib/ai/generate-evidence-enrichment.ts` — add content citability + answer gap for Pro

---

## Phase 1: Zero Dependencies

### Task 1.1: Add DNS/email security issue templates and CONFIDENCE_MAP entries

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, find the `// SECURITY` section and add after the last security entry:

```typescript
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
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add to the `CONFIDENCE_MAP` object before the closing `}`:

```typescript
  'missing-spf': { confidence: 'verified', scoreEligible: true },
  'missing-dmarc': { confidence: 'verified', scoreEligible: true },
  'weak-dmarc-policy': { confidence: 'likely', scoreEligible: false },
  'missing-caa': { confidence: 'heuristic', scoreEligible: false },
```

- [ ] **Step 3:** Run build to verify no type errors:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Expected: no output (no type errors).

- [ ] **Step 4:** Commit:

```bash
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add DNS/email security issue templates (SPF, DMARC, CAA)"
```

---

### Task 1.2: Add cookie security issue templates

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add after the CAA entry from Task 1.1:

```typescript
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
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'cookie-missing-secure': { confidence: 'verified', scoreEligible: true },
  'cookie-missing-httponly': { confidence: 'verified', scoreEligible: true },
  'cookie-missing-samesite': { confidence: 'likely', scoreEligible: false },
```

- [ ] **Step 3:** Build check:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 4:** Commit:

```bash
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add cookie security issue templates (Secure, HttpOnly, SameSite)"
```

---

### Task 1.3: Add exposed path issue templates

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add:

```typescript
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
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'exposed-git-head': { confidence: 'verified', scoreEligible: true },
  'exposed-source-map': { confidence: 'verified', scoreEligible: true },
  'graphql-introspection-open': { confidence: 'verified', scoreEligible: true },
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: add exposed path issue templates (git, source maps, GraphQL introspection)"
```

---

### Task 1.4: Implement DNS/email checks in security.ts

**Files:**
- Modify: `lib/checks/security.ts`

DNS checks use Node's built-in `dns.promises`. They run in Fast Truth Pass alongside existing header checks.

- [ ] **Step 1:** At the top of `lib/checks/security.ts`, add the dns import after the existing imports:

```typescript
import { promises as dns } from 'dns'
```

- [ ] **Step 2:** Add a DNS helper function after the existing `looksLikeEnvFile` function:

```typescript
async function resolveTxt(hostname: string): Promise<string[][]> {
  try {
    return await dns.resolveTxt(hostname)
  } catch {
    return []
  }
}
```

- [ ] **Step 3:** Inside `runSecurityChecks`, after the `missing-permissions-policy` check (around line 146 of the original file), add:

```typescript
    // ── DNS / Email security checks ─────────────────────────────
    const domain = new URL(url).hostname
    // Strip www. to check the apex domain
    const apexDomain = domain.startsWith('www.') ? domain.slice(4) : domain

    // SPF check
    const txtRecords = await resolveTxt(apexDomain)
    const spfRecord = txtRecords.flat().find(r => r.startsWith('v=spf1'))
    if (!spfRecord) {
      issues.push(withIssueMeta(
        { ...T['missing-spf'] },
        'http',
        [evidence('text', 'SPF record', 'not found'), evidence('text', 'Domain', apexDomain)],
      ))
    }

    // DMARC check
    const dmarcRecords = await resolveTxt(`_dmarc.${apexDomain}`)
    const dmarcRecord = dmarcRecords.flat().find(r => r.startsWith('v=DMARC1'))
    if (!dmarcRecord) {
      issues.push(withIssueMeta(
        { ...T['missing-dmarc'] },
        'http',
        [evidence('text', 'DMARC record', 'not found'), evidence('text', 'Checked', `_dmarc.${apexDomain}`)],
      ))
    } else {
      const policyMatch = dmarcRecord.match(/p=(\w+)/i)
      const policy = policyMatch?.[1]?.toLowerCase()
      if (policy === 'none') {
        issues.push(withIssueMeta(
          { ...T['weak-dmarc-policy'], value: 'p=none' },
          'http',
          [evidence('text', 'DMARC record', dmarcRecord.slice(0, 80)), evidence('text', 'Policy', 'none (monitoring only)')],
        ))
      }
    }

    // CAA check (heuristic — non-fatal if missing)
    const caaRecords = await resolveTxt(apexDomain).catch(() => [])
    const hasCaa = caaRecords.flat().some(r => r.includes('issue') || r.includes('issuewild'))
    // CAA records are type CAA not TXT — use resolveCaa
    let caaFound = false
    try {
      const caa = await dns.resolveCaa(apexDomain)
      caaFound = caa.length > 0
    } catch {
      caaFound = false
    }
    if (!caaFound && !hasCaa) {
      issues.push(withIssueMeta(
        { ...T['missing-caa'] },
        'http',
        [evidence('text', 'CAA record', 'not found'), evidence('text', 'Domain', apexDomain)],
      ))
    }
```

- [ ] **Step 4:** Build:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Expected: no errors.

- [ ] **Step 5:** Quick sanity — run against a real domain locally to confirm DNS resolves (not a test, just verify no crash):

```bash
# In dev: POST to /api/scan with a URL that has a known SPF record (e.g., github.com)
# Check scanner logs for no errors in DNS block
```

- [ ] **Step 6:** Commit:

```bash
git add lib/checks/security.ts
git commit -m "feat: DNS email security checks — SPF, DMARC policy, CAA"
```

---

### Task 1.5: Implement cookie flag checks in security.ts

**Files:**
- Modify: `lib/checks/security.ts`

Cookie flags come from `Set-Cookie` response headers. They're already in `context.headers`.

- [ ] **Step 1:** In `lib/checks/security.ts`, inside `runSecurityChecks`, after the DMARC/CAA block from Task 1.4, add:

```typescript
    // ── Cookie security flags ────────────────────────────────────
    // Headers object supports getSetCookie() in Node 18+, fall back to get()
    const rawSetCookies: string[] = (() => {
      if (typeof (headers as Record<string, unknown>).getSetCookie === 'function') {
        return (headers as unknown as { getSetCookie(): string[] }).getSetCookie()
      }
      const single = headers.get('set-cookie')
      return single ? [single] : []
    })()

    if (rawSetCookies.length > 0) {
      const cookiesWithoutSecure = rawSetCookies.filter(c => !/;\s*secure/i.test(c))
      const cookiesWithoutHttpOnly = rawSetCookies.filter(c => !/;\s*httponly/i.test(c))
      const cookiesWithoutSameSite = rawSetCookies.filter(c => !/;\s*samesite=/i.test(c))

      if (cookiesWithoutSecure.length > 0) {
        issues.push(withIssueMeta(
          { ...T['cookie-missing-secure'], value: `${cookiesWithoutSecure.length} cookie(s)` },
          'http',
          [evidence('count', 'Cookies without Secure flag', cookiesWithoutSecure.length)],
        ))
      }

      if (cookiesWithoutHttpOnly.length > 0) {
        issues.push(withIssueMeta(
          { ...T['cookie-missing-httponly'], value: `${cookiesWithoutHttpOnly.length} cookie(s)` },
          'http',
          [evidence('count', 'Cookies without HttpOnly flag', cookiesWithoutHttpOnly.length)],
        ))
      }

      if (cookiesWithoutSameSite.length > 0) {
        issues.push(withIssueMeta(
          { ...T['cookie-missing-samesite'], value: `${cookiesWithoutSameSite.length} cookie(s)` },
          'http',
          [evidence('count', 'Cookies without SameSite', cookiesWithoutSameSite.length)],
        ))
      }
    }
```

- [ ] **Step 2:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/checks/security.ts
git commit -m "feat: cookie security flag checks (Secure, HttpOnly, SameSite)"
```

---

### Task 1.6: Implement expanded sensitive path probes

**Files:**
- Modify: `lib/checks/security.ts`

This expands the existing `SENSITIVE_FILES` probe pattern to cover `.git/HEAD`, source maps (from `sourceMappingURL`), and GraphQL introspection.

- [ ] **Step 1:** In `lib/checks/security.ts`, replace the existing `SENSITIVE_FILES` constant:

```typescript
// BEFORE:
const SENSITIVE_FILES = ['.env', '.env.local', '.env.production', '.git/config']

// AFTER:
const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.git/config',
  '.DS_Store',
]
```

- [ ] **Step 2:** After the existing `exposedFile` probe block (around line 112 of the original), add:

```typescript
    // ── .git/HEAD probe ──────────────────────────────────────────
    try {
      const gitHeadRes = await fetchSafeResource(`${origin}/.git/HEAD`, { signal: AbortSignal.timeout(2500) })
      if (gitHeadRes.status === 200) {
        const gitHeadText = await gitHeadRes.text()
        if (gitHeadText.startsWith('ref:') || /^[0-9a-f]{40}/m.test(gitHeadText)) {
          issues.push(withIssueMeta(
            { ...T['exposed-git-head'] },
            'http',
            [
              evidence('response', '/.git/HEAD status', 200),
              evidence('text', 'Content preview', gitHeadText.slice(0, 40).trim()),
            ],
          ))
        }
      }
    } catch {
      // non-fatal
    }

    // ── Source map probe ─────────────────────────────────────────
    // Find sourceMappingURL in HTML scripts
    const sourceMappingMatch = html.match(/sourceMappingURL=([^\s"']+\.map)/)
    if (sourceMappingMatch) {
      const mapPath = sourceMappingMatch[1]
      const mapUrl = mapPath.startsWith('http') ? mapPath : `${origin}/${mapPath.replace(/^\//, '')}`
      try {
        const safeMapUrl = new URL(mapUrl)
        if (safeMapUrl.origin === origin) {
          const mapRes = await fetchSafeResource(mapUrl, { signal: AbortSignal.timeout(2500) })
          if (mapRes.status === 200) {
            const mapText = await mapRes.text()
            // Confirm it's actually a source map
            if (mapText.includes('"sources"') || mapText.includes('"sourceRoot"')) {
              issues.push(withIssueMeta(
                { ...T['exposed-source-map'], value: mapPath },
                'http',
                [
                  evidence('response', 'Source map status', 200),
                  evidence('text', 'Map URL', mapUrl.replace(origin, '')),
                ],
              ))
            }
          }
        }
      } catch {
        // non-fatal
      }
    }

    // ── GraphQL introspection probe ──────────────────────────────
    const gqlPaths = ['/graphql', '/api/graphql', '/v1/graphql']
    const introspectionQuery = encodeURIComponent('{ __schema { types { name } } }')

    for (const gqlPath of gqlPaths) {
      try {
        const gqlRes = await fetchSafeResource(
          `${origin}${gqlPath}?query=${introspectionQuery}`,
          { signal: AbortSignal.timeout(3000) },
        )
        if (gqlRes.status === 200) {
          const gqlBody = await gqlRes.json().catch(() => null)
          if (gqlBody?.data?.__schema?.types) {
            issues.push(withIssueMeta(
              { ...T['graphql-introspection-open'], value: gqlPath },
              'http',
              [
                evidence('response', 'GraphQL introspection status', 200),
                evidence('text', 'Endpoint', gqlPath),
              ],
            ))
            break
          }
        }
      } catch {
        // non-fatal
      }
    }
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/checks/security.ts
git commit -m "feat: expand sensitive path probes (.git/HEAD, source maps, GraphQL introspection)"
```

---

### Task 1.7: Add per-bot AI crawler issue templates

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

The existing `ai-crawlers-blocked` check is a single summary issue. This task adds per-bot templates. The old check is removed in Task 1.8.

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add a new section after the existing AI Visibility entries:

```typescript
  // ── Per-bot AI crawler blocked ─────────────────────────────────

  'oai-searchbot-blocked': {
    id: 'oai-searchbot-blocked',
    category: 'ai_visibility',
    severity: 'high',
    title: 'OAI-SearchBot is blocked in robots.txt',
    description: 'OAI-SearchBot (ChatGPT web search crawler) is disallowed in robots.txt.',
    plainEnglish: 'ChatGPT\'s search crawler cannot index your site. When users ask ChatGPT questions, your site will not appear in answers even if it\'s relevant.',
    fixPrompt: 'In your robots.txt, add an explicit Allow for OAI-SearchBot:\n  User-agent: OAI-SearchBot\n  Allow: /\nNote: OAI-SearchBot is the search crawler (for ChatGPT answers). GPTBot is the training crawler. You can block GPTBot while allowing OAI-SearchBot if you want.',
    docsUrl: 'https://platform.openai.com/docs/bots/overview',
  },

  'gptbot-blocked': {
    id: 'gptbot-blocked',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'GPTBot is blocked in robots.txt',
    description: 'GPTBot (ChatGPT training crawler) is disallowed in robots.txt.',
    plainEnglish: 'GPTBot trains ChatGPT\'s knowledge. Blocking it means your content won\'t be included in future ChatGPT model training. This may or may not be intentional.',
    fixPrompt: 'If you want your content in future ChatGPT models, remove the GPTBot disallow:\n  # Remove this:\n  User-agent: GPTBot\n  Disallow: /\n\nIf you intentionally blocked training (but want search), keep GPTBot blocked and only allow OAI-SearchBot.',
  },

  'claudebot-blocked': {
    id: 'claudebot-blocked',
    category: 'ai_visibility',
    severity: 'high',
    title: 'ClaudeBot is blocked in robots.txt',
    description: 'ClaudeBot or anthropic-ai user-agent is disallowed in robots.txt.',
    plainEnglish: 'Anthropic\'s crawler cannot read your site. Claude will not be able to cite your content in answers.',
    fixPrompt: 'In your robots.txt, allow ClaudeBot:\n  User-agent: ClaudeBot\n  Allow: /\n  User-agent: anthropic-ai\n  Allow: /',
    docsUrl: 'https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-the-web-and-how-can-site-owners-block-the-crawler',
  },

  'perplexitybot-blocked': {
    id: 'perplexitybot-blocked',
    category: 'ai_visibility',
    severity: 'high',
    title: 'PerplexityBot is blocked in robots.txt',
    description: 'PerplexityBot is disallowed in robots.txt.',
    plainEnglish: 'Perplexity AI\'s crawler cannot read your site. You won\'t appear in Perplexity search answers.',
    fixPrompt: 'In your robots.txt, allow PerplexityBot:\n  User-agent: PerplexityBot\n  Allow: /',
  },

  'deepseekbot-blocked': {
    id: 'deepseekbot-blocked',
    category: 'ai_visibility',
    severity: 'low',
    title: 'DeepSeekBot is blocked in robots.txt',
    description: 'DeepSeekBot user-agent is disallowed in robots.txt.',
    plainEnglish: 'DeepSeek\'s crawler is blocked. DeepSeek is an emerging AI assistant with a growing user base.',
    fixPrompt: 'If you want your content visible in DeepSeek answers:\n  User-agent: DeepSeekBot\n  Allow: /',
  },
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'oai-searchbot-blocked': { confidence: 'verified', scoreEligible: true },
  'gptbot-blocked': { confidence: 'verified', scoreEligible: false },
  'claudebot-blocked': { confidence: 'verified', scoreEligible: true },
  'perplexitybot-blocked': { confidence: 'verified', scoreEligible: true },
  'deepseekbot-blocked': { confidence: 'heuristic', scoreEligible: false },
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: per-bot AI crawler blocked templates (OAI-SearchBot, ClaudeBot, PerplexityBot, DeepSeekBot)"
```

---

### Task 1.8: Replace ai-crawlers-blocked with per-bot checks in ai-visibility.ts

**Files:**
- Modify: `lib/checks/ai-visibility.ts`

This replaces the single `ai-crawlers-blocked` block with individual per-bot issues. The `parseRobotsBlock` function already exists in the file.

- [ ] **Step 1:** In `lib/checks/ai-visibility.ts`, find the block that starts with:

```typescript
  const aiCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'anthropic-ai']
  let robotsTxt: string | null = null
  try {
    const { fetchSafeResource: fetchSafeResourceRobots } = await import('@/lib/checks/fetch-context')
    const robotsRes = await fetchSafeResourceRobots(`${origin}/robots.txt`, { signal: AbortSignal.timeout(2500) })
    if (robotsRes.ok) {
      robotsTxt = await robotsRes.text()
      const blocked = aiCrawlers.filter(bot => parseRobotsBlock(robotsTxt!, bot))
      if (blocked.length > 0) {
        issues.push(withIssueMeta({
          id: 'ai-crawlers-blocked',
          ...
        }
```

Replace the entire block (everything from `const aiCrawlers = ` through the closing `}` of the robots.txt fetch try/catch) with:

```typescript
  let robotsTxt: string | null = null
  try {
    const { fetchSafeResource: fetchSafeResourceRobots } = await import('@/lib/checks/fetch-context')
    const robotsRes = await fetchSafeResourceRobots(`${origin}/robots.txt`, { signal: AbortSignal.timeout(2500) })
    if (robotsRes.ok) {
      robotsTxt = await robotsRes.text()

      // Per-bot individual checks (replace old summary ai-crawlers-blocked)
      const perBotChecks: Array<{ bot: string | string[]; issueId: string; label: string }> = [
        { bot: 'OAI-SearchBot', issueId: 'oai-searchbot-blocked', label: 'OAI-SearchBot' },
        { bot: 'GPTBot', issueId: 'gptbot-blocked', label: 'GPTBot' },
        { bot: ['ClaudeBot', 'anthropic-ai'], issueId: 'claudebot-blocked', label: 'ClaudeBot' },
        { bot: 'PerplexityBot', issueId: 'perplexitybot-blocked', label: 'PerplexityBot' },
        { bot: 'DeepSeekBot', issueId: 'deepseekbot-blocked', label: 'DeepSeekBot' },
      ]

      for (const { bot, issueId, label } of perBotChecks) {
        const bots = Array.isArray(bot) ? bot : [bot]
        const isBlocked = bots.some(b => parseRobotsBlock(robotsTxt!, b))
        if (isBlocked) {
          // Skip DeepSeekBot if includeHeuristics is false
          if (issueId === 'deepseekbot-blocked' && !includeHeuristics) continue
          issues.push(withIssueMeta(
            { ...T[issueId] },
            'ai-visibility',
            [evidence('text', `${label} in robots.txt`, 'Disallow: /')],
          ))
        }
      }
    }
  } catch {
    // ignore robots fetch failures
  }
```

- [ ] **Step 2:** Also remove the `no-explicit-ai-crawlers` block that comes after the robots.txt fetch (the `if (includeHeuristics && robotsTxt)` check for `hasExplicitAiCrawlers`). The per-bot checks now provide the same signal more specifically.

Find and delete:
```typescript
  if (includeHeuristics && robotsTxt) {
    const hasExplicitAiCrawlers = /GPTBot|OAI-SearchBot|ClaudeBot|PerplexityBot/i.test(robotsTxt)
    if (!hasExplicitAiCrawlers) {
      issues.push(withIssueMeta(
        { ...T['no-explicit-ai-crawlers'] },
        ...
      ))
    }
  }
```

- [ ] **Step 3:** Build:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 4:** Verify `ai-crawlers-blocked` is not referenced anywhere:

```bash
grep -rn "ai-crawlers-blocked\|no-explicit-ai-crawlers" lib/ --include="*.ts"
```

Expected: no output (both removed).

- [ ] **Step 5:** Commit:

```bash
git add lib/checks/ai-visibility.ts
git commit -m "feat: replace ai-crawlers-blocked with per-bot checks (OAI-SearchBot, ClaudeBot, PerplexityBot, DeepSeekBot)"
```

---

### Task 1.9: Add llms.txt validation issue templates and logic

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`
- Modify: `lib/checks/ai-visibility.ts`

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add:

```typescript
  'llms-txt-no-description': {
    id: 'llms-txt-no-description',
    category: 'ai_visibility',
    severity: 'medium',
    title: 'llms.txt has no product description',
    description: 'llms.txt file exists but contains no product description (> blockquote or description text).',
    plainEnglish: 'Your llms.txt exists but doesn\'t explain what your product is. AI systems use the description to understand your site context.',
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
    plainEnglish: 'Your llms.txt lists pages that don\'t load. AI systems following these links will hit dead ends.',
    fixPrompt: 'Audit your llms.txt and remove or fix any broken URLs. Run: curl -I <url> for each listed URL to verify.',
  },
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'llms-txt-no-description': { confidence: 'likely', scoreEligible: false },
  'llms-txt-no-sections': { confidence: 'heuristic', scoreEligible: false },
  'llms-txt-broken-links': { confidence: 'likely', scoreEligible: false },
```

- [ ] **Step 3:** In `lib/checks/ai-visibility.ts`, find the block that handles `llmsTxtBody` (after the `missing-llms-txt` check, around line 199):

```typescript
  if (llmsTxtBody && includeHeuristics) {
    const wordCount = llmsTxtBody.trim().split(/\s+/).length
    if (wordCount < 100) {
      issues.push(withIssueMeta(
        { ...T['thin-llms-txt'], value: `${wordCount} words` },
        ...
```

After the `thin-llms-txt` block, add:

```typescript
  if (llmsTxtBody && includeLikely) {
    // Description check: look for > blockquote line (llmstxt.org spec)
    const hasDescription = /^>\s+\S/m.test(llmsTxtBody)
    if (!hasDescription) {
      issues.push(withIssueMeta(
        { ...T['llms-txt-no-description'] },
        'http',
        [evidence('text', 'llms.txt', 'no > description line found')],
      ))
    }

    // Sections check
    if (includeHeuristics) {
      const hasSections = /^##\s+\S/m.test(llmsTxtBody)
      if (!hasSections) {
        issues.push(withIssueMeta(
          { ...T['llms-txt-no-sections'] },
          'http',
          [evidence('text', 'llms.txt', 'no ## section headings found')],
        ))
      }
    }

    // Broken links check — extract markdown links [text](url) and bare https:// URLs
    const urlPattern = /\]\((https?:\/\/[^)]+)\)|^-\s+(https?:\/\/\S+)/gm
    const linkedUrls: string[] = []
    let urlMatch: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((urlMatch = urlPattern.exec(llmsTxtBody)) !== null) {
      const found = urlMatch[1] ?? urlMatch[2]
      if (found) linkedUrls.push(found)
    }

    // Only check up to 5 URLs to avoid slow scans
    const urlsToCheck = linkedUrls.slice(0, 5)
    const brokenUrls: string[] = []
    for (const linkedUrl of urlsToCheck) {
      try {
        const { fetchSafeResource: fetchCheck } = await import('@/lib/checks/fetch-context')
        const res = await fetchCheck(linkedUrl, { signal: AbortSignal.timeout(2500) })
        if (!res.ok) brokenUrls.push(linkedUrl)
      } catch {
        brokenUrls.push(linkedUrl)
      }
    }

    if (brokenUrls.length > 0) {
      issues.push(withIssueMeta(
        { ...T['llms-txt-broken-links'], value: `${brokenUrls.length} broken` },
        'http',
        [
          evidence('count', 'Broken links in llms.txt', brokenUrls.length),
          evidence('text', 'First broken URL', brokenUrls[0].slice(0, 80)),
        ],
      ))
    }
  }
```

- [ ] **Step 4:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts lib/checks/ai-visibility.ts
git commit -m "feat: llms.txt validation checks (description, sections, broken links)"
```

---

## Phase 2: Light npm Packages

### Task 2.1: Install new packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1:** Install packages:

```bash
npm install fast-xml-parser robots-parser
npm install --save-dev @types/robots-parser
```

- [ ] **Step 2:** Verify installation:

```bash
cat package.json | grep -E '"fast-xml-parser|robots-parser"'
```

Expected: both packages appear with version numbers.

- [ ] **Step 3:** Build to confirm no conflicts:

```bash
npm run build 2>&1 | grep -E "error TS|error:" | head -10
```

- [ ] **Step 4:** Commit:

```bash
git add package.json package-lock.json
git commit -m "chore: install fast-xml-parser and robots-parser for Phase 2 checks"
```

---

### Task 2.2: Add sitemap and robots quality issue templates

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add SEO quality templates:

```typescript
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
    plainEnglish: 'Your sitemap\'s last-modified dates are old. Search engines use these to decide how often to recrawl — stale dates suggest the site isn\'t updated.',
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
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'sitemap-empty': { confidence: 'verified', scoreEligible: true },
  'sitemap-lastmod-stale': { confidence: 'heuristic', scoreEligible: false },
  'robots-no-sitemap-directive': { confidence: 'verified', scoreEligible: true },
  'robots-disallow-all': { confidence: 'verified', scoreEligible: true },
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: sitemap and robots quality issue templates"
```

---

### Task 2.3: Implement sitemap quality checks in seo.ts

**Files:**
- Modify: `lib/checks/seo.ts`

The sitemap.xml is already fetched in `lib/checks/ai-visibility.ts`. In seo.ts we do a separate parse for quality analysis.

- [ ] **Step 1:** Add import at the top of `lib/checks/seo.ts`:

```typescript
import { XMLParser } from 'fast-xml-parser'
```

- [ ] **Step 2:** Inside `runSEOChecks`, after the robots.txt disallow checks (find the `isPathDisallowedByRobots` usage), add sitemap quality checks:

```typescript
  // ── Sitemap quality ──────────────────────────────────────────
  try {
    const { fetchSafeResource: fetchSitemapResource } = await import('@/lib/checks/fetch-context')
    const origin = new URL(url).origin
    const sitemapRes = await fetchSitemapResource(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) })

    if (sitemapRes.ok) {
      const sitemapXml = await sitemapRes.text()
      const parser = new XMLParser({ ignoreAttributes: false })
      const parsed = parser.parse(sitemapXml) as Record<string, unknown>

      // Extract URLs from urlset or sitemapindex
      const urlset = parsed?.urlset as Record<string, unknown> | undefined
      const urls: unknown[] = urlset?.url
        ? (Array.isArray(urlset.url) ? urlset.url : [urlset.url])
        : []

      if (urls.length === 0) {
        issues.push(withIssueMeta(
          { ...T['sitemap-empty'] },
          'http',
          [evidence('response', 'sitemap.xml status', 200), evidence('count', 'URLs found', 0)],
        ))
      } else if (includeHeuristics) {
        // Check lastmod staleness — all lastmod older than 180 days
        const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000
        const urlsWithLastmod = urls.filter((u): u is Record<string, unknown> =>
          typeof u === 'object' && u !== null && 'lastmod' in u,
        )
        if (urlsWithLastmod.length > 0) {
          const allStale = urlsWithLastmod.every((u) => {
            const lm = u.lastmod
            if (!lm || typeof lm !== 'string') return true
            const d = new Date(lm)
            return !isNaN(d.getTime()) && d.getTime() < sixMonthsAgo
          })
          if (allStale) {
            const oldestDateStr = urlsWithLastmod
              .map(u => String(u.lastmod))
              .sort()
              .at(-1) ?? 'unknown'
            issues.push(withIssueMeta(
              { ...T['sitemap-lastmod-stale'], value: `last updated ${oldestDateStr}` },
              'http',
              [evidence('text', 'Most recent lastmod', oldestDateStr), evidence('count', 'URLs checked', urlsWithLastmod.length)],
            ))
          }
        }
      }
    }
  } catch {
    // non-fatal — sitemap parsing failure is not an issue itself
  }
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/checks/seo.ts
git commit -m "feat: sitemap quality checks (empty sitemap, stale lastmod)"
```

---

### Task 2.4: Implement robots.txt quality checks in seo.ts

**Files:**
- Modify: `lib/checks/seo.ts`

- [ ] **Step 1:** Add import at the top of `lib/checks/seo.ts` (after XMLParser import):

```typescript
import robotsParser from 'robots-parser'
```

- [ ] **Step 2:** Inside `runSEOChecks`, after the sitemap quality block from Task 2.3, add:

```typescript
  // ── Robots.txt quality ───────────────────────────────────────
  try {
    const { fetchSafeResource: fetchRobotsResource } = await import('@/lib/checks/fetch-context')
    const origin = new URL(url).origin
    const robotsRes = await fetchRobotsResource(`${origin}/robots.txt`, { signal: AbortSignal.timeout(2500) })

    if (robotsRes.ok) {
      const robotsText = await robotsRes.text()
      const robotsUrl = `${origin}/robots.txt`
      const robots = robotsParser(robotsUrl, robotsText)

      // Check: Disallow: / for * or Googlebot
      const homeUrl = `${origin}/`
      const isHomeBlocked =
        robots.isDisallowed(homeUrl, 'Googlebot') ||
        robots.isDisallowed(homeUrl, '*')

      if (isHomeBlocked) {
        issues.push(withIssueMeta(
          { ...T['robots-disallow-all'] },
          'http',
          [evidence('text', 'robots.txt', 'Disallow: / for * or Googlebot'), evidence('text', 'Checked URL', homeUrl)],
        ))
      }

      // Check: Sitemap directive present
      const hasSitemapDirective = /^Sitemap:/im.test(robotsText)
      if (!hasSitemapDirective) {
        issues.push(withIssueMeta(
          { ...T['robots-no-sitemap-directive'] },
          'http',
          [evidence('text', 'robots.txt Sitemap directive', 'missing')],
        ))
      }
    }
  } catch {
    // non-fatal
  }
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/checks/seo.ts
git commit -m "feat: robots.txt quality checks (Disallow: /, missing Sitemap directive)"
```

---

### Task 2.5: Add semantic HTML and schema validation issue templates

**Files:**
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add:

```typescript
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
    plainEnglish: 'AI crawlers and search engines fetch raw HTML before running JavaScript. If your page has little visible text in the HTML, they see an almost-empty page.',
    fixPrompt: 'Ensure key content is server-side rendered (SSR) or statically generated:\n\nNext.js: Use Server Components (default in App Router) or generateStaticParams.\nReact SPA: Migrate to Next.js or add a pre-rendering solution.\nVerify: View Page Source — if you see your main headline and description there, you\'re good.',
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
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'no-semantic-html': { confidence: 'likely', scoreEligible: false },
  'content-js-only': { confidence: 'likely', scoreEligible: true },
  'schema-missing-required-fields': { confidence: 'likely', scoreEligible: true },
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: semantic HTML, content JS-only, and schema validation templates"
```

---

### Task 2.6: Implement semantic HTML and schema validation checks in ai-visibility.ts

**Files:**
- Modify: `lib/checks/ai-visibility.ts`

- [ ] **Step 1:** In `lib/checks/ai-visibility.ts`, inside `runAIVisibilityChecks`, after the `thin-content` check, add semantic HTML check:

```typescript
  // ── Semantic HTML / AI readability ──────────────────────────
  if (includeLikely) {
    const hasMain = $('main').length > 0
    const hasArticle = $('article').length > 0
    const hasSection = $('section').length > 0

    if (!hasMain && !hasArticle && !hasSection) {
      issues.push(withIssueMeta(
        { ...T['no-semantic-html'] },
        'dom',
        [evidence('selector', '<main>, <article>, <section>', 'none found')],
      ))
    }

    // content-js-only: check raw HTML word count (distinct from spa-no-ssr which checks React roots)
    const rawWordCount = readableBodyText.split(/\s+/).filter(Boolean).length
    const hasReactRoot = $('div#root, div#app, div#__next').length > 0
    // Only flag content-js-only if NOT already caught by spa-no-ssr (no React root present)
    if (!hasReactRoot && rawWordCount < 100) {
      issues.push(withIssueMeta(
        { ...T['content-js-only'], value: `${rawWordCount} words in HTML` },
        'dom',
        [evidence('count', 'Readable words in raw HTML', rawWordCount)],
      ))
    }
  }
```

- [ ] **Step 2:** Add schema required fields validation. After the `geo-missing-org-sameas` block (around line 308 in original), add:

```typescript
  // ── Schema required fields validation ───────────────────────
  if (includeLikely && hasJsonLd) {
    const REQUIRED_FIELDS: Record<string, string[]> = {
      Organization: ['name', 'url'],
      Person: ['name'],
      Product: ['name', 'offers'],
      Article: ['headline', 'author', 'datePublished'],
      BlogPosting: ['headline', 'author', 'datePublished'],
      FAQPage: ['mainEntity'],
      SoftwareApplication: ['name', 'applicationCategory'],
      LocalBusiness: ['name', 'address'],
      WebSite: ['name', 'url'],
    }

    for (const block of jsonLdScripts) {
      try {
        const raw = $(block).html()
        if (!raw) continue
        const data = JSON.parse(raw)
        const items = Array.isArray(data) ? data : [data]

        for (const item of items) {
          const schemaType = item?.['@type']
          if (typeof schemaType !== 'string') continue
          const required = REQUIRED_FIELDS[schemaType]
          if (!required) continue

          const missingFields = required.filter(field => !item[field])
          if (missingFields.length > 0) {
            issues.push(withIssueMeta(
              { ...T['schema-missing-required-fields'], value: `${schemaType}: missing ${missingFields.join(', ')}` },
              'dom',
              [
                evidence('text', 'Schema type', schemaType),
                evidence('text', 'Missing required fields', missingFields.join(', ')),
              ],
            ))
            break // one issue per page is enough
          }
        }
      } catch {
        // skip malformed JSON-LD
      }
    }
  }
```

- [ ] **Step 3:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/checks/ai-visibility.ts
git commit -m "feat: semantic HTML check, content-js-only, schema required fields validation"
```

---

## Phase 3: Free External APIs + AI Layer

### Task 3.1: Create SSL Labs API provider

**Files:**
- Create: `lib/providers/ssllabs.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

SSL Labs API is free but slow (5–30 seconds on first assessment). Must never block scan completion.

- [ ] **Step 1:** Create `lib/providers/ssllabs.ts`:

```typescript
export interface SSLLabsResult {
  grade: string | null           // e.g. "A+", "A", "B", "C", "F"
  hasOldProtocol: boolean        // TLS 1.0 or 1.1 in use
  hasWeakCipher: boolean         // weak cipher suite detected
  ipAddress: string | null
}

type SSLLabsProviderResult =
  | { ok: true; data: SSLLabsResult }
  | { ok: false; status: 'unavailable' | 'failed'; message: string }

interface SSLLabsEndpoint {
  grade?: string
  ipAddress?: string
  details?: {
    protocols?: Array<{ id: number; name: string; version: string }>
    suites?: Array<{ list?: Array<{ name: string }> }>
  }
}

interface SSLLabsResponse {
  status?: string
  endpoints?: SSLLabsEndpoint[]
}

export async function fetchSSLLabsData(
  hostname: string,
  timeoutMs = 35_000,
): Promise<SSLLabsProviderResult> {
  const apiUrl = new URL('https://api.ssllabs.com/api/v3/analyze')
  apiUrl.searchParams.set('host', hostname)
  apiUrl.searchParams.set('publish', 'off')
  apiUrl.searchParams.set('all', 'done')
  apiUrl.searchParams.set('ignoreMismatch', 'on')

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'ShipReady/1.0 site-audit-tool' },
    })

    if (!res.ok) {
      return { ok: false, status: 'failed', message: `SSL Labs returned ${res.status}` }
    }

    const data = await res.json() as SSLLabsResponse

    // SSL Labs may return status: "DNS" | "ERROR" | "IN_PROGRESS" | "READY"
    if (data.status !== 'READY') {
      return {
        ok: false,
        status: 'unavailable',
        message: `SSL Labs assessment status: ${data.status ?? 'unknown'} (may need retry)`,
      }
    }

    const endpoints = data.endpoints ?? []
    const firstEndpoint = endpoints[0]
    if (!firstEndpoint) {
      return { ok: false, status: 'unavailable', message: 'No SSL Labs endpoints returned' }
    }

    const grade = firstEndpoint.grade ?? null
    const protocols = firstEndpoint.details?.protocols ?? []
    const hasOldProtocol = protocols.some(p => {
      const version = parseFloat(p.version)
      return p.name === 'TLS' && version < 1.2
    })

    const allSuites = firstEndpoint.details?.suites?.flatMap(s => s.list ?? []) ?? []
    const WEAK_CIPHER_PATTERNS = [/RC4/i, /DES(?!-\w*GCM)/i, /EXPORT/i, /NULL/i, /anon/i]
    const hasWeakCipher = allSuites.some(suite =>
      WEAK_CIPHER_PATTERNS.some(p => p.test(suite.name ?? '')),
    )

    return {
      ok: true,
      data: {
        grade,
        hasOldProtocol,
        hasWeakCipher,
        ipAddress: firstEndpoint.ipAddress ?? null,
      },
    }
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'SSL Labs request failed',
    }
  }
}
```

- [ ] **Step 2:** In `lib/ai/issue-templates.ts`, add TLS templates:

```typescript
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
    plainEnglish: 'Your server uses outdated encryption methods that can be broken by attackers. This puts your users\' data at risk.',
    fixPrompt: 'Disable weak cipher suites:\n\nNginx:\n  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;\n  ssl_prefer_server_ciphers off;\n\nApache:\n  SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256\n\nUse the Mozilla SSL Configuration Generator for your specific server.',
    docsUrl: 'https://ssl-config.mozilla.org/',
  },

  'tls-grade-low': {
    id: 'tls-grade-low',
    category: 'security',
    severity: 'medium',
    title: 'SSL Labs grade below A',
    description: 'SSL Labs assessed the TLS configuration and gave a grade below A.',
    plainEnglish: 'Your HTTPS configuration scored below A on SSL Labs\' independent assessment. This means there are TLS configuration improvements to make.',
    fixPrompt: 'Run a full assessment at ssllabs.com/ssltest/ to see the detailed breakdown. Common fixes to reach A+:\n1. Enable HSTS (Strict-Transport-Security header)\n2. Disable TLS 1.0/1.1\n3. Use ECDHE key exchange\n4. Enable OCSP stapling',
    docsUrl: 'https://www.ssllabs.com/ssltest/',
  },
```

- [ ] **Step 3:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'tls-old-protocol': { confidence: 'verified', scoreEligible: true },
  'tls-weak-cipher': { confidence: 'verified', scoreEligible: true },
  'tls-grade-low': { confidence: 'verified', scoreEligible: false },
```

- [ ] **Step 4:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/providers/ssllabs.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: SSL Labs provider and TLS issue templates"
```

---

### Task 3.2: Create OSV CVE lookup provider

**Files:**
- Create: `lib/providers/osv.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

OSV (Open Source Vulnerabilities) is a free Google API. It requires a detected library name + version from the page's `<script src>` tags.

- [ ] **Step 1:** Create `lib/providers/osv.ts`:

```typescript
export interface DetectedLibrary {
  name: string      // e.g. "jquery"
  version: string   // e.g. "3.4.1"
  ecosystem: string // e.g. "npm"
}

export interface CVEResult {
  library: DetectedLibrary
  cveIds: string[]
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
}

interface OSVVulnerability {
  id: string
  severity?: Array<{ type: string; score: string }>
}

interface OSVResponse {
  vulns?: OSVVulnerability[]
}

export async function detectJsLibraries(html: string): Promise<DetectedLibrary[]> {
  const libs: DetectedLibrary[] = []

  const patterns: Array<{ re: RegExp; name: string; ecosystem: string }> = [
    { re: /jquery[.-](\d+\.\d+\.\d+)(?:\.min)?\.js/i, name: 'jquery', ecosystem: 'npm' },
    { re: /bootstrap[.-](\d+\.\d+\.\d+)(?:\.min)?\.(?:js|css)/i, name: 'bootstrap', ecosystem: 'npm' },
    { re: /lodash[.-](\d+\.\d+\.\d+)(?:\.min)?\.js/i, name: 'lodash', ecosystem: 'npm' },
    { re: /moment[.-](\d+\.\d+\.\d+)(?:\.min)?\.js/i, name: 'moment', ecosystem: 'npm' },
    { re: /angular(?:\.min)?\.js.*?[?&]v=(\d+\.\d+\.\d+)/i, name: '@angular/core', ecosystem: 'npm' },
    { re: /react(?:\.development|\.production\.min)?\.js.*?[?&]v=(\d+\.\d+\.\d+)/i, name: 'react', ecosystem: 'npm' },
  ]

  for (const { re, name, ecosystem } of patterns) {
    const match = html.match(re)
    if (match?.[1]) {
      libs.push({ name, version: match[1], ecosystem })
    }
  }

  return libs
}

export async function queryOSVBatch(
  libraries: DetectedLibrary[],
  timeoutMs = 10_000,
): Promise<CVEResult[]> {
  if (libraries.length === 0) return []

  const results: CVEResult[] = []

  await Promise.allSettled(
    libraries.map(async (lib) => {
      try {
        const body = {
          version: lib.version,
          package: { name: lib.name, ecosystem: lib.ecosystem },
        }

        const res = await fetch('https://api.osv.dev/v1/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        })

        if (!res.ok) return

        const data = await res.json() as OSVResponse
        const vulns = data.vulns ?? []

        if (vulns.length === 0) return

        // Determine highest severity
        let severity: CVEResult['severity'] = 'unknown'
        for (const vuln of vulns) {
          for (const s of vuln.severity ?? []) {
            const score = parseFloat(s.score)
            if (!isNaN(score)) {
              if (score >= 9.0) { severity = 'critical'; break }
              else if (score >= 7.0 && severity !== 'critical') severity = 'high'
              else if (score >= 4.0 && !['critical', 'high'].includes(severity)) severity = 'medium'
              else if (severity === 'unknown') severity = 'low'
            }
          }
        }

        results.push({
          library: lib,
          cveIds: vulns.slice(0, 5).map(v => v.id),
          severity,
        })
      } catch {
        // non-fatal per library
      }
    }),
  )

  return results
}
```

- [ ] **Step 2:** In `lib/ai/issue-templates.ts`, add:

```typescript
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
```

- [ ] **Step 3:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'vulnerable-js-lib': { confidence: 'verified', scoreEligible: true },
```

- [ ] **Step 4:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/providers/osv.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: OSV CVE provider and vulnerable-js-lib template"
```

---

### Task 3.3: Wire SSL Labs and OSV into Deep Pass in index.ts

**Files:**
- Modify: `lib/checks/index.ts`

Both SSL Labs and OSV run in Deep Pass, after `runLighthouse`. SSL Labs is async with a long timeout. OSV requires HTML from the already-fetched page.

- [ ] **Step 1:** At the top of `lib/checks/index.ts`, add imports after the existing provider imports:

```typescript
import { fetchSSLLabsData } from '@/lib/providers/ssllabs'
import { detectJsLibraries, queryOSVBatch } from '@/lib/providers/osv'
```

- [ ] **Step 2:** Find the Deep Pass section in `runAllChecks` where `runLighthouse` is called. After the Lighthouse safeTask block (look for the `await saveScan` after the deep pass), add the SSL Labs and OSV calls. Find where `const deepFastResult` or the parallel security/SEO/lighthouse block ends, and add:

```typescript
    // ── SSL Labs TLS assessment (Deep Pass) ──────────────────────
    if (url.startsWith('https://')) {
      const sslLabsResult = await safeTask(
        fetchSSLLabsData(new URL(url).hostname, 35_000),
        38_000,
        'SSL Labs TLS assessment',
      )

      if (sslLabsResult.ok && sslLabsResult.value.ok) {
        const tls = sslLabsResult.value.data
        const securityIssues = result.security?.issues ?? []

        if (tls.hasOldProtocol) {
          securityIssues.push(withIssueMeta(
            { ...T['tls-old-protocol'] },
            'ssl',
            [evidence('text', 'SSL Labs', 'TLS 1.0 or 1.1 detected')],
          ))
        }
        if (tls.hasWeakCipher) {
          securityIssues.push(withIssueMeta(
            { ...T['tls-weak-cipher'] },
            'ssl',
            [evidence('text', 'SSL Labs', 'Weak cipher suite detected')],
          ))
        }
        if (tls.grade && !['A', 'A+', 'A-'].includes(tls.grade)) {
          securityIssues.push(withIssueMeta(
            { ...T['tls-grade-low'], value: `Grade ${tls.grade}` },
            'ssl',
            [evidence('text', 'SSL Labs grade', tls.grade)],
          ))
        }

        // Rebuild security category score with new issues
        result = buildScanResult({
          ...result,
          security: {
            ...result.security,
            issues: securityIssues,
          },
        })
      }
    }

    // ── OSV CVE check (Deep Pass) ────────────────────────────────
    {
      const detectedLibs = await detectJsLibraries(html)
      if (detectedLibs.length > 0) {
        const cveResults = await safeTask(
          queryOSVBatch(detectedLibs, 10_000),
          12_000,
          'OSV CVE lookup',
        )

        if (cveResults.ok && cveResults.value.length > 0) {
          const securityIssues = result.security?.issues ?? []
          for (const cve of cveResults.value) {
            securityIssues.push(withIssueMeta(
              {
                ...T['vulnerable-js-lib'],
                value: `${cve.library.name}@${cve.library.version}`,
                severity: cve.severity === 'critical' ? 'high' : 'medium',
              },
              'http',
              [
                evidence('text', 'Library', `${cve.library.name}@${cve.library.version}`),
                evidence('count', 'CVEs found', cve.cveIds.length),
                evidence('text', 'CVE IDs', cve.cveIds.slice(0, 3).join(', ')),
                evidence('text', 'Severity', cve.severity),
              ],
            ))
          }

          result = buildScanResult({
            ...result,
            security: {
              ...result.security,
              issues: securityIssues,
            },
          })
        }
      }
    }
```

Note: `T` and `withIssueMeta`, `evidence`, `buildScanResult` are already imported in `lib/checks/index.ts`. Verify the variable names (`html`, `result`) match what's in scope at that point in the function.

- [ ] **Step 3:** Build:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

If `T` is not imported in index.ts, add:
```typescript
import { T } from '@/lib/ai/issue-templates'
```

- [ ] **Step 4:** Commit:

```bash
git add lib/checks/index.ts
git commit -m "feat: wire SSL Labs TLS and OSV CVE checks into Deep Pass"
```

---

### Task 3.4: Wire CrUX field metrics as issues in index.ts

**Files:**
- Modify: `lib/checks/index.ts`
- Modify: `lib/ai/issue-templates.ts`
- Modify: `lib/checks/issue-meta.ts`

The PSI provider already fetches CrUX data (`providerData.pagespeed.fieldMetrics`). This task converts those metrics into issues.

- [ ] **Step 1:** In `lib/ai/issue-templates.ts`, add:

```typescript
  'crux-lcp-poor': {
    id: 'crux-lcp-poor',
    category: 'performance',
    severity: 'high',
    title: 'Real-user LCP is poor (CrUX field data)',
    description: 'Google\'s Chrome User Experience Report shows real users experience LCP above 4000ms.',
    plainEnglish: 'Real visitors to your site experience the main content loading in more than 4 seconds. This is based on actual Chrome browser data from real users, not a lab test.',
    fixPrompt: 'This is real-user data showing slow load. Focus on: server response time, render-blocking resources, large images without priority loading. See the LCP guidance and also check the Lighthouse audit above for specific elements.',
    docsUrl: 'https://web.dev/articles/lcp',
  },

  'crux-cls-poor': {
    id: 'crux-cls-poor',
    category: 'performance',
    severity: 'medium',
    title: 'Real-user CLS is poor (CrUX field data)',
    description: 'Google\'s Chrome User Experience Report shows real users experience CLS above 0.25.',
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
    fixPrompt: 'Reduce JavaScript execution time. Break up long tasks. Defer non-critical scripts. Use React\'s useTransition for expensive state updates.',
    docsUrl: 'https://web.dev/articles/inp',
  },
```

- [ ] **Step 2:** In `lib/checks/issue-meta.ts`, add:

```typescript
  'crux-lcp-poor': { confidence: 'verified', scoreEligible: true },
  'crux-cls-poor': { confidence: 'verified', scoreEligible: true },
  'crux-inp-poor': { confidence: 'verified', scoreEligible: true },
```

- [ ] **Step 3:** In `lib/checks/index.ts`, find the block where `pageSpeed.ok` is handled (around line 419 in the original). After `providerData = { ...providerData, pagespeed: pageSpeed.data }`, add CrUX issue generation:

```typescript
      if (pageSpeed.ok) {
        budget = markProviderState(budget, 'pagespeed', 'done', 'Google PageSpeed Insights data captured.')
        providerData = {
          ...providerData,
          pagespeed: pageSpeed.data,
        }

        // Convert CrUX field metrics to issues
        const fieldMetrics = pageSpeed.data.fieldMetrics
        const cruxIssues: Issue[] = []

        if (typeof fieldMetrics?.lcpMs === 'number' && fieldMetrics.lcpMs > 4000) {
          cruxIssues.push(withIssueMeta(
            { ...T['crux-lcp-poor'], value: `${Math.round(fieldMetrics.lcpMs)}ms p75` },
            'http',
            [evidence('metric', 'LCP p75 (real users)', fieldMetrics.lcpMs), evidence('text', 'Threshold', '4000ms')],
          ))
        }
        if (typeof fieldMetrics?.cls === 'number' && fieldMetrics.cls > 0.25) {
          cruxIssues.push(withIssueMeta(
            { ...T['crux-cls-poor'], value: `${fieldMetrics.cls.toFixed(2)} p75` },
            'http',
            [evidence('metric', 'CLS p75 (real users)', fieldMetrics.cls), evidence('text', 'Threshold', '0.25')],
          ))
        }
        if (typeof fieldMetrics?.inpMs === 'number' && fieldMetrics.inpMs > 500) {
          cruxIssues.push(withIssueMeta(
            { ...T['crux-inp-poor'], value: `${Math.round(fieldMetrics.inpMs)}ms p75` },
            'http',
            [evidence('metric', 'INP p75 (real users)', fieldMetrics.inpMs), evidence('text', 'Threshold', '500ms')],
          ))
        }

        if (cruxIssues.length > 0) {
          const existingPerfIssues = result.performance?.issues ?? []
          result = buildScanResult({
            ...result,
            performance: {
              ...result.performance,
              issues: [...existingPerfIssues, ...cruxIssues],
            },
          })
        }
      }
```

Note: `Issue` type is already imported in `lib/checks/index.ts` (verify, add if missing).

- [ ] **Step 4:** Build + commit:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
git add lib/checks/index.ts lib/ai/issue-templates.ts lib/checks/issue-meta.ts
git commit -m "feat: convert CrUX field metrics (LCP/CLS/INP) to issues in Deep Pass"
```

---

### Task 3.5: Add Pro AI content citability and Answer Gap enrichment

**Files:**
- Modify: `lib/ai/generate-evidence-enrichment.ts`

This adds two Pro-only additions to the AI enrichment call. Content citability is a per-scan signal. Answer Gap is a separate OpenAI call for Pro/Agency.

- [ ] **Step 1:** Read the current structure of `lib/ai/generate-evidence-enrichment.ts` to find the OpenAI call and the prompt structure.

- [ ] **Step 2:** In `generate-evidence-enrichment.ts`, find the system/user prompt construction and add a citability section to the existing compact evidence payload. Add to the user prompt (after the existing issues/evidence block):

```typescript
// Add to the compact evidence payload that's sent to OpenAI:
const citabilitySignals = {
  hasDataTables: (result.ai_visibility?.issues ?? []).every(i => i.id !== 'thin-content'),
  wordCount: (() => {
    const wc = (result.ai_visibility?.issues ?? []).find(i => i.id === 'thin-content')?.value
    return wc ? parseInt(String(wc)) : null
  })(),
  hasDateSignal: !(result.ai_visibility?.issues ?? []).some(i => i.id === 'geo-missing-date-signal'),
  hasFAQSchema: !(result.ai_visibility?.issues ?? []).some(i => i.id === 'missing-faq-schema'),
  hasOrgSchema: !(result.ai_visibility?.issues ?? []).some(i => i.id === 'missing-schema-org'),
}
```

Then in the prompt include:

```typescript
// In the system prompt, add a citability instruction:
`Content citability signals: ${JSON.stringify(citabilitySignals)}
Include a "contentCitability" field in your response: a 1-sentence assessment of how likely this content is to be cited by AI systems, based on its structure and signals.`
```

- [ ] **Step 3:** For the Answer Gap (Pro wow-insight), add a SEPARATE second OpenAI call in `lib/checks/index.ts`, inside the Pro/Agency wow insights block. After `generateWowInsights`, add:

```typescript
    // Answer Gap — Pro/Agency only, separate call
    if (isPro && process.env.OPENAI_API_KEY && businessContext) {
      const answerGapResult = await safeTask(
        generateAnswerGap(result, businessContext),
        20_000,
        'Answer Gap analysis',
      )
      if (answerGapResult.ok && answerGapResult.value) {
        result = buildScanResult({
          ...result,
          aiEnrichment: {
            ...result.aiEnrichment,
            answerGap: answerGapResult.value,
          },
        })
      }
    }
```

- [ ] **Step 4:** Create `lib/ai/generate-answer-gap.ts`:

```typescript
import type { BusinessContext, ScanResult } from '@/types/scan'
import OpenAI from 'openai'

export async function generateAnswerGap(
  result: ScanResult,
  businessContext: BusinessContext,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const client = new OpenAI({ apiKey })

  const prompt = `You are an AI content strategist. Analyze this website and identify content gaps that reduce its chance of being cited by AI assistants (ChatGPT, Claude, Perplexity).

Site: ${result.url}
Business context: ${businessContext.description ?? 'not provided'}
Category: ${businessContext.category ?? 'unknown'}

Current AI visibility issues: ${result.ai_visibility?.issues?.map(i => i.title).join(', ') || 'none found'}

Identify 3 specific content gaps — topics or page types this site is likely missing that AI assistants commonly cite for this type of product. Be specific and actionable. Format as a bulleted list. Max 150 words.`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.4,
    })
    return response.choices[0]?.message?.content ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 5:** Add `answerGap?: string` to the `AiEnrichment` type in `types/scan.ts` if it doesn't exist.

- [ ] **Step 6:** Build:

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 7:** Commit:

```bash
git add lib/ai/generate-answer-gap.ts lib/ai/generate-evidence-enrichment.ts lib/checks/index.ts types/scan.ts
git commit -m "feat: Pro AI enrichment — content citability signal + Answer Gap analysis"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| `missing-spf`, `missing-dmarc`, `weak-dmarc-policy`, `missing-caa` | Tasks 1.1, 1.4 |
| `cookie-missing-secure`, `cookie-missing-httponly`, `cookie-missing-samesite` | Tasks 1.2, 1.5 |
| `exposed-git-head`, `exposed-source-map`, `graphql-introspection-open` | Tasks 1.3, 1.6 |
| Per-bot: `oai-searchbot-blocked`, `gptbot-blocked`, `claudebot-blocked`, `perplexitybot-blocked`, `deepseekbot-blocked` | Tasks 1.7, 1.8 |
| Replace `ai-crawlers-blocked` with per-bot | Task 1.8 |
| `llms-txt-no-description`, `llms-txt-no-sections`, `llms-txt-broken-links` | Task 1.9 |
| `sitemap-empty`, `sitemap-lastmod-stale` | Tasks 2.2, 2.3 |
| `robots-no-sitemap-directive`, `robots-disallow-all` | Tasks 2.2, 2.4 |
| `no-semantic-html`, `content-js-only` | Tasks 2.5, 2.6 |
| `schema-missing-required-fields` | Tasks 2.5, 2.6 |
| SSL Labs: `tls-old-protocol`, `tls-weak-cipher`, `tls-grade-low` | Tasks 3.1, 3.3 |
| OSV CVE: `vulnerable-js-lib` | Tasks 3.2, 3.3 |
| CrUX: `crux-lcp-poor`, `crux-cls-poor`, `crux-inp-poor` | Task 3.4 |
| Content citability + Answer Gap | Task 3.5 |
| All new checks use `confidence`, `evidence[]`, `scoreEligible` | All tasks — verified |
| No check silently passes on failure | SSL Labs uses `unavailable`, OSV is non-fatal per-lib, DNS is per-record |

### Placeholder scan

No TBD, TODO, or incomplete steps. Every code block is complete.

### Type consistency

- `T['oai-searchbot-blocked']` defined in Task 1.7, used in Task 1.8 ✓
- `T['llms-txt-no-description']` defined in Task 1.9 step 1, used in Task 1.9 step 3 ✓
- `T['sitemap-empty']` defined in Task 2.2, used in Task 2.3 ✓
- `T['robots-disallow-all']` defined in Task 2.2, used in Task 2.4 ✓
- `T['no-semantic-html']`, `T['content-js-only']`, `T['schema-missing-required-fields']` defined in Task 2.5, used in Task 2.6 ✓
- `T['tls-old-protocol']` etc. defined in Task 3.1, used in Task 3.3 ✓
- `T['vulnerable-js-lib']` defined in Task 3.2, used in Task 3.3 ✓
- `T['crux-lcp-poor']` etc. defined in Task 3.4 step 1, used in Task 3.4 step 3 ✓
- `detectJsLibraries`, `queryOSVBatch` defined in `lib/providers/osv.ts` (Task 3.2), imported in Task 3.3 ✓
- `fetchSSLLabsData` defined in `lib/providers/ssllabs.ts` (Task 3.1), imported in Task 3.3 ✓
- `generateAnswerGap` defined in Task 3.5, called from `lib/checks/index.ts` Task 3.5 ✓
