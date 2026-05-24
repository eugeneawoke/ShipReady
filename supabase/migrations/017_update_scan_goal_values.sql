-- 017_update_scan_goal_values.sql
-- Phase 2 renamed ScanGoal: seo|security|ai_visibility|full (was sales|leads|traffic|visibility|general)
-- Old constraint rejects all new values → INSERT 500 on every scan start.

ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_scan_goal_check;

ALTER TABLE scans
  ADD CONSTRAINT scans_scan_goal_check
    CHECK (scan_goal IS NULL OR scan_goal IN ('seo', 'security', 'ai_visibility', 'full'));
