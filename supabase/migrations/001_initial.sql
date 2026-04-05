CREATE TABLE scans (
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

CREATE POLICY "public read by id" ON scans FOR SELECT USING (true);
CREATE POLICY "insert allowed"    ON scans FOR INSERT WITH CHECK (true);
CREATE POLICY "update own"        ON scans FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);
