-- Tighten scans SELECT policy: restrict authenticated scans to their owner.
-- Anonymous scans (user_id IS NULL) remain readable by anyone with the UUID.
-- Service-role clients (badge, scanner, API) bypass RLS entirely and are unaffected.

DROP POLICY IF EXISTS "public read by id" ON scans;

CREATE POLICY "read own or anonymous" ON scans
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
