-- Add ip_address column for anonymous scan rate limiting
ALTER TABLE scans ADD COLUMN IF NOT EXISTS ip_address TEXT;
CREATE INDEX IF NOT EXISTS scans_ip_created_idx
  ON scans (ip_address, created_at)
  WHERE ip_address IS NOT NULL;
