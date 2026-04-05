import { createClient } from '@/lib/supabase'

export type Plan = 'free' | 'pro' | 'agency'

export interface UserWithPlan {
  id: string
  email: string
  plan: Plan
  scansThisMonth: number
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

  // Count scans this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  return {
    id: user.id,
    email: user.email!,
    plan: (profile?.plan as Plan) || 'free',
    scansThisMonth: count || 0,
  }
}

export const FREE_SCAN_LIMIT = 3
