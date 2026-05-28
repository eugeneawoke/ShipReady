// app/dashboard/api/actions.ts
'use server'

import { randomBytes, createHash } from 'crypto'
import { getUserWithPlan } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

function requireAgency(plan: string) {
  if (plan !== 'agency') redirect('/pricing')
}

export interface GenerateKeyResult {
  plaintext: string
  id: string
}

export async function generateApiKey(
  label: string
): Promise<GenerateKeyResult | { error: string }> {
  const user = await getUserWithPlan()
  if (!user) redirect('/auth/login')
  requireAgency(user.effectivePlan)

  const rawKey = 'sk_live_' + randomBytes(24).toString('hex')
  const key_hash = createHash('sha256').update(rawKey).digest('hex')

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_hash,
      plan: 'agency',
      daily_limit: 1000,
      label: label || 'Default',
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Insert failed' }
  return { plaintext: rawKey, id: data.id }
}

export async function deleteApiKey(id: string): Promise<void> {
  const user = await getUserWithPlan()
  if (!user) redirect('/auth/login')
  requireAgency(user.effectivePlan)

  const supabase = createServiceClient()
  await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // safety: only own keys
}
