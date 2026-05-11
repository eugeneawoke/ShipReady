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
  id?: string
  grant_reason?: string
  granted_plan?: Exclude<Plan, 'free'> | null
  starts_at?: string | Date | null
  expires_at?: string | Date | null
  revoked_at?: string | Date | null
}

export type PlanSource = 'profile' | 'beta_grant'

export type ActiveBetaGrant = {
  id: string
  grantedPlan: 'pro' | 'agency'
  grantReason: string
  expiresAt: string | null
  startsAt: string
}

export type ResolvedPlanAccess = {
  effectivePlan: Plan
  planSource: PlanSource
  activeBetaGrant: ActiveBetaGrant | null
}

export type EffectivePlanResult = {
  plan: Plan
  source: 'profile' | 'beta_grant' | 'free'
  activeGrant: GrantLike | null
}

const CAMPAIGN_CODE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/

function toDate(value: string | Date): Date | null {
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
    const value = normalizeCampaignCode(params.get(field))
    if (value) payload[field] = value
  }

  const referralCode = normalizeCampaignCode(params.get('ref'))
  if (referralCode) payload.referral_code = referralCode

  const promoCode = normalizeCampaignCode(params.get('promo'))
  if (promoCode) payload.promo_code = promoCode

  return payload
}

export function parseAttributionCookie(value: string | null | undefined): AttributionPayload | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

    const input = parsed as Record<string, unknown>
    const params = new URLSearchParams()
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

    for (const field of utmFields) {
      const value = input[field]
      if (typeof value === 'string') params.set(field, value)
    }

    const referralCode = input.referral_code ?? input.ref
    if (typeof referralCode === 'string') params.set('ref', referralCode)

    const promoCode = input.promo_code ?? input.promo
    if (typeof promoCode === 'string') params.set('promo', promoCode)

    const attribution = buildAttributionFromSearchParams(params)
    return Object.keys(attribution).length > 0 ? attribution : null
  } catch {
    return null
  }
}

export function sanitizeAttributionObject(value: unknown): AttributionPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const input = value as Record<string, unknown>
  const params = new URLSearchParams()
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

  for (const field of utmFields) {
    const fieldValue = input[field]
    if (typeof fieldValue === 'string') params.set(field, fieldValue)
  }

  const referralCode = input.referral_code ?? input.ref
  if (typeof referralCode === 'string') params.set('ref', referralCode)

  const promoCode = input.promo_code ?? input.promo
  if (typeof promoCode === 'string') params.set('promo', promoCode)

  const attribution = buildAttributionFromSearchParams(params)
  return Object.keys(attribution).length > 0 ? attribution : null
}

export function isGrantActive(grant: GrantLike | null | undefined, now = new Date()): boolean {
  if (!grant) return false
  const revokedAt = grant.revoked_at ? toDate(grant.revoked_at) : null
  if (grant.revoked_at && !revokedAt) return false
  if (revokedAt) return false

  const startsAt = grant.starts_at ? toDate(grant.starts_at) : null
  if (grant.starts_at && !startsAt) return false
  if (startsAt && startsAt > now) return false

  const expiresAt = grant.expires_at ? toDate(grant.expires_at) : null
  if (grant.expires_at && !expiresAt) return false
  if (expiresAt && expiresAt <= now) return false

  return true
}

export function effectivePlanFromSources(input: {
  profilePlan?: Plan | null
  grants?: GrantLike[] | null
  now?: Date
}): EffectivePlanResult {
  if (input.profilePlan === 'agency') {
    return { plan: 'agency', source: 'profile', activeGrant: null }
  }
  if (input.profilePlan === 'pro') {
    return { plan: 'pro', source: 'profile', activeGrant: null }
  }

  const activeGrants = input.grants?.filter((grant) => isGrantActive(grant, input.now)) ?? []
  const agencyGrant = activeGrants.find((grant) => grant.granted_plan === 'agency')
  if (agencyGrant) {
    return { plan: 'agency', source: 'beta_grant', activeGrant: agencyGrant }
  }

  const proGrant = activeGrants.find((grant) => !grant.granted_plan || grant.granted_plan === 'pro')
  if (proGrant) {
    return { plan: 'pro', source: 'beta_grant', activeGrant: proGrant }
  }

  return { plan: 'free', source: 'free', activeGrant: null }
}

export function resolveUserPlanAccess(
  profilePlan: Plan,
  grants: GrantLike[] | null | undefined,
  now = new Date(),
): ResolvedPlanAccess {
  const result = effectivePlanFromSources({
    profilePlan,
    grants,
    now,
  })

  const activeGrant = result.source === 'beta_grant'
    ? result.activeGrant
    : null

  return {
    effectivePlan: result.plan,
    planSource: result.source === 'beta_grant' ? 'beta_grant' : 'profile',
    activeBetaGrant: activeGrant
      ? {
          id: activeGrant.id ?? '',
          grantedPlan: activeGrant.granted_plan ?? 'pro',
          grantReason: activeGrant.grant_reason ?? '',
          startsAt: activeGrant.starts_at instanceof Date
            ? activeGrant.starts_at.toISOString()
            : activeGrant.starts_at ?? '',
          expiresAt: activeGrant.expires_at instanceof Date
            ? activeGrant.expires_at.toISOString()
            : activeGrant.expires_at ?? null,
        }
      : null,
  }
}
