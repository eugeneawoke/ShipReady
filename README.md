# ShipReady

Pre-deploy quality gate for vibe-coded apps. ShipReady scans a live URL and produces a report across performance, SEO, security, mobile, and AI visibility, with AI-generated fix prompts for paid plans.

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
- `CRON_SECRET`
- `RAILWAY_SCANNER_URL`
- `SCANNER_SECRET`

## Scan flow

1. `POST /api/scan` validates URL safety, applies quota checks, creates a `pending` scan, and dispatches the job to Railway.
2. Railway hits `/api/run-scan` with `Authorization: Bearer ${SCANNER_SECRET}`.
3. The scanner runs deterministic checks plus optional AI summary generation.
4. Results are written back to Supabase and polled from `/report/[id]`.

## Access model

- Anonymous scans are readable by report URL.
- Authenticated scans are private to the owner.
- Badge lookups only expose anonymous/public scan data under the current RLS model.

## Verification

```bash
npm run lint
npm run build
```
