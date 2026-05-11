import { createClient, createServiceClient } from '@/lib/supabase'
import {
  normalizeCampaignCode,
  resolveUserPlanAccess,
  attributionFromBindingVisit,
  selectGrowthAttributionBinding,
  type AttributionPayload,
  type GrowthAttributionBindingSelection,
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

export { resolveUserPlanAccess }

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

type ServiceClient = ReturnType<typeof createServiceClient>

type GrowthReferenceIds = {
  campaignId: string | null
  referralCodeId: string | null
}

type GrowthVisitRow = {
  id: string
  created_at: string | null
  attribution: unknown
  campaign_id: string | null
  referral_code_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referral_code: string | null
  promo_code: string | null
}

type BindGrowthAttributionInput = {
  anonymousId?: string | null
  fallbackAttribution?: AttributionPayload | null
}

function hasAttribution(attribution: AttributionPayload | null): attribution is AttributionPayload {
  return Boolean(attribution && Object.keys(attribution).length > 0)
}

async function findActiveCampaignByCode(supabase: ServiceClient, code: string | null) {
  if (!code) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('growth_campaigns')
    .select('id')
    .eq('code', code)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle()

  if (error) {
    console.error('[auth] campaign resolution failed:', error.message)
    return null
  }

  return data?.id ?? null
}

async function findActiveCampaignById(supabase: ServiceClient, id: string | null) {
  if (!id) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('growth_campaigns')
    .select('id')
    .eq('id', id)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle()

  if (error) {
    console.error('[auth] campaign resolution failed:', error.message)
    return null
  }

  return data?.id ?? null
}

async function resolveGrowthReferenceIds(
  supabase: ServiceClient,
  attribution: AttributionPayload | null,
): Promise<GrowthReferenceIds> {
  if (!attribution) return { campaignId: null, referralCodeId: null }

  const now = new Date().toISOString()
  let campaignId: string | null = null
  let referralCodeId: string | null = null
  const referralCode = normalizeCampaignCode(attribution.referral_code)

  if (referralCode) {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, campaign_id, max_uses, uses_count')
      .eq('code', referralCode)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle()

    if (error) {
      console.error('[auth] referral resolution failed:', error.message)
    } else if (data && (!data.max_uses || data.uses_count < data.max_uses)) {
      referralCodeId = data.id
      campaignId = await findActiveCampaignById(supabase, data.campaign_id)
    }
  }

  if (!campaignId) {
    campaignId = await findActiveCampaignByCode(supabase, normalizeCampaignCode(attribution.promo_code))
  }

  if (!campaignId) {
    campaignId = await findActiveCampaignByCode(supabase, normalizeCampaignCode(attribution.utm_campaign))
  }

  return { campaignId, referralCodeId }
}

async function maybeCreateBetaGrantForServerVisit(userId: string, attribution: AttributionPayload) {
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

async function updateProfileAttribution(
  supabase: ServiceClient,
  userId: string,
  selection: Pick<GrowthAttributionBindingSelection, 'firstTouchAttribution' | 'lastTouchAttribution'>,
) {
  const lastUpdates: Record<string, string> = {}
  const firstAttribution = selection.firstTouchAttribution
  const lastAttribution = selection.lastTouchAttribution
  const mappings = [
    ['utm_source', 'first_utm_source', 'last_utm_source'],
    ['utm_medium', 'first_utm_medium', 'last_utm_medium'],
    ['utm_campaign', 'first_utm_campaign', 'last_utm_campaign'],
    ['referral_code', 'first_referral_code', 'last_referral_code'],
    ['promo_code', 'first_promo_code', 'last_promo_code'],
  ] as const

  for (const [field, firstColumn, lastColumn] of mappings) {
    const firstValue = firstAttribution?.[field]
    const lastValue = lastAttribution?.[field]

    if (firstValue) {
      const { error: firstUpdateError } = await supabase
        .from('profiles')
        .update({ [firstColumn]: firstValue })
        .eq('id', userId)
        .is(firstColumn, null)

      if (firstUpdateError) {
        console.error(`[auth] ${firstColumn} attribution update failed:`, firstUpdateError.message)
      }
    }

    if (lastValue) lastUpdates[lastColumn] = lastValue
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

}

async function bindAnonymousGrowthRowsToUser(
  supabase: ServiceClient,
  userId: string,
  anonymousId: string,
) {
  const [{ error: visitsError }, { error: eventsError }] = await Promise.all([
    supabase
      .from('growth_visits')
      .update({ user_id: userId })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null),
    supabase
      .from('growth_events')
      .update({ user_id: userId })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null),
  ])

  if (visitsError) console.error('[auth] growth visit user binding failed:', visitsError.message)
  if (eventsError) console.error('[auth] growth event user binding failed:', eventsError.message)
}

async function resolveAndStoreVisitReferences(supabase: ServiceClient, visits: GrowthVisitRow[]) {
  for (const visit of visits) {
    const attribution = attributionFromBindingVisit(visit)
    const references = await resolveGrowthReferenceIds(supabase, attribution)
    const updates: Record<string, string> = {}

    if (!visit.campaign_id && references.campaignId) updates.campaign_id = references.campaignId
    if (!visit.referral_code_id && references.referralCodeId) updates.referral_code_id = references.referralCodeId
    if (Object.keys(updates).length === 0) continue

    if (updates.campaign_id) visit.campaign_id = updates.campaign_id
    if (updates.referral_code_id) visit.referral_code_id = updates.referral_code_id

    const { error } = await supabase
      .from('growth_visits')
      .update(updates)
      .eq('id', visit.id)

    if (error) {
      console.error('[auth] growth visit reference update failed:', error.message)
    }
  }
}

export async function bindGrowthAttributionForUser(userId: string, input: BindGrowthAttributionInput) {
  const supabase = createServiceClient()
  const anonymousId = input.anonymousId?.trim() || null
  const fallbackAttribution = input.fallbackAttribution ?? null
  let serverVisitAttribution: AttributionPayload | null = null
  let foundServerVisit = false

  if (anonymousId) {
    await bindAnonymousGrowthRowsToUser(supabase, userId, anonymousId)

    const { data: visits, error } = await supabase
      .from('growth_visits')
      .select(`
        id,
        created_at,
        attribution,
        campaign_id,
        referral_code_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referral_code,
        promo_code
      `)
      .eq('anonymous_id', anonymousId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[auth] growth visit lookup failed:', error.message)
    } else if (visits && visits.length > 0) {
      await resolveAndStoreVisitReferences(supabase, visits as GrowthVisitRow[])
      const selection = selectGrowthAttributionBinding(visits as GrowthVisitRow[])
      foundServerVisit = selection.hasServerVisits

      if (hasAttribution(selection.firstTouchAttribution) || hasAttribution(selection.lastTouchAttribution)) {
        await updateProfileAttribution(supabase, userId, selection)
      }

      serverVisitAttribution = selection.grantAttribution
    }
  }

  if (hasAttribution(serverVisitAttribution)) {
    await maybeCreateBetaGrantForServerVisit(userId, serverVisitAttribution)
    return
  }

  if (hasAttribution(fallbackAttribution) && !foundServerVisit) {
    await updateProfileAttribution(supabase, userId, {
      firstTouchAttribution: fallbackAttribution,
      lastTouchAttribution: fallbackAttribution,
    })
  }
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
