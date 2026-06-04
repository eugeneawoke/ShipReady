// Centralized PayPro Global plan configuration
// Product IDs come from env vars set in PayPro dashboard

export const CHECKOUT_BASE = 'https://store.payproglobal.com/checkout'
export const PAYPRO_API_BASE = 'https://store.payproglobal.com/api'
export const PAYPRO_PROVIDER = 'payproglobal'

export interface PayProPlan {
  id: string
  productId: string
  interval: 'monthly' | 'yearly' | 'one_time'
  planTier: 'pro' | 'agency'
  amount: number
  currency: string
}

export const PAYPRO_PLANS = {
  pro_monthly: {
    id: 'pro_monthly',
    productId: process.env.PAYPRO_PRODUCT_PRO_MONTHLY ?? '',
    interval: 'monthly' as const,
    planTier: 'pro' as const,
    amount: 19,
    currency: 'USD',
  },
  pro_yearly: {
    id: 'pro_yearly',
    productId: process.env.PAYPRO_PRODUCT_PRO_YEARLY ?? '',
    interval: 'yearly' as const,
    planTier: 'pro' as const,
    amount: 190,
    currency: 'USD',
  },
  agency_monthly: {
    id: 'agency_monthly',
    productId: process.env.PAYPRO_PRODUCT_AGENCY_MONTHLY ?? '',
    interval: 'monthly' as const,
    planTier: 'agency' as const,
    amount: 49,
    currency: 'USD',
  },
  agency_yearly: {
    id: 'agency_yearly',
    productId: process.env.PAYPRO_PRODUCT_AGENCY_YEARLY ?? '',
    interval: 'yearly' as const,
    planTier: 'agency' as const,
    amount: 490,
    currency: 'USD',
  },
  pro_earlybird_monthly: {
    id: 'pro_earlybird_monthly',
    productId: process.env.PAYPRO_PRODUCT_PRO_EARLYBIRD_MONTHLY ?? '',
    interval: 'monthly' as const,
    planTier: 'pro' as const,
    amount: 14,
    currency: 'USD',
  },
  pro_earlybird_yearly: {
    id: 'pro_earlybird_yearly',
    productId: process.env.PAYPRO_PRODUCT_PRO_EARLYBIRD_YEARLY ?? '',
    interval: 'yearly' as const,
    planTier: 'pro' as const,
    amount: 152,
    currency: 'USD',
  },
  pro_ltd: {
    id: 'pro_ltd',
    productId: process.env.PAYPRO_PRODUCT_PRO_LTD ?? '',
    interval: 'one_time' as const,
    planTier: 'pro' as const,
    amount: 149,
    currency: 'USD',
  },
  agency_ltd: {
    id: 'agency_ltd',
    productId: process.env.PAYPRO_PRODUCT_AGENCY_LTD ?? '',
    interval: 'one_time' as const,
    planTier: 'agency' as const,
    amount: 349,
    currency: 'USD',
  },
} satisfies Record<string, PayProPlan>

export type PayProPlanId = keyof typeof PAYPRO_PLANS

export function getPlanByProductId(productId: string): PayProPlan | null {
  return Object.values(PAYPRO_PLANS).find((p) => p.productId === productId) ?? null
}

export function isSandboxMode(): boolean {
  return process.env.PAYPRO_SANDBOX === 'true'
}
