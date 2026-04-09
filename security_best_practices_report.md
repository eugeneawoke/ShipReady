# Security Best Practices Report

## Executive Summary

Stack reviewed: TypeScript, Next.js 16 App Router, React 19, Supabase, Vercel, and Railway scanner runtime.

The current codebase is materially better than the previous scan-flow state: private scan reads now have an ownership check in the polling API, webhook signature length is checked before `timingSafeEqual`, URL safety resolves DNS before scan dispatch, and `.env*` files are ignored. The latest remediation pass also added shared same-origin JSON request guards for cookie-authenticated mutations, repeated URL safety checks before scanner fetches, baseline security headers, fail-closed public badge visibility, local secret/temp ignores, safer CSP product guidance, and lockfile-enforced Railway installs.

Remaining risk that code alone cannot close: the committed token-like value must be rotated/revoked externally, and scanner SSRF should still be contained with infrastructure egress rules that block loopback, RFC1918, link-local, and cloud metadata networks.

Security guidance used:

- `javascript-typescript-nextjs-web-server-security.md`
- `javascript-typescript-react-web-frontend-security.md`
- `javascript-general-web-frontend-security.md`

## Remediation Status

| Finding | Status | Notes |
| --- | --- | --- |
| SEC-001 committed token-like credential | Partially fixed | `.claude/settings.local.json` is removed from git tracking and ignored. The token still needs external rotation/revocation and optional git-history cleanup. |
| SEC-002 monitor CSRF/origin gap | Fixed in code | `POST` and `DELETE` now require `application/json` and an allowed exact `Origin`. |
| SEC-003 scan fail-open origin check | Fixed in code | `/api/scan` now uses the shared fail-closed same-origin JSON guard. |
| SEC-004 scanner SSRF DNS rebinding gap | Partially fixed | Scanner fetches re-run URL safety and use `redirect: 'manual'`; infrastructure egress blocking is still required for defense-in-depth. |
| SEC-005 baseline headers | Fixed in code | App-wide `nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy`, and CSP report-only headers are configured. |
| SEC-006 weak CSP examples | Fixed in code | Landing copy and report prompt templates no longer recommend `unsafe-eval` or `unsafe-inline` as a “100/100” fix. |
| SEC-007 Supabase temp metadata | Fixed in code | `supabase/.temp/` is ignored. |
| SEC-008 public badge score exposure | Fixed in code | Badges require `badge_enabled = true`; the new column defaults to `false`. Apply the Supabase migration before relying on this in production. |
| SEC-009 Railway install reproducibility | Fixed in code | Docker build now uses `npm ci`. |

## Critical

### SEC-001 — Critical — Token-like credential is committed in Claude local settings

**Rule ID:** `NEXT-SECRETS-001`, `REACT-CONFIG-001`

**Location:** `.claude/settings.local.json:20`

**Evidence:**

```json
"Bash(npx @21st-dev/mcp@latest install claude --api-key [redacted token-like value])"
```

**Impact:** If this value is a real API token, anyone with repository access can reuse it. Because it is already in a tracked file, deleting it in a future commit is not enough; it may remain recoverable from git history.

**Fix:** Revoke/rotate the token immediately, remove it from `.claude/settings.local.json`, and keep this file out of git if it contains local tool permissions or secrets.

**Mitigation:** Add `.claude/settings.local.json` to `.gitignore` or move local tool permissions to a non-repo location. Run a secret scanner over git history and rotate any additional exposed values.

## High

### SEC-002 — High — Cookie-authenticated monitor mutations have no CSRF/origin check

**Rule ID:** `NEXT-CSRF-001`, `REACT-CSRF-001`

**Location:** `app/api/monitor/route.ts:20-29`, `app/api/monitor/route.ts:56-65`

**Evidence:**

```ts
export async function POST(request: NextRequest) {
  const user = await getUserWithPlan()
  ...
  const body = await request.json()
```

and:

```ts
export async function DELETE(request: NextRequest) {
  const user = await getUserWithPlan()
  ...
  const body = await request.json()
```

