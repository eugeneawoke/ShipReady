-- Paid subscription billing state (PayPro only; beta grants live in beta_access_grants from 014)
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
                            CHECK (status IN ('active', 'suspended', 'terminated', 'finished', 'refunded', 'chargedback', 'payment_failed', 'pending')),
  billing_interval          TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_subscriptions_user_status ON subscriptions (user_id, status);

-- Audit log + idempotency key for all incoming IPN events
CREATE TABLE payment_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL DEFAULT 'payproglobal',
  external_event_id TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  user_id           UUID REFERENCES auth.users(id),
  payload_json      JSONB NOT NULL,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (processing_status IN ('ok', 'error', 'skipped', 'pending')),
  error_message     TEXT,
  UNIQUE (provider, external_event_id, event_type)
);

CREATE INDEX idx_payment_events_user ON payment_events (user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service role all on subscriptions" ON subscriptions
  TO service_role USING (true) WITH CHECK (true);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role all on payment_events" ON payment_events
  TO service_role USING (true) WITH CHECK (true);
