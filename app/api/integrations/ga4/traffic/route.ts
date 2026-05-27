// app/api/integrations/ga4/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getValidToken } from '@/lib/integrations/token-refresh'
import { fetchGa4Traffic } from '@/lib/integrations/ga4'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const propertyId = request.nextUrl.searchParams.get('propertyId')
  if (!propertyId) {
    return NextResponse.json(
      {
        error: 'propertyId required',
        hint: 'Find it in Google Analytics → Admin → Property Settings → Property ID',
      },
      { status: 422 }
    )
  }

  const token = await getValidToken(user.id, 'google')
  if (!token) return NextResponse.json({ error: 'Google not connected' }, { status: 404 })

  const result = await fetchGa4Traffic(token, propertyId)
  if (!result) return NextResponse.json({ error: 'GA4 API error' }, { status: 502 })

  return NextResponse.json(result)
}