**Impact:** These routes mutate monitoring state using the user's Supabase cookie session. A cross-site request that can send a simple body to these endpoints may enable or disable monitoring for a logged-in Pro/Agency user without intent, even if the attacker cannot read the response.

**Fix:** Apply the same normalized exact-origin check used by `/api/scan`, but require a valid `Origin` in production for browser state-changing requests. For stronger protection, add a CSRF token tied to the session.

**Mitigation:** Ensure Supabase cookies are `SameSite=Lax` or stricter in production, and reject unexpected content types on JSON mutation routes.

### SEC-003 — High — `/api/scan` accepts missing `Origin` on a state-changing route

**Rule ID:** `NEXT-CSRF-001`

**Location:** `app/api/scan/route.ts:43-51`

**Evidence:**

```ts
const origin = request.headers.get('origin')
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
if (origin && appUrl) {
  if (!isAllowedOrigin(origin, appUrl)) {
```

**Impact:** The origin comparison is now exact when a header is present, but if the `Origin` header is missing the route proceeds. For a cookie-authenticated, quota-consuming scan creation endpoint, fail-open origin handling leaves an unnecessary CSRF edge case and makes production behavior depend on browser/header quirks.

**Fix:** In production, reject state-changing browser endpoints when `Origin` is absent or not exactly in the allowlist. If API clients need non-browser access later, give them a separate token-authenticated endpoint instead of reusing the cookie-authenticated route.

**Mitigation:** Reject non-JSON content types and add a CSRF token if browser form/fetch flows expand.

### SEC-004 — High — Scanner SSRF protection is still vulnerable to DNS rebinding and needs network containment

**Rule ID:** `NEXT-INPUT-SSRF`

**Location:** `lib/server/url-safety.ts:38-40`, `lib/checks/fetch-context.ts:10-13`

**Evidence:**

```ts
const ips = await resolveHostnameIps(hostname)
if (ips.length === 0 || ips.some((ip) => isPrivateIp(ip))) {
```

followed later by:

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
```

**Impact:** The app resolves and checks the hostname before scanning, which blocks simple private-IP targets. However, the later `fetch()` calls perform their own DNS resolution and connection. An attacker-controlled domain can potentially use DNS rebinding between validation and the actual scan fetches, especially because the scanner performs multiple subsequent requests to the same origin.

**Fix:** Route scanner outbound traffic through a hardened fetch layer that resolves once, connects to the validated IP, and rejects private/link-local ranges on every redirect and subsequent same-origin probe. At minimum, re-run `assertSafeScanUrl` immediately before each outbound probe and add infrastructure egress deny rules.

**Mitigation:** On Railway/Vercel, enforce network egress controls that block RFC1918, loopback, link-local, and cloud metadata ranges. Treat application-level SSRF checks as one layer, not the only layer.

## Medium

### SEC-005 — Medium — No app-level baseline security headers are configured

**Rule ID:** `NEXT-DEPLOY-BASELINE`, `REACT-HEADERS-001`

**Location:** `next.config.ts:3-17`

**Evidence:**

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: [
```

There is no `headers()` configuration for CSP, `X-Content-Type-Options`, `Referrer-Policy`, or clickjacking protection.

**Impact:** Vercel may provide some platform headers such as HSTS, but the app does not visibly set a CSP, frame policy, nosniff, or referrer policy. This weakens defense-in-depth for XSS/clickjacking and is also inconsistent with what ShipReady recommends to scanned users.

