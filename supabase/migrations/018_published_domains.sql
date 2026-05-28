-- Published domain pages for programmatic SEO
-- Each row = one admin-published canonical page for a domain

CREATE TABLE published_domains (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain              TEXT NOT NULL UNIQUE,
  slug                TEXT NOT NULL UNIQUE,
  title               TEXT,
  description         TEXT,
  latest_scan_id      UUID REFERENCES scans(id) ON DELETE SET NULL,
  ai_readiness_score  FLOAT,
  category            TEXT,
  is_published        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_published_domains_slug       ON published_domains(slug);
CREATE INDEX idx_published_domains_published  ON published_domains(is_published) WHERE is_published = true;
CREATE INDEX idx_published_domains_ai_score   ON published_domains(ai_readiness_score DESC) WHERE is_published = true;

ALTER TABLE published_domains ENABLE ROW LEVEL SECURITY;

-- Anonymous readers can see published rows
CREATE POLICY "public read published_domains"
  ON published_domains FOR SELECT
  USING (is_published = true);

-- Writes only via service role (no user-level policy)
