#!/usr/bin/env node
/**
 * Merges Vitest JSON report + Playwright JSON report into reports/combined.json
 * Run after: npm run test:unit && npm run test:e2e
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'

const VITEST_PATH = 'reports/vitest.json'
const PW_PATH = 'reports/playwright.json'
const OUT_PATH = 'reports/combined.json'

function parseVitest(raw) {
  // Vitest JSON reporter format
  const data = JSON.parse(raw)
  const suites = data.testResults ?? []
  let passed = 0, failed = 0, duration = 0
  const failures = []

  for (const suite of suites) {
    for (const test of suite.assertionResults ?? []) {
      if (test.status === 'passed') passed++
      else {
        failed++
        failures.push({
          file: suite.testFilePath?.split('/tests/')[1] ?? suite.testFilePath,
          name: test.fullName ?? test.title,
          message: test.failureMessages?.[0]?.split('\n')[0] ?? 'failed',
        })
      }
    }
    duration += suite.endTime - suite.startTime || 0
  }

  return { runner: 'Vitest', passed, failed, total: passed + failed, durationMs: duration, failures }
}

function parsePlaywright(raw) {
  const data = JSON.parse(raw)
  let passed = 0, failed = 0, duration = 0
  const failures = []

  function walkSuites(suites) {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          const ok = test.results?.every(r => r.status === 'passed' || r.status === 'skipped')
          if (ok) passed++
          else {
            failed++
            failures.push({
              file: suite.file ?? spec.file ?? '',
              name: spec.title,
              message: test.results?.[0]?.error?.message?.split('\n')[0] ?? 'failed',
            })
          }
          duration += test.results?.reduce((sum, r) => sum + (r.duration ?? 0), 0) ?? 0
        }
      }
      walkSuites(suite.suites)
    }
  }

  walkSuites(data.suites)
  return { runner: 'Playwright', passed, failed, total: passed + failed, durationMs: duration, failures }
}

const combined = {
  generatedAt: new Date().toISOString(),
  suites: [],
}

if (existsSync(VITEST_PATH)) {
  try {
    combined.suites.push(parseVitest(readFileSync(VITEST_PATH, 'utf8')))
  } catch (e) {
    combined.suites.push({ runner: 'Vitest', error: e.message })
  }
} else {
  console.warn('[merge-reports] vitest.json not found — skipping')
}

if (existsSync(PW_PATH)) {
  try {
    combined.suites.push(parsePlaywright(readFileSync(PW_PATH, 'utf8')))
  } catch (e) {
    combined.suites.push({ runner: 'Playwright', error: e.message })
  }
} else {
  console.warn('[merge-reports] playwright.json not found — skipping')
}

const totalPassed = combined.suites.reduce((s, r) => s + (r.passed ?? 0), 0)
const totalFailed = combined.suites.reduce((s, r) => s + (r.failed ?? 0), 0)
combined.summary = { passed: totalPassed, failed: totalFailed, ok: totalFailed === 0 }

writeFileSync(OUT_PATH, JSON.stringify(combined, null, 2))
console.log(`[merge-reports] ✓ ${OUT_PATH} written — ${totalPassed} passed, ${totalFailed} failed`)
if (totalFailed > 0) process.exit(1)
