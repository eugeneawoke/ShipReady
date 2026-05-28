'use server'

import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function disconnectIntegration(provider: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('oauth_integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)
}
