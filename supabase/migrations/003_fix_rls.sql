-- Fix UPDATE policy: only allow updating scans where the authenticated user
-- is the owner. Service role (scanner) bypasses RLS entirely, so this only
-- restricts direct client-side access.
DROP POLICY IF EXISTS "update own" ON scans;
CREATE POLICY "update own" ON scans FOR UPDATE
  USING (user_id IS NOT NULL AND user_id = auth.uid());
