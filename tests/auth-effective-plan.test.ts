import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { resolveUserPlanAccess } from '../lib/growth/attribution'

test('resolveUserPlanAccess returns beta grant details when a free profile has an active grant', () => {
  const now = new Date('2026-05-10T12:00:00.000Z')
  const grant = {
    id: 'grant-1',
    granted_plan: 'pro' as const,
    grant_reason: 'beta_launch',
    starts_at: '2026-05-01T00:00:00.000Z',
    expires_at: '2026-06-01T00:00:00.000Z',
    revoked_at: null,
  }

  assert.deepEqual(resolveUserPlanAccess('free', [grant], now), {
    effectivePlan: 'pro',
    planSource: 'beta_grant',
    activeBetaGrant: {
      id: 'grant-1',
      grantedPlan: 'pro',
      grantReason: 'beta_launch',
      startsAt: '2026-05-01T00:00:00.000Z',
      expiresAt: '2026-06-01T00:00:00.000Z',
    },
  })
})

test('resolveUserPlanAccess keeps paid profile plan as the source over grants', () => {
  const now = new Date('2026-05-10T12:00:00.000Z')

  assert.deepEqual(resolveUserPlanAccess('agency', [{
    id: 'grant-2',
    granted_plan: 'pro',
    grant_reason: 'beta_launch',
    starts_at: '2026-05-01T00:00:00.000Z',
    expires_at: null,
    revoked_at: null,
  }], now), {
    effectivePlan: 'agency',
    planSource: 'profile',
    activeBetaGrant: null,
  })
})

test('growth grant issuance is delegated to the transactional database function', () => {
  const root = process.cwd()
  const migration = readFileSync(join(root, 'supabase/migrations/014_growth_referrals.sql'), 'utf8')
  const auth = readFileSync(join(root, 'lib/auth.ts'), 'utf8')

  assert.match(migration, /create or replace function grant_beta_access_from_growth_attribution/i)
  assert.match(migration, /security definer/i)
  assert.match(migration, /pg_advisory_xact_lock/i)
  assert.match(migration, /uses_count\s*=\s*uses_count\s*\+\s*1/i)
  assert.match(auth, /\.rpc\('grant_beta_access_from_growth_attribution'/)
  assert.doesNotMatch(auth, /\.from\('beta_access_grants'\)\s*\n\s*\.insert\(/)
})

test('auth callback cannot grant from client-controlled attribution fallback', () => {
  const root = process.cwd()
  const auth = readFileSync(join(root, 'lib/auth.ts'), 'utf8')
  const callback = readFileSync(join(root, 'app/auth/callback/route.ts'), 'utf8')

  assert.match(callback, /const ANONYMOUS_COOKIE = 'sr_aid'/)
  assert.match(callback, /request\.cookies\.get\(ANONYMOUS_COOKIE\)/)
  assert.doesNotMatch(callback, /bindGrowthAttributionForUser\(\s*user\.id,[\s\S]*parseAttributionCookie/)

  assert.match(auth, /fallbackAttribution/)
  assert.match(auth, /maybeCreateBetaGrantForServerVisit/)
  assert.doesNotMatch(auth, /maybeCreateBetaGrantForAttribution\(userId,\s*attribution\)/)
})
