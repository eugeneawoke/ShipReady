import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns true if userId owns the scan or is an accepted team member of the owner.
 * Throws nothing — callers must handle the false case.
 */
export async function hasScanAccess(
  supabase: SupabaseClient,
  scanUserId: string,
  requestingUserId: string,
): Promise<boolean> {
  if (scanUserId === requestingUserId) return true

  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_user_id', scanUserId)
    .eq('member_user_id', requestingUserId)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  return !!membership
}
