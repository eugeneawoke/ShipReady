-- Clarify payment_events timestamp semantics:
-- received_at = when IPN arrived (always set on insert)
-- processed_at = when handler finished (only set on ok/error/skipped)
ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: treat existing processed_at as received_at for pending rows
UPDATE payment_events
  SET received_at = processed_at
  WHERE received_at = now(); -- only newly added rows have received_at = now()

-- Make processed_at nullable — it now means "actual processing time"
ALTER TABLE payment_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

-- Backfill: pending/skipped/error rows had processed_at = insert time (misleading) → clear it
UPDATE payment_events
  SET processed_at = NULL
  WHERE processing_status IN ('pending', 'skipped', 'error');
