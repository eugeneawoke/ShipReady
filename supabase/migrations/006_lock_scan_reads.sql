-- Authenticated scans are private to their owner.
-- Anonymous scans remain readable by id so the public report flow still works.
DROP POLICY IF EXISTS "public read by id" ON scans;

CREATE POLICY "read public anonymous or own scans" ON scans
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );
