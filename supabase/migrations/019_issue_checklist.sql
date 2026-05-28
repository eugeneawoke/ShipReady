-- Issue checklist: authenticated users can mark issues as fixed or ignored
-- Status is per-user, per-scan, per-issue (not stored in scan result)

CREATE TABLE user_issue_status (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id    UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  issue_id   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open'
             CHECK (status IN ('open', 'fixed', 'ignored')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, scan_id, issue_id)
);

CREATE INDEX idx_user_issue_status_lookup ON user_issue_status(user_id, scan_id);

ALTER TABLE user_issue_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner read own statuses"
  ON user_issue_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "owner write own statuses"
  ON user_issue_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner update own statuses"
  ON user_issue_status FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "owner delete own statuses"
  ON user_issue_status FOR DELETE
  USING (user_id = auth.uid());
