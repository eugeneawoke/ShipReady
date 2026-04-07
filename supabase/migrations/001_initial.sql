CREATE TABLE IF NOT EXISTS scans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url        TEXT NOT NULL,
  status     TEXT DEFAULT 'pending'
             CHECK (status IN ('pending','running','done','error')),
  results    JSONB,
  user_id    UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read by id" ON scans;
CREATE POLICY "public read by id" ON scans FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert allowed" ON scans;
CREATE POLICY "insert allowed" ON scans FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "update own" ON scans;
CREATE POLICY "update own" ON scans FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);
