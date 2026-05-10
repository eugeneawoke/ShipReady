export type Plan = 'free' | 'pro' | 'agency'

export type AttributionPayload = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referral_code?: string
  promo_code?: string
}

export type GrantLike = {
  starts_at?: string | Date | null
  expires_at?: string | Date | null
  revoked_at?: string | Date | null
}

const CAMPAIGN_CODE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/

function cleanParam(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeCampaignCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase()
  if (!normalized || normalized.length > 64) return null
  if (!CAMPAIGN_CODE_PATTERN.test(normalized)) return null
  return normalized
}

export function buildAttributionFromSearchParams(params: URLSearchParams): AttributionPayload {
  const payload: AttributionPayload = {}
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

  for (const field of utmFields) {
    const value = cleanParam(params.get(field))
    if (value) payload[field] = value
  }

  const referralCode = normalizeCampaignCode(params.get('ref'))
  if (referralCode) payload.referral_code = referralCode

  const promoCode = normalizeCampaignCode(params.get('promo'))
  if (promoCode) payload.promo_code = promoCode

  return payload
}

export function isGrantActive(grant: GrantLike | null | undefined, now = new Date()): boolean {
  if (!grant) return false
  if (toDate(grant.revoked_at)) return false

  const startsAt = toDate(grant.starts_at)
  if (startsAt && startsAt > now) return false

  const expiresAt = toDate(grant.expires_at)
  if (expiresAt && expiresAt <= now) return false

  return true
}

export function effectivePlanFromSources(input: {
  profilePlan?: Plan | null
  betaGrant?: GrantLike | null
  now?: Date
}): Plan {
  if (input.profilePlan === 'agency') return 'agency'
  if (input.profilePlan === 'pro') return 'pro'
  if (isGrantActive(input.betaGrant, input.now)) return 'pro'
  return 'free'
}
