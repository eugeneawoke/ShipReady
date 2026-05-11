import { createClient, createServiceClient } from '@/lib/supabase'
import {
  effectivePlanFromSources,
  normalizeCampaignCode,
  type AttributionPayload,
  type Plan,
} from '@/lib/growth/attribution'

type PlanSource = 'profile' | 'beta_grant'

type BetaGrantRow = {
  id: string
  granted_plan: 'pro' | 'agency' | null
  grant_reason: string
  starts_at: string
  expires_at: string | null
  revoked_at?: string | null
}

type CampaignRow = {
  id: string
  code: string
  default_plan: Plan
  grant_days: number
  max_grants: number | null
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
}

type ReferralCodeRow = {
  id: string
  code: string
  campaign_id: string | null
  grant_days: number | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
}

export type ActiveBetaGrant = {
  id: string
  grantedPlan: 'pro' | 'agency'
  grantReason: string
  expiresAt: string | null
  startsAt: string
}

export interface UserWithPlan {
  id: string
  email: string
  plan: Plan
  effectivePlan: Plan
  planSource: PlanSource
  activeBetaGrant: ActiveBetaGrant | null
  scansThisMonth: number
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isCampaignCurrentlyValid(campaign: CampaignRow | null | undefined, now = new Date()): campaign is CampaignRow {
  if (!campaign?.is_active) return false
  if (campaign.default_plan !== 'pro' && campaign.default_plan !== 'agency') return false

  const startsAt = parseDate(campaign.starts_at)
  if (campaign.starts_at && !startsAt) return false
  if (startsAt && startsAt > now) return false

  const expiresAt = parseDate(campaign.expires_at)
  if (campaign.expires_at && !expiresAt) return false
  if (expiresAt && expiresAt <= now) return false

  return true
}

function isReferralCodeCurrentlyValid(referralCode: ReferralCodeRow | null | undefined, now = new Date()): referralCode is ReferralCodeRow {
  if (!referralCode?.is_active) return false
  if (!referralCode.campaign_id) return false
  if (referralCode.max_uses !== null && referralCode.uses_count >= referralCode.max_uses) return false

  const expiresAt = parseDate(referralCode.expires_at)
  if (referralCode.expires_at && !expiresAt) return false
  if (expiresAt && expiresAt <= now) return false

  return true
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

export function resolveUserPlanAccess(
  profilePlan: Plan,
  grants: BetaGrantRow[] | null | undefined,
  now = new Date(),
): Pick<UserWithPlan, 'effectivePlan' | 'planSource' | 'activeBetaGrant'> {
  const result = effectivePlanFromSources({
    profilePlan,
    grants,
    now,
  })

  const activeGrant = result.source === 'beta_grant'
    ? (result.activeGrant as BetaGrantRow | null)
    : null

  return {
    effectivePlan: result.plan,
    planSource: result.source === 'beta_grant' ? 'beta_grant' : 'profile',
    activeBetaGrant: activeGrant
      ? {
          id: activeGrant.id,
          grantedPlan: activeGrant.granted_plan ?? 'pro',
          grantReason: activeGrant.grant_reason,
          startsAt: activeGrant.starts_at,
          expiresAt: activeGrant.expires_at ?? null,
        }
      : null,
  }
}

export async function getEffectivePlanForUserId(userId: string): Promise<Pick<UserWithPlan, 'effectivePlan' | 'planSource' | 'activeBetaGrant'>> {
  const supabase = createServiceClient()
  const now = new Date()

  const [{ data: profile }, { data: grants }] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single(),
    supabase
      .from('beta_access_grants')
      .select('id, granted_plan, grant_reason, starts_at, expires_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false }),
  ])

  return resolveUserPlanAccess(
    (profile?.plan as Plan) || 'free',
    grants as BetaGrantRow[] | null,
    now,
  )
}

async function findActiveCampaignByCode(code: string): Promise<CampaignRow | null> {
  const supabase = createServiceClient()
  const { data: campaign } = await supabase
    .from('growth_campaigns')
    .select('id, code, default_plan, grant_days, max_grants, starts_at, expires_at, is_active')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  return campaign as CampaignRow | null
}

async function findActiveReferralGrantSource(referralCode: string): Promise<{
  campaign: CampaignRow
  referralCode: ReferralCodeRow
} | null> {
  const supabase = createServiceClient()
  const { data: referral } = await supabase
    .from('referral_codes')
    .select('id, code, campaign_id, grant_days, max_uses, uses_count, expires_at, is_active')
    .eq('code', referralCode)
    .eq('is_active', true)
    .maybeSingle()

  const referralRow = referral as ReferralCodeRow | null
  if (!isReferralCodeCurrentlyValid(referralRow)) return null

  const { data: campaign } = await supabase
    .from('growth_campaigns')
    .select('id, code, default_plan, grant_days, max_grants, starts_at, expires_at, is_active')
    .eq('id', referralRow.campaign_id)
    .eq('is_active', true)
    .maybeSingle()

  const campaignRow = campaign as CampaignRow | null
  if (!isCampaignCurrentlyValid(campaignRow)) return null

  return { campaign: campaignRow, referralCode: referralRow }
}

async function campaignHasCapacity(campaign: CampaignRow): Promise<boolean> {
  if (campaign.max_grants === null) return true

  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('beta_access_grants')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .is('revoked_at', null)

  if (error) {
    console.error('[auth] campaign grant capacity check failed:', error.message)
    return false
  }

  return (count ?? 0) < campaign.max_grants
}

async function hasActiveDuplicateGrant(userId: string, campaignId: string, referralCodeId: string | null): Promise<boolean> {
  const supabase = createServiceClient()
  const nowIso = new Date().toISOString()
  let query = supabase
    .from('beta_access_grants')
    .select('id')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .limit(1)

  query = referralCodeId
    ? query.eq('referral_code_id', referralCodeId)
    : query.is('referral_code_id', null)

  const { data } = await query.maybeSingle()
  return Boolean(data)
}

async function createBetaGrantForAttribution(input: {
  userId: string
  campaign: CampaignRow
  grantReason: string
  referralCodeId?: string | null
  grantDays?: number | null
}) {
  const { userId, campaign, grantReason, referralCodeId = null } = input
  if (!await campaignHasCapacity(campaign)) return
  if (await hasActiveDuplicateGrant(userId, campaign.id, referralCodeId)) return

  const supabase = createServiceClient()
  const startsAt = new Date()
  const grantDays = input.grantDays ?? campaign.grant_days
  const expiresAt = grantDays > 0 ? addDays(startsAt, grantDays).toISOString() : null

  const { error } = await supabase
    .from('beta_access_grants')
    .insert({
      user_id: userId,
      campaign_id: campaign.id,
      referral_code_id: referralCodeId,
      granted_plan: campaign.default_plan,
      grant_reason: grantReason,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt,
    })

  if (error) {
    console.error('[auth] beta grant creation failed:', error.message)
  }
}

async function maybeCreateBetaGrantForAttribution(userId: string, attribution: AttributionPayload) {
  const referralCode = normalizeCampaignCode(attribution.referral_code)
  if (referralCode) {
    const referralSource = await findActiveReferralGrantSource(referralCode)
    if (referralSource) {
      await createBetaGrantForAttribution({
        userId,
        campaign: referralSource.campaign,
        referralCodeId: referralSource.referralCode.id,
        grantDays: referralSource.referralCode.grant_days,
        grantReason: `referral:${referralSource.referralCode.code}`,
      })
      return
    }
  }

  const promoCode = normalizeCampaignCode(attribution.promo_code)
  if (promoCode) {
    const campaign = await findActiveCampaignByCode(promoCode)
    if (isCampaignCurrentlyValid(campaign)) {
      await createBetaGrantForAttribution({
        userId,
        campaign,
        grantReason: `promo:${campaign.code}`,
      })
      return
    }
  }

  const utmCampaign = normalizeCampaignCode(attribution.utm_campaign)
  if (utmCampaign) {
    const campaign = await findActiveCampaignByCode(utmCampaign)
    if (isCampaignCurrentlyValid(campaign)) {
      await createBetaGrantForAttribution({
        userId,
        campaign,
        grantReason: `campaign:${campaign.code}`,
      })
    }
  }
}

export async function bindGrowthAttributionForUser(userId: string, attribution: AttributionPayload | null) {
  if (!attribution) return
  if (Object.keys(attribution).length === 0) return

  const supabase = createServiceClient()
  const lastUpdates: Record<string, string> = {}
  const mappings = [
    ['utm_source', 'first_utm_source', 'last_utm_source'],
    ['utm_medium', 'first_utm_medium', 'last_utm_medium'],
    ['utm_campaign', 'first_utm_campaign', 'last_utm_campaign'],
    ['referral_code', 'first_referral_code', 'last_referral_code'],
    ['promo_code', 'first_promo_code', 'last_promo_code'],
  ] as const

  for (const [field, firstColumn, lastColumn] of mappings) {
    const value = attribution[field]
    if (!value) continue

    const { error: firstUpdateError } = await supabase
      .from('profiles')
      .update({ [firstColumn]: value })
      .eq('id', userId)
      .is(firstColumn, null)

    if (firstUpdateError) {
      console.error(`[auth] ${firstColumn} attribution update failed:`, firstUpdateError.message)
    }

    lastUpdates[lastColumn] = value
  }

  if (Object.keys(lastUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(lastUpdates)
      .eq('id', userId)

    if (updateError) {
      console.error('[auth] profile attribution update failed:', updateError.message)
    }
  }

  await maybeCreateBetaGrantForAttribution(userId, attribution)
}

export async function getUserWithPlan(): Promise<UserWithPlan | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's plan from profiles table (created by webhook in Phase 6)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const { data: grants } = await supabase
    .from('beta_access_grants')
    .select('id, granted_plan, grant_reason, starts_at, expires_at, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  // Count scans this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const plan = (profile?.plan as Plan) || 'free'

  return {
    id: user.id,
    email: user.email!,
    plan,
    ...resolveUserPlanAccess(plan, grants as BetaGrantRow[] | null, now),
    scansThisMonth: count || 0,
  }
}

export const FREE_SCAN_LIMIT = 3
