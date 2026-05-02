import type { ScanBudget, ScanPlan, ScanProviderId, ScanProviderStatus } from '@/types/scan'

const PLAN_BUDGETS: Record<ScanPlan, ScanBudget> = {
  free: {
    plan: 'free',
    crawl: {
      enabled: false,
      maxDepth: 0,
      maxPages: 1,
    },
    providers: {
      aiEnrichment: { maxCalls: 1, callsUsed: 0, status: 'ready' },
      wowInsights: { maxCalls: 0, callsUsed: 0, status: 'blocked' },
      pagespeed: { maxCalls: 0, callsUsed: 0, status: 'blocked' },
    },
  },
  pro: {
    plan: 'pro',
    crawl: {
      enabled: true,
      maxDepth: 1,
      maxPages: 5,
    },
    providers: {
      aiEnrichment: { maxCalls: 1, callsUsed: 0, status: 'ready' },
      wowInsights: { maxCalls: 1, callsUsed: 0, status: 'ready' },
      pagespeed: { maxCalls: 1, callsUsed: 0, status: 'ready' },
    },
  },
  agency: {
    plan: 'agency',
    crawl: {
      enabled: true,
      maxDepth: 2,
      maxPages: 10,
    },
    providers: {
      aiEnrichment: { maxCalls: 1, callsUsed: 0, status: 'ready' },
      wowInsights: { maxCalls: 1, callsUsed: 0, status: 'ready' },
      pagespeed: { maxCalls: 1, callsUsed: 0, status: 'ready' },
    },
  },
}

function cloneBudget(plan: ScanPlan): ScanBudget {
  return structuredClone(PLAN_BUDGETS[plan])
}

export function buildScanBudget(plan: ScanPlan): ScanBudget {
  return cloneBudget(plan)
}

export function markProviderState(
  budget: ScanBudget,
  providerId: ScanProviderId,
  status: ScanProviderStatus,
  message?: string,
): ScanBudget {
  return {
    ...budget,
    providers: {
      ...budget.providers,
      [providerId]: {
        ...budget.providers[providerId],
        status,
        ...(message ? { message } : {}),
      },
    },
  }
}

export function reserveProviderCall(
  budget: ScanBudget,
  providerId: ScanProviderId,
): { allowed: true; budget: ScanBudget } | { allowed: false; reason: 'budget_exhausted'; budget: ScanBudget } {
  const provider = budget.providers[providerId]
  if (provider.callsUsed >= provider.maxCalls) {
    return {
      allowed: false,
      reason: 'budget_exhausted',
      budget: markProviderState(budget, providerId, 'blocked', 'Per-scan provider budget exhausted.'),
    }
  }

  return {
    allowed: true,
    budget: {
      ...budget,
      providers: {
        ...budget.providers,
        [providerId]: {
          ...provider,
          callsUsed: provider.callsUsed + 1,
        },
      },
    },
  }
}
