CREATE TABLE IF NOT EXISTS monitored_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  notify_email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  last_alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, domain)
);

ALTER TABLE monitored_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own monitored domains" ON monitored_domains;
CREATE POLICY "users can read own monitored domains" ON monitored_domains
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can insert own monitored domains" ON monitored_domains;
CREATE POLICY "users can insert own monitored domains" ON monitored_domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can update own monitored domains" ON monitored_domains;
CREATE POLICY "users can update own monitored domains" ON monitored_domains
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can delete own monitored domains" ON monitored_domains;
CREATE POLICY "users can delete own monitored domains" ON monitored_domains
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS monitored_domain_id UUID REFERENCES monitored_domains(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS baseline_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trigger TEXT DEFAULT 'manual'
    CHECK (trigger IN ('manual', 'cron'));

CREATE INDEX IF NOT EXISTS monitored_domains_user_active_idx
  ON monitored_domains (user_id, active, domain);

CREATE INDEX IF NOT EXISTS scans_monitored_domain_created_idx
  ON scans (monitored_domain_id, created_at DESC)
  WHERE monitored_domain_id IS NOT NULL;
