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
    utm_source: ' Newsletter ',
    utm_medium: 'Email',
    utm_campaign: 'Launch',
    utm_content: 'Hero.CTA',
    utm_term: 'Audit_2026',
    ref: 'Partner-01',
    promo: 'BETA50',
    ignored: 'value',
  })

  assert.deepEqual(buildAttributionFromSearchParams(params), {
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'launch',
    utm_content: 'hero.cta',
    utm_term: 'audit_2026',
    referral_code: 'partner-01',
    promo_code: 'beta50',
  })
})

test('buildAttributionFromSearchParams rejects unsafe and oversized attribution fields', () => {
  const params = new URLSearchParams({
    utm_source: '../newsletter',
    utm_medium: 'email/list',
    utm_campaign: 'a'.repeat(65),
    utm_content: 'Safe-Content',
    ref: '../../partner',
    promo: 'promo code',
  })

  assert.deepEqual(buildAttributionFromSearchParams(params), {
    utm_content: 'safe-content',
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

test('effectivePlanFromSources prefers profile plans, agency grants, pro grants, then free', () => {
  const now = new Date('2026-05-10T12:00:00.000Z')
  const activeProGrant = { granted_plan: 'pro' as const, starts_at: '2026-05-01T00:00:00.000Z', expires_at: '2026-06-01T00:00:00.000Z' }
  const activeAgencyGrant = { granted_plan: 'agency' as const, starts_at: '2026-05-01T00:00:00.000Z', expires_at: '2026-06-01T00:00:00.000Z' }
  const inactiveAgencyGrant = { granted_plan: 'agency' as const, revoked_at: '2026-05-02T00:00:00.000Z' }

  assert.deepEqual(effectivePlanFromSources({ profilePlan: 'agency', grants: [activeProGrant], now }), {
    plan: 'agency',
    source: 'profile',
    activeGrant: null,
  })
  assert.deepEqual(effectivePlanFromSources({ profilePlan: 'pro', grants: [activeAgencyGrant], now }), {
    plan: 'pro',
    source: 'profile',
    activeGrant: null,
  })
  assert.deepEqual(effectivePlanFromSources({ profilePlan: 'free', grants: [activeProGrant, activeAgencyGrant], now }), {
    plan: 'agency',
    source: 'beta_grant',
    activeGrant: activeAgencyGrant,
  })
  assert.deepEqual(effectivePlanFromSources({ profilePlan: 'free', grants: [activeProGrant, inactiveAgencyGrant], now }), {
    plan: 'pro',
    source: 'beta_grant',
    activeGrant: activeProGrant,
  })
  assert.deepEqual(effectivePlanFromSources({ profilePlan: null, grants: [inactiveAgencyGrant], now }), {
    plan: 'free',
    source: 'free',
    activeGrant: null,
  })
})
