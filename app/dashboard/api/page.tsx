// app/dashboard/api/page.tsx
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getUserWithPlan } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { SiteHeader, SiteBrandLink } from '@/components/SiteHeader'
import { ApiKeysList } from '@/components/dashboard/ApiKeysList'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function DashboardApiPage() {
  const user = await getUserWithPlan()
  if (!user) redirect('/auth/login')
  if (user.effectivePlan !== 'agency') redirect('/pricing')

  const supabase = await createClient()
  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, label, created_at, calls_today, daily_limit, last_reset_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0E0E0D] text-[#F1F0EE]">
      <SiteHeader
        sticky
        right={
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE]"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        }
      >
        <SiteBrandLink />
      </SiteHeader>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="mt-1 text-sm text-[#8B8A85]">
            Use these keys to call the{' '}
            <Link href="/docs/api" className="underline hover:text-[#F1F0EE]">
              Glook REST API
            </Link>
            . Keys are valid for Agency plan. Daily limit: 1,000 requests per key.
          </p>
        </div>

        <ApiKeysList initialKeys={keys ?? []} />
      </main>
    </div>
  )
}
