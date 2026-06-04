import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const revalidate = 60

const LTD_TOTAL_SLOTS = 100

export async function GET() {
  // Stage 1: static totals (no slots sold yet)
  // Stage 2 will replace with live Supabase count
  return NextResponse.json({
    pro: { total: LTD_TOTAL_SLOTS, sold: 0, remaining: LTD_TOTAL_SLOTS },
    agency: { total: LTD_TOTAL_SLOTS, sold: 0, remaining: LTD_TOTAL_SLOTS },
  })
}
