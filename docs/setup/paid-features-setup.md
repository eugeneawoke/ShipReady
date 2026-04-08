# Paid Features Setup

Этот чеклист нужен, чтобы обещанные платные фичи реально работали в проде:

- PDF export
- Weekly monitoring
- Email alerts

## 1. Supabase

1. Убедиться, что проект Supabase уже привязан к приложению.
2. Применить миграции, включая monitoring schema:

```bash
npx supabase db push
```

3. Проверить, что появились:
   - таблица `monitored_domains`
   - поля `scans.monitored_domain_id`
   - поля `scans.baseline_scan_id`
   - поле `scans.trigger`

## 2. Resend

1. Создать/открыть проект в [Resend](https://resend.com).
2. Добавить и верифицировать sender domain, например `shipready.app`.
3. Создать sender address, например `alerts@shipready.app`.
4. Скопировать API key.

Нужные env:

```bash
RESEND_API_KEY=...
RESEND_FROM_EMAIL="ShipReady <alerts@shipready.app>"
```

## 3. Railway scanner

1. Убедиться, что Railway scanner доступен публично по HTTPS.
2. Проверить, что route `${RAILWAY_SCANNER_URL}/api/run-scan` принимает:
   - `Authorization: Bearer ${SCANNER_SECRET}`
   - `{ scanId, url }`
3. Задать одинаковый `SCANNER_SECRET`:
   - в Vercel
   - в Railway

Нужные env:

```bash
RAILWAY_SCANNER_URL=https://your-railway-app.railway.app
SCANNER_SECRET=...
```

## 4. Vercel

В проекте Vercel задать env variables:

```bash
NEXT_PUBLIC_APP_URL=https://shipready.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_SCAN_MODEL=gpt-4o-mini
LEMON_SQUEEZY_API_KEY=...
LEMON_SQUEEZY_WEBHOOK_SECRET=...
NEXT_PUBLIC_LS_PRO_URL=...
NEXT_PUBLIC_LS_AGENCY_URL=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL="ShipReady <alerts@shipready.app>"
CRON_SECRET=...
RAILWAY_SCANNER_URL=https://your-railway-app.railway.app
SCANNER_SECRET=...
```

После этого redeploy.

## 5. Vercel cron

`vercel.json` уже содержит weekly cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/rescan",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

Проверить:

1. `CRON_SECRET` задан в Vercel.
2. Vercel deployment свежий и содержит этот `vercel.json`.
3. Route `/api/cron/rescan` отвечает `401`, если вызвать её без правильных cron headers.

## 6. Lemon Squeezy

Чтобы feature gating работал на проде:

1. Создать продукты:
   - `Pro` — `$14/mo`
   - `Agency` — `$39/mo`
2. Получить checkout URLs и записать:

```bash
NEXT_PUBLIC_LS_PRO_URL=...
NEXT_PUBLIC_LS_AGENCY_URL=...
```

3. Настроить webhook на:

```text
https://shipready.app/api/webhooks/ls
```

4. Записать webhook secret в:

```bash
LEMON_SQUEEZY_WEBHOOK_SECRET=...
```

## 7. Manual verification

### PDF export

1. Купить/включить `Pro` или `Agency`.
2. Запустить scan.
3. Открыть report.
4. Нажать `PDF`.
5. Для `Agency` проверить `?whiteLabel=1`.

### Weekly monitoring

1. Войти под `Pro`/`Agency`.
2. Открыть dashboard.
3. Включить `Enable weekly monitoring` у домена.
4. Проверить в Supabase, что в `monitored_domains` появилась запись.

### Email alerts

1. Для monitored domain вручную вызвать cron с корректными headers/secret.
2. Дождаться завершения cron-triggered scan.
3. Проверить:
   - `scans.trigger = 'cron'`
   - `scans.baseline_scan_id` заполнен
   - если score упал >10 или появились новые `critical/high`, письмо пришло
   - `monitored_domains.last_alerted_at` обновился

## 8. Notes

- Первый weekly scan после включения monitoring использует последний завершённый scan по домену как baseline.
- Alerts отправляются только для monitored cron scans, а не для обычных ручных запусков.
- Если `RESEND_API_KEY` или `RESEND_FROM_EMAIL` не заданы, alert path не должен считаться продово готовым.
