CREATE TABLE audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  company_name text NOT NULL,
  company_website text NOT NULL,
  scan_id uuid REFERENCES scans(id),
  editorial_json jsonb,
  editorial_summary text,
  og_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX audit_reports_published_idx ON audit_reports(status, published_at DESC) WHERE status = 'published';

ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_reports_public_read" ON audit_reports
  FOR SELECT USING (status = 'published');
