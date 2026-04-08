# Security Best Practices Report

## Executive summary

Стек проекта: TypeScript + Next.js App Router + React + Supabase. По релевантным security references для Next.js/React основные проблемы сосредоточены в request-facing API: SSRF защита неполная, scan data отдается без авторизации, CSRF/origin check реализован небезопасно, а webhook verification можно уронить malformed signature. Самый серьезный риск — возможность сканировать внутренние адреса через внешний домен, который резолвится в private IP.

Использованные reference-файлы:

- `javascript-typescript-nextjs-web-server-security.md`
- `javascript-typescript-react-web-frontend-security.md`
- `javascript-general-web-frontend-security.md`

## Critical

### SEC-001 — Critical — SSRF protection only validates the hostname string, not the resolved IP

**Rule ID:** `NEXT-INPUT-SSRF`

**Location:** `lib/utils.ts:8-32`, `app/api/scan/route.ts:35-40`

**Evidence:**

```ts
if (PRIVATE_HOST_RE.some(re => re.test(u.hostname))) return false
```

and later:

```ts
if (!raw || !isValidUrl(normalizeUrl(raw))) {
  return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
}
```

**Impact:** an attacker can submit `https://attacker-controlled-domain.tld` where DNS resolves to `127.0.0.1`, `10.x`, `169.254.x.x`, cloud metadata, or other internal infrastructure. The app then performs multiple server-side fetches against that target during scanning.

**Why it violates best practice:** the Next.js server-side guidance requires treating outbound URL fetchers as SSRF sinks. String-level host filters are not sufficient when the hostname can resolve to private or link-local IPs.

**Fix:** resolve hostnames before connecting, reject private/link-local ranges after DNS resolution, and re-check on redirect hops. If possible, route all scanning through a hardened fetcher/network sandbox.

**Mitigation:** run the scanner in a network-isolated environment with egress restrictions to private ranges and metadata endpoints.

## High

### SEC-002 — High — Scan results are readable without authentication or ownership checks

**Rule ID:** `NEXT-AUTHZ-001`

**Location:** `app/api/scan/[id]/route.ts:4-21`

**Evidence:**

```ts
const { data, error } = await supabase
  .from('scans')
  .select('id, url, status, results')
  .eq('id', id)
  .single()

return NextResponse.json(data)
```

**Impact:** anyone who gets a scan UUID can read the full report, including scanned URL, security findings, and generated prompts, regardless of whether they own the scan.

**Why it violates best practice:** request-facing routes must be assumed reachable by attackers unless an auth boundary is clearly enforced. UUID entropy lowers discoverability but is not an authorization mechanism.

**Fix:** require an authenticated user for private scans and verify `user_id === session.user.id`. If anonymous public reports are intended, make that an explicit product rule with a separate `public_token` or share token instead of raw scan IDs.

**False positive note:** if the product intentionally treats every report URL as public/shareable, document that explicitly; it is not visible as an intentional rule in current code.

### SEC-003 — High — Origin validation for `/api/scan` is bypassable because it uses `startsWith`

**Rule ID:** `NEXT-CSRF-001`

**Location:** `app/api/scan/route.ts:21-29`

**Evidence:**

```ts
const allowed = [appUrl, 'http://localhost:3000', 'http://localhost:3001']
if (!allowed.some(o => origin.startsWith(o))) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Impact:** an origin such as `https://shipready.app.evil.tld` passes the check because it starts with the allowed prefix. That weakens the stated CSRF defense on a state-changing endpoint.

**Why it violates best practice:** security checks on origins must compare normalized origin values exactly, not by prefix.

**Fix:** parse `Origin` with `new URL(origin).origin` and compare exact strings against an allowlist.

**Mitigation:** if cookies are involved, add a real CSRF token or stricter same-site/session validation instead of relying solely on `Origin`.

## Medium

### SEC-004 — Medium — Malformed Lemon Squeezy signatures can trigger a 500 instead of a clean reject

**Rule ID:** `NEXT-WEBHOOK-001`

**Location:** `app/api/webhooks/ls/route.ts:5-10`, `app/api/webhooks/ls/route.ts:17-18`

**Evidence:**

```ts
const digest = hmac.update(payload).digest('hex')
return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
```

**Impact:** `timingSafeEqual` throws when the buffer lengths differ. An attacker can send any wrong-length `x-signature` and turn a normal `401` path into an exception/500 path, creating noisy webhook handling and possible retry storms.

**Why it violates best practice:** signature verification code should reject malformed input safely and deterministically before constant-time comparison.

**Fix:** decode/normalize the signature format, check length first, and only then call `timingSafeEqual` inside a guarded branch.

### SEC-005 — Medium — Public badge endpoint reveals latest score for any arbitrary domain in the database

**Rule ID:** `NEXT-AUTHZ-002`

**Location:** `app/api/badge/[domain]/route.ts:18-36`

**Evidence:**

```ts
const { data } = await supabase
  .from('scans')
  .select('results')
  ...
  .limit(1)
  .single()
```

**Impact:** anyone can query `/api/badge/{domain}` and learn whether that domain was scanned and what its latest score is, even if the scan belonged to a private user workspace.

**Why it violates best practice:** this endpoint uses the service role and exposes database-derived information without checking whether the domain owner intended publication.

**Fix:** require an explicit opt-in/public badge flag per scan or per domain before exposing scores publicly.

## Low

### SEC-006 — Low — Security posture relies on app-layer checks without visible network hardening

**Rule ID:** `NEXT-DEPLOY-BASELINE`

**Location:** repo-wide; visible in app code, but not visible in infrastructure config

**Evidence:** the app performs outbound fetches and heavy headless scans, but there is no visible network policy, egress allowlist, or runtime sandboxing configuration in the repo.

**Impact:** if the application-layer SSRF checks fail, there is no visible second layer in repo code to contain abuse.

**Why it violates best practice:** the Next.js security guidance recommends honest uncertainty when protections may live in infrastructure. Here that protection is not visible in code and should be verified externally.

**Fix:** verify platform/network controls for the Railway scanner and Vercel runtime: deny private RFC1918/link-local egress, block metadata endpoints, and set request concurrency/timeout guardrails.

## Notes

- I did not find evidence of client-side secret exposure through `NEXT_PUBLIC_*` values beyond expected public Supabase/Lemon Squeezy URLs.
- I did not find unsafe DOM sinks with attacker-controlled content in the React UI code; the only visible `dangerouslySetInnerHTML` usage is for a static style block.

