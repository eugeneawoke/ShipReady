import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveUserPlanAccess } from '../lib/auth'

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
