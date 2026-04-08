# ShipReady

Pre-deploy quality gate for vibe-coded apps. ShipReady scans a live URL and produces a report across performance, SEO, security, mobile, and AI visibility. The product is being upgraded toward a trust-first model: only confirmed findings should affect score, slower checks must report "could not verify" instead of inventing healthy results, and AI acts as enrichment over evidence rather than as the source of truth.

## Stack

- Next.js 16 App Router
- React 19
- Supabase for auth + Postgres
- Railway scanner for heavy Lighthouse/Chromium work
- Vercel for frontend and lightweight route handlers

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

See [`.env.example`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/.env.example).

Core variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `RAILWAY_SCANNER_URL`
- `SCANNER_SECRET`
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_LS_PRO_URL`
- `NEXT_PUBLIC_LS_AGENCY_URL`

## Scan flow

Current production flow:

1. `POST /api/scan` validates URL safety, applies quota checks, creates a `pending` scan, and dispatches the job to Railway.
2. Railway hits `/api/run-scan` with `Authorization: Bearer ${SCANNER_SECRET}`.
3. The scanner runs deterministic checks plus optional AI summary generation.
4. Results are written back to Supabase and polled from `/report/[id]`.

Target flow for the next quality pass:

1. `Fast Truth Pass` runs verified checks from a shared fetch context and saves partial results quickly.
2. `Deep Pass` runs Lighthouse and slower/less certain checks without blocking initial truthful feedback.
3. `AI enrichment` rewrites and prioritizes findings from evidence only; it does not invent score-bearing issues.
4. Public UX avoids exact timing promises until telemetry is available for real `p50/p95` scan durations.

## Paid features

- `PDF export` is available through `GET /api/report/[id]/pdf` for authenticated `pro` and `agency` users.
- `Weekly monitoring` is managed from the dashboard. Users can enable monitoring per scanned domain; Vercel cron rescans active monitored domains every Monday at 09:00 UTC.
- `Email alerts` are sent through Resend when a monitored weekly scan introduces new `critical/high` issues or drops total score by more than 10 points.

## Quality model

- Findings are moving to three confidence levels: `verified`, `likely`, `heuristic`.
- Only `verified` findings should affect category and total scores.
- Heavy checks such as Lighthouse must expose a measurement status like `measured` vs `unavailable`; a failed measurement must never silently look healthy.
- Anonymous scans remain readable by report URL; authenticated scans remain private to the owner.

## Access model

- Anonymous scans are readable by report URL.
- Authenticated scans are private to the owner.
- Badge lookups only expose anonymous/public scan data under the current RLS model.

## Verification

```bash
npm run lint
npm run build
```

## Production setup

Service-by-service setup is documented in [`docs/setup/paid-features-setup.md`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/docs/setup/paid-features-setup.md).
