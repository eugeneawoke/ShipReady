# PayPro Global Integration

PayPro Global acts as Merchant of Record for ShipReady's Pro subscription billing.

---

## Architecture

```
User clicks "Get Pro (Monthly | Yearly)"
  → POST /api/payments/paypro/create-checkout  (requires auth session)
  → returns { url }
  → client redirects to PayPro hosted checkout
  → URL includes x-user-id=UUID + billing-email + products[1][id]

  → PayPro processes payment
  → PayPro POSTs IPN to /api/payments/paypro/webhook
  → Webhook: verify SHA256 SIGNATURE
      invalid → 401 (no DB write)
      valid   → INSERT INTO payment_events ON CONFLICT DO NOTHING (idempotency)
              → if duplicate: return 200 immediately
              → call handlePayProEvent
              → upsert subscriptions row
              → return 200

Effective plan resolution (read time, not write time):
  getEffectivePlanForUserId(userId)
    1. active paid subscription (subscriptions WHERE status='active' AND period_end > now) → 'pro', source: 'billing'
    2. active beta grant (beta_access_grants, not revoked, not expired) → granted_plan, source: 'beta_grant'
    3. profiles.plan (manual admin override) → source: 'profile'
    4. fallback → 'free'
```

**State ownership rules (critical):**
- `subscriptions` — written only by PayPro webhook. Never by growth/beta system.
- `beta_access_grants` — written only by growth system. Never by PayPro webhook.
- `profiles.plan` — written only by admin. Never updated automatically.
- Effective plan is always computed at read time. Never cached.

---

## Products

| Plan ID | PayPro Product ID env var | Price | Interval |
|---------|--------------------------|-------|---------|
| `pro_monthly` | `PAYPRO_PRODUCT_PRO_MONTHLY` | $14 | monthly |
| `pro_yearly` | `PAYPRO_PRODUCT_PRO_YEARLY` | $140 | yearly |

Agency plan: manual arrangement only. No PayPro checkout.

---

## Environment Variables

```env
PAYPRO_VALIDATION_KEY=        # Store Settings → General Settings → Integration → Validation Key
PAYPRO_SECRET_KEY=            # Same key, also used for test-mode checkout URL (secret-key param)
PAYPRO_VENDOR_ID=             # Account Settings → Business Info (for REST API, not used yet)
PAYPRO_SANDBOX=true           # Set to false for live payments
PAYPRO_PRODUCT_PRO_MONTHLY=   # Integer product ID from PayPro dashboard
PAYPRO_PRODUCT_PRO_YEARLY=    # Integer product ID from PayPro dashboard
```

---

## Checkout URL Parameters

Base: `https://store.payproglobal.com/checkout`

| Parameter | Value |
|-----------|-------|
| `products[1][id]` | PayPro product ID |
| `products[1][qty]` | `1` |
| `billing-email` | User email |
| `billing-first-name` | From user metadata (optional) |
| `x-user-id` | Internal user UUID → returned in IPN as `ORDER_CUSTOM_FIELDS` |
| `enable-auto-renewal` | `true` |
| `use-test-mode` | `true` (sandbox only) |
| `secret-key` | `PAYPRO_SECRET_KEY` (sandbox only) |

**Success/cancel redirect** — configured in PayPro dashboard (Store Settings → Page Templates → Thank You Page Redirect):
- Fulfilled: `https://ship-ready.vercel.app/dashboard?payment=success`
- Declined: `https://ship-ready.vercel.app/pricing?payment=failed`

---

## Webhook IPN

**URL:** `POST /api/payments/paypro/webhook`
**Content-Type:** `application/x-www-form-urlencoded`
**Runtime:** `nodejs` (not edge)

PayPro retries 3× every 30 minutes on non-200 response. Always return 200 for valid payloads (errors logged in `payment_events`). Return 401 only for invalid signatures.

### Signature Verification

```
SIGNATURE = sha256(ORDER_ID + ORDER_STATUS + ORDER_TOTAL_AMOUNT + CUSTOMER_EMAIL + VALIDATION_KEY + TEST_MODE + IPN_TYPE_NAME)
```

Fields concatenated with **no separator**. Comparison is case-insensitive hex.

In test mode: HASH is always `c4ca4238a0b923820dcc509a6f75849b` (md5 of "1"). The webhook verifies SIGNATURE first; falls back to HASH check in test mode.

### Custom Field Parsing

`ORDER_CUSTOM_FIELDS` arrives as a raw string: `"x-user-id=UUID"`. Parse via `URLSearchParams` to extract `x-user-id`.

### IPN Event Types

| IPN_TYPE_ID | IPN_TYPE_NAME | Action |
|-------------|---------------|--------|
| 1 | OrderCharged | Activate subscription |
| 13 | TrialCharge | Activate subscription |
| 6 | SubscriptionChargeSucceed | Renew (extend period_end) |
| 9 | SubscriptionRenewed | Renew (extend period_end) |
| 4 | OrderDeclined | Set status = payment_failed |
| 7 | SubscriptionChargeFailed | Set status = payment_failed |
| 8 | SubscriptionSuspended | Set status = suspended |
| 10 | SubscriptionTerminated | Set status = terminated |
| 11 | SubscriptionFinished | Set status = finished |
| 2 | OrderRefunded | Set status = refunded |
| 3 | OrderChargedBack | Set status = chargedback |
| 5, 14, 15, 21 | (various) | Log only, no upsert |

