-- Public badges are disabled by default. A scan should only be exposed by
-- /api/badge/[domain] after the owner explicitly opts in.
ALTER TABLE public.scans
ADD COLUMN IF NOT EXISTS badge_enabled BOOLEAN NOT NULL DEFAULT false;
