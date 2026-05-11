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

async function maybeCreateBetaGrantForAttribution(userId: string, attribution: AttributionPayload) {
  const supabase = createServiceClient() as unknown as {
    rpc: (
      fn: 'grant_beta_access_from_growth_attribution',
      args: {
        p_user_id: string
        p_campaign_slug: string | null
        p_referral_code: string | null
        p_promo_code: string | null
      },
    ) => Promise<{ data: string | null; error: { message: string } | null }>
  }

  const { error } = await supabase.rpc('grant_beta_access_from_growth_attribution', {
    p_user_id: userId,
    p_campaign_slug: normalizeCampaignCode(attribution.utm_campaign),
    p_referral_code: normalizeCampaignCode(attribution.referral_code),
    p_promo_code: normalizeCampaignCode(attribution.promo_code),
  })

  if (error) {
    console.error('[auth] beta grant RPC failed:', error.message)
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
