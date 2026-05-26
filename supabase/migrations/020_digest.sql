-- Weekly digest: track when last digest was sent and what baseline was used
ALTER TABLE monitored_domains
  ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS digest_baseline_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL;
