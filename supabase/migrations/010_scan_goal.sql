-- 010_scan_goal.sql
-- Adds scan_goal column to scans table for business-context-aware audit recommendations

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS scan_goal text
    CHECK (scan_goal IN ('sales', 'leads', 'traffic', 'visibility', 'general'))
    DEFAULT NULL;