`SUBSCRIPTION_NEXT_CHARGE_DATE` = next charge date = end of current billing period → stored as `current_period_end`.

---

## Database Schema

### `subscriptions` table

```sql
CREATE TABLE subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                  TEXT NOT NULL DEFAULT 'payproglobal',
  external_customer_id      TEXT,
  external_subscription_id  TEXT,
  external_order_id         TEXT,
  external_product_id       TEXT,
  plan_id                   TEXT NOT NULL CHECK (plan_id IN ('pro_monthly', 'pro_yearly')),
  status                    TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('active','suspended','terminated','finished',
                                              'refunded','chargedback','payment_failed','pending')),
  billing_interval          TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)  -- one active sub per provider per user
);
```

### `payment_events` table

```sql
CREATE TABLE payment_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL DEFAULT 'payproglobal',
  external_event_id TEXT NOT NULL,    -- ORDER_ID
  event_type        TEXT NOT NULL,    -- IPN_TYPE_NAME
  user_id           UUID REFERENCES auth.users(id),
  payload_json      JSONB NOT NULL,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (processing_status IN ('ok','error','skipped','pending')),
  error_message     TEXT,
  UNIQUE (provider, external_event_id, event_type)  -- idempotency key
);
```

RLS: both tables use `TO service_role` policies. Webhook route uses service-role client exclusively.

---

## File Map

```
lib/payments/paypro/
  config.ts        — PAYPRO_PLANS, plan config, isSandboxMode()
  signature.ts     — verifyPayProSignature (SHA256), verifyPayProHash (MD5), verifyIpnRequest
  mapper.ts        — PayProIpnPayload interface, parseIpnPayload()
  checkout.ts      — createCheckoutUrl()
  handler.ts       — handlePayProEvent() → upserts subscriptions

app/api/payments/paypro/
  webhook/route.ts            — IPN endpoint
  create-checkout/route.ts    — Checkout initiation (auth required)

lib/auth.ts  — getEffectivePlanForUserId() extended to check subscriptions

supabase/migrations/015_paypro_billing.sql
```

---

## PayPro Dashboard Setup

1. Create **Pro Monthly** product → copy integer product ID → `PAYPRO_PRODUCT_PRO_MONTHLY`
2. Create **Pro Yearly** product → `PAYPRO_PRODUCT_PRO_YEARLY`
3. Store Settings → General Settings → Integration → copy **Validation Key** → `PAYPRO_VALIDATION_KEY` (= `PAYPRO_SECRET_KEY`)
4. IPN URL (global): `https://ship-ready.vercel.app/api/payments/paypro/webhook`
5. Per-product IPN URL (Pro Monthly and Pro Yearly): same webhook URL
6. Store Settings → Page Templates → Thank You Page Redirect:
   - Fulfilled: `https://ship-ready.vercel.app/dashboard?payment=success`
   - Declined: `https://ship-ready.vercel.app/pricing?payment=failed`
7. Apply migration 015 to production Supabase
8. Set all `PAYPRO_*` env vars in Vercel
9. Run sandbox end-to-end test (see Testing section)
10. Set `PAYPRO_SANDBOX=false` for live payments

---

## Testing (Sandbox)

Set `PAYPRO_SANDBOX=true` and configure sandbox product IDs.

1. **Checkout flow:** Click "Get Pro (Monthly)" on pricing page → verify redirect to `store.payproglobal.com/checkout?products[1][id]=...&x-user-id=UUID&billing-email=...`
2. **Purchase:** Complete test purchase → verify:
   - IPN arrives at `/api/payments/paypro/webhook`
   - `payment_events` row: `processing_status = 'ok'`
   - `subscriptions` row: `status = 'active'`
   - `getEffectivePlanForUserId()` returns `{ effectivePlan: 'pro', planSource: 'billing' }`
3. **Idempotency:** Replay same IPN → 200 returned, no duplicate row
4. **Invalid signature:** Tampered SIGNATURE → 401, no DB write
5. **Termination:** `SubscriptionTerminated` IPN → `subscriptions.status = 'terminated'` → effective plan falls through to beta grant or free
6. **Refund:** `OrderRefunded` IPN → `status = 'refunded'`; `OrderChargedBack` → `status = 'chargedback'`
7. **Renewal:** `SubscriptionChargeSucceed` IPN → `current_period_end` extended

Use PayPro dashboard → Developer Tool → IPN Simulator to send test events to the webhook endpoint.

---

## Cancellation

PayPro does not provide a customer self-service portal URL. Users must cancel by emailing `support@shipready.app`. Cancellation takes effect at end of the current billing period. This is stated in the dashboard billing panel and in the Terms of Service.

---

## Security Invariants

1. Webhook writes only to `subscriptions` and `payment_events`. Never touches `beta_access_grants`, `profiles`, or any other table.
2. Invalid SIGNATURE → 401 (no DB write). Valid payload with processing error → 200 + error logged in `payment_events`.
3. If `userId` is null in IPN → mark event `skipped`, return 200, never partially process.
4. Idempotency via `INSERT ON CONFLICT (provider, external_event_id, event_type) DO NOTHING`.
5. Service role client used exclusively in webhook handler.
