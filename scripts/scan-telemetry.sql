-- Scan latency distribution (completed scans only)
WITH completed AS (
  SELECT
    created_at,
    NULLIF(results->'timings'->>'htmlFetchMs', '')::numeric AS html_fetch_ms,
    NULLIF(results->'timings'->>'fastPassMs', '')::numeric AS fast_pass_ms,
    NULLIF(results->'timings'->>'deepPassMs', '')::numeric AS deep_pass_ms,
    NULLIF(results->'timings'->>'aiEnrichmentMs', '')::numeric AS ai_enrichment_ms,
    NULLIF(results->'timings'->>'totalMs', '')::numeric AS total_ms
  FROM scans
  WHERE status = 'done'
    AND results IS NOT NULL
)
SELECT
  percentile_cont(0.50) WITHIN GROUP (ORDER BY fast_pass_ms) AS fast_p50_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY fast_pass_ms) AS fast_p95_ms,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY fast_pass_ms) AS fast_p99_ms,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY total_ms) AS total_p50_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY total_ms) AS total_p95_ms,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY total_ms) AS total_p99_ms
FROM completed;

-- Scan failure rate by current status
SELECT
  status,
  COUNT(*) AS scans,
  ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM scans), 0), 2) AS pct
FROM scans
GROUP BY status
ORDER BY scans DESC;

-- Measurement availability snapshot
SELECT
  COALESCE(results->'performance'->'measurement'->>'status', 'missing') AS performance_measurement,
  COUNT(*) AS scans
FROM scans
WHERE results IS NOT NULL
GROUP BY 1
ORDER BY scans DESC;
