ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_status_check;

ALTER TABLE scans
ADD CONSTRAINT scans_status_check
CHECK (
  status IN (
    'pending',
    'running',
    'running_fast',
    'running_deep',
    'enriching',
    'done',
    'error'
  )
);
