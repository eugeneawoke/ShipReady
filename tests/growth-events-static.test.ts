import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readProjectFile(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

test('growth event route links events to latest server-side visit references', () => {
  const route = readProjectFile('app/api/growth/event/route.ts')

  assert.match(route, /\.from\('growth_visits'\)/)
  assert.match(route, /select\('id, campaign_id, referral_code_id'\)/)
  assert.match(route, /\.eq\('anonymous_id', anonymousId\)/)
  assert.match(route, /\.order\('created_at', \{ ascending: false \}\)/)
  assert.match(route, /visit_id: latestVisit\?\.id/)
  assert.match(route, /campaign_id: latestVisit\?\.campaign_id/)
  assert.match(route, /referral_code_id: latestVisit\?\.referral_code_id/)
})

test('growth activation events are emitted from product interaction points', () => {
  const scanForm = readProjectFile('components/landing/ScanForm.tsx')
  const reportPage = readProjectFile('app/report/[id]/page.tsx')
  const monitoringToggle = readProjectFile('components/dashboard/MonitoringToggle.tsx')
  const betaAccessPanel = readProjectFile('components/dashboard/BetaAccessPanel.tsx')

  for (const source of [scanForm, reportPage, monitoringToggle, betaAccessPanel]) {
    assert.match(source, /fetch\('\/api\/growth\/event'/)
    assert.match(source, /credentials: 'same-origin'/)
  }

  assert.match(scanForm, /trackGrowthEvent\('scan_started'/)
  assert.match(scanForm, /scanGoal/)
  assert.match(reportPage, /trackGrowthEvent\('pdf_export_clicked'/)
  assert.match(reportPage, /reportId/)
  assert.match(monitoringToggle, /trackGrowthEvent\('monitoring_enabled'/)
  assert.match(betaAccessPanel, /trackGrowthEvent\('referral_link_copied'/)
})

test('admin growth channels use linked visits and events for activation counts', () => {
  const admin = readProjectFile('app/admin/growth/page.tsx')

  assert.match(admin, /type GrowthVisitRow = \{[\s\S]*id: string[\s\S]*anonymous_id: string \| null[\s\S]*campaign_id: string \| null[\s\S]*referral_code_id: string \| null/)
  assert.match(admin, /type GrowthEventRow = \{[\s\S]*campaign_id: string \| null[\s\S]*referral_code_id: string \| null/)
  assert.match(admin, /scan_started/)
  assert.match(admin, /signup_started/)
  assert.match(admin, /pdf_export_clicked/)
  assert.match(admin, /monitoring_enabled/)
  assert.match(admin, /channelActivationRows/)
  assert.doesNotMatch(admin, /Signups and completed scans stay in overview\/activation/)
})
