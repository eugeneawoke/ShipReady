import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAttributionFromSearchParams,
  effectivePlanFromSources,
  isGrantActive,
  normalizeCampaignCode,
} from '../lib/growth/attribution'

test('buildAttributionFromSearchParams keeps campaign and referral fields', () => {
  const params = new URLSearchParams({
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'launch',
    utm_content: 'hero',
    utm_term: 'audit',
    ref: 'Partner-01',
    promo: 'BETA50',
    ignored: 'value',
  })

  assert.deepEqual(buildAttributionFromSearchParams(params), {
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'launch',
    utm_content: 'hero',
    utm_term: 'audit',
    referral_code: 'partner-01',
    promo_code: 'beta50',
  })
})

test('normalizeCampaignCode accepts safe codes and rejects unsafe codes', () => {
  assert.equal(normalizeCampaignCode(' Partner-01 '), 'partner-01')
  assert.equal(normalizeCampaignCode('SPRING_2026.early'), 'spring_2026.early')

  assert.equal(normalizeCampaignCode(''), null)
  assert.equal(normalizeCampaignCode('   '), null)
  assert.equal(normalizeCampaignCode('../secret'), null)
  assert.equal(normalizeCampaignCode('promo/code'), null)
  assert.equal(normalizeCampaignCode('a'.repeat(65)), null)
})

test('isGrantActive respects starts_at, expires_at, and revoked_at', () => {
  const now = new Date('2026-05-10T12:00:00.000Z')

  assert.equal(isGrantActive({
    starts_at: '2026-05-01T00:00:00.000Z',
    expires_at: '2026-06-01T00:00:00.000Z',
    revoked_at: null,
  }, now), true)
  assert.equal(isGrantActive({ starts_at: '2026-05-11T00:00:00.000Z' }, now), false)
  assert.equal(isGrantActive({ expires_at: '2026-05-10T11:59:59.000Z' }, now), false)
  assert.equal(isGrantActive({ revoked_at: '2026-05-10T00:00:00.000Z' }, now), false)
})

test('effectivePlanFromSources prefers agency, profile pro, active beta grant, then free', () => {
  const now = new Date('2026-05-10T12:00:00.000Z')
  const activeGrant = { starts_at: '2026-05-01T00:00:00.000Z', expires_at: '2026-06-01T00:00:00.000Z' }

  assert.equal(effectivePlanFromSources({ profilePlan: 'agency', betaGrant: activeGrant, now }), 'agency')
  assert.equal(effectivePlanFromSources({ profilePlan: 'pro', betaGrant: activeGrant, now }), 'pro')
  assert.equal(effectivePlanFromSources({ profilePlan: 'free', betaGrant: activeGrant, now }), 'pro')
  assert.equal(effectivePlanFromSources({ profilePlan: 'free', betaGrant: { revoked_at: '2026-05-02T00:00:00.000Z' }, now }), 'free')
  assert.equal(effectivePlanFromSources({ profilePlan: null, betaGrant: null, now }), 'free')
})