**Fix:** Add a conservative `headers()` baseline in `next.config.ts`. Start with `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and a CSP compatible with Next.js. Avoid `unsafe-eval` in production unless a specific library requires and documents it.

**Mitigation:** Verify production response headers at runtime after deployment, because some protections may be configured at Vercel/edge rather than in code.

### SEC-006 — Medium — Landing page recommends a weak CSP that allows unsafe script execution

**Rule ID:** `REACT-CSP-001`

**Location:** `app/(landing)/page.tsx:181`, `app/(landing)/page.tsx:290`

**Evidence:**

```ts
"script-src 'self' 'unsafe-eval'",
"style-src 'self' 'unsafe-inline'",
```

**Impact:** This is product copy rather than an executable sink, but it teaches users to add a CSP with `unsafe-eval` and `unsafe-inline` while claiming it protects against XSS and scores 100/100. That advice weakens the control being recommended and can cause customers to ship a misleading security fix.

**Fix:** Change the sample prompt to recommend nonce/hash-based scripts or a staged CSP rollout. If inline styles are unavoidable for Next/Tailwind compatibility, document the tradeoff and avoid presenting it as a perfect XSS protection.

**Mitigation:** Align the issue templates in `lib/ai/issue-templates.ts` with the same safer CSP guidance so report prompts do not contradict the landing page.

### SEC-007 — Medium — Supabase CLI temp metadata is not ignored

**Rule ID:** `NEXT-SECRETS-001`

**Location:** `.gitignore:1-33`, `supabase/.temp/pooler-url`

**Evidence:**

```gitignore
.env*
.vercel
```

The workspace also contains untracked `supabase/.temp/*` files, including `pooler-url`.

**Impact:** These files are not currently tracked, but they are present in the working tree and not covered by `.gitignore`. A future broad `git add` could commit Supabase operational metadata such as project refs or pooler URLs.

**Fix:** Add `supabase/.temp/` to `.gitignore` and remove any local temp files from staging if they ever appear.

**Mitigation:** Keep secret scanning enabled in GitHub and treat any committed pooler/database connection information as requiring rotation.

### SEC-008 — Medium — Public badge endpoint can expose anonymous scan scores by domain

**Rule ID:** `NEXT-AUTHZ-002`

**Location:** `app/api/badge/[domain]/route.ts:20-39`

**Evidence:**

```ts
// RLS limits this route to anonymous/public scans only.
const { data } = await supabase
  .from('scans')
  .select('results')
```

**Impact:** This route intentionally relies on RLS so authenticated private scans are hidden, but any anonymous scan remains discoverable by domain and exposes the latest score. If anonymous reports are meant to be shareable only by opaque report URL, this endpoint creates a domain-enumeration side channel.

**Fix:** Require an explicit `badge_enabled` or public badge token before exposing scores by domain. If anonymous scans are intentionally public by domain, document that product decision in the access model.

**False positive note:** This may be acceptable if badges are intentionally public for anonymous scans. The current code comment says anonymous/public scans only, but there is no per-domain opt-in.

## Low

### SEC-009 — Low — Railway Docker build uses `npm install` instead of lockfile-enforced install

**Rule ID:** `NEXT-SUPPLY-001`

**Location:** `Dockerfile.railway:13-14`

**Evidence:**

```dockerfile
COPY package*.json ./
RUN npm install
```

**Impact:** `npm install` can rewrite or resolve dependencies differently from the committed lockfile behavior, making Railway builds less reproducible. This is a supply-chain hardening issue rather than an immediate exploitable vulnerability.

**Fix:** Use `npm ci` in Docker builds so production scanner images are built exactly from `package-lock.json`.

**Mitigation:** Keep dependency update review and `npm audit`/Dependabot-style alerts active.

## Positive Findings

- `.env*` is ignored in `.gitignore`, and only `.env.example` is tracked.
- Private authenticated scans are protected in `app/api/scan/[id]/route.ts` by an explicit `user_id` check before returning data.
- Legacy billing webhook code was removed after the payment provider decision moved back to TBD.
- URL safety now blocks embedded credentials, non-HTTP(S) protocols, private host strings, private DNS results, and redirect hops before scan dispatch.
- I did not find attacker-controlled `dangerouslySetInnerHTML` usage. The visible usage in `components/ui/motion-footer.tsx` renders a static style string.

## Suggested Fix Order

1. Rotate the exposed token-like value and remove `.claude/settings.local.json` from tracked secret-bearing config.
2. Add origin/content-type/CSRF protection to `/api/monitor` and make `/api/scan` fail closed on missing `Origin` in production.
3. Add Railway/Vercel egress restrictions for scanner SSRF containment, then harden scanner fetches against DNS rebinding.
4. Add baseline security headers in `next.config.ts`.
5. Ignore `supabase/.temp/` and clean local temp metadata from future staging.
6. Replace weak CSP examples in landing/report prompt copy.
7. Switch Railway Docker builds to `npm ci`.
