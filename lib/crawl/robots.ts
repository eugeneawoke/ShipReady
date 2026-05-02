interface RobotsRule {
  type: 'allow' | 'disallow'
  path: string
}

export interface RobotsPolicy {
  userAgentRules: Map<string, RobotsRule[]>
}

function normalizeUserAgent(value: string): string {
  return value.trim().toLowerCase()
}

function parseRuleLine(value: string): string | null {
  const path = value.trim()
  if (!path) return null
  return path
}

export function parseRobotsTxt(content: string): RobotsPolicy {
  const userAgentRules = new Map<string, RobotsRule[]>()
  let currentAgents: string[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue

    const separator = line.indexOf(':')
    if (separator === -1) continue

    const key = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()

    if (key === 'user-agent') {
      const agent = normalizeUserAgent(value)
      currentAgents = [agent]
      if (!userAgentRules.has(agent)) {
        userAgentRules.set(agent, [])
      }
      continue
    }

    if ((key === 'allow' || key === 'disallow') && currentAgents.length > 0) {
      const path = parseRuleLine(value)
      if (path === null) continue

      for (const agent of currentAgents) {
        const rules = userAgentRules.get(agent) ?? []
        rules.push({ type: key, path })
        userAgentRules.set(agent, rules)
      }
    }
  }

  return { userAgentRules }
}

function getRulesForAgent(policy: RobotsPolicy, userAgent: string): RobotsRule[] {
  const exact = policy.userAgentRules.get(normalizeUserAgent(userAgent))
  if (exact) return exact
  return policy.userAgentRules.get('*') ?? []
}

export function isRobotsAllowed(policy: RobotsPolicy, userAgent: string, targetUrl: string): boolean {
  const path = new URL(targetUrl).pathname || '/'
  const rules = getRulesForAgent(policy, userAgent)

  let winningRule: RobotsRule | null = null

  for (const rule of rules) {
    if (!path.startsWith(rule.path)) continue
    if (!winningRule || rule.path.length > winningRule.path.length) {
      winningRule = rule
      continue
    }
    if (winningRule.path.length === rule.path.length && winningRule.type === 'disallow' && rule.type === 'allow') {
      winningRule = rule
    }
  }

  return winningRule ? winningRule.type !== 'disallow' : true
}
