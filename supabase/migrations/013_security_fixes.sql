-- Add expiry to team invites (7-day TTL)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz;

-- Atomic rate-limit check + increment — eliminates TOCTOU race
CREATE OR REPLACE FUNCTION consume_api_key_quota(p_key_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key api_keys%ROWTYPE;
  v_today date := current_date;
BEGIN
  SELECT * INTO v_key FROM api_keys WHERE key_hash = p_key_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_key');
  END IF;
  IF v_key.last_reset_at IS NULL OR v_key.last_reset_at < v_today THEN
    UPDATE api_keys SET calls_today = 0, last_reset_at = v_today WHERE id = v_key.id;
    v_key.calls_today := 0;
  END IF;
  IF v_key.calls_today >= v_key.daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'daily_limit', v_key.daily_limit
    );
  END IF;
  UPDATE api_keys SET calls_today = calls_today + 1 WHERE id = v_key.id;
  RETURN jsonb_build_object(
    'allowed', true,
    'user_id', v_key.user_id,
    'plan', v_key.plan,
    'key_id', v_key.id
  );
END;
$$;

-- Atomic seat-limit enforcement — eliminates TOCTOU race on team inserts
CREATE OR REPLACE FUNCTION enforce_team_seat_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM team_members WHERE owner_user_id = NEW.owner_user_id) >= 5 THEN
    RAISE EXCEPTION 'team_seat_limit_reached';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_team_seat_limit ON team_members;
CREATE TRIGGER check_team_seat_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION enforce_team_seat_limit();
