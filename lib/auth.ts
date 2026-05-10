import { createClient } from '@/lib/supabase'
import { effectivePlanFromSources, type Plan } from '@/lib/growth/attribution'

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
    .limit(20)

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
