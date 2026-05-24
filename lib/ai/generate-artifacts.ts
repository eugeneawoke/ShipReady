import type { BusinessContext, GeneratedArtifacts, ScanResult } from '@/types/scan'

function generateLlmsTxt(url: string, businessContext: BusinessContext | null): string {
  const origin = new URL(url).origin
  const productName = businessContext?.detectedService ?? new URL(url).hostname
  const description = businessContext?.businessProfile ?? 'A web product.'

  const lines: string[] = [
    `# ${productName}`,
    '',
    `> ${description}`,
    '',
    '## Key Pages',
    `- /: Homepage — ${description.slice(0, 80)}`,
    '- /pricing: Pricing and plans',
    '',
    '## About',
    `This file helps AI systems understand the content and structure of ${productName}.`,
    `Source: ${origin}`,
  ]

  return lines.join('\n')
}

function generateSchemaOrg(url: string, businessContext: BusinessContext | null): string {
  const productName = businessContext?.detectedService ?? new URL(url).hostname
  const description = businessContext?.businessProfile ?? ''

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: productName,
    description: description.slice(0, 200),
    url,
    applicationCategory: 'WebApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  return JSON.stringify(schema, null, 2)
}

const SECURITY_HEADER_MAP_NEXTJS: Record<string, { key: string; value: string }> = {
  'missing-hsts': {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  'missing-x-frame': {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  'missing-xcto': {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  'missing-referrer-policy': {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  'missing-permissions-policy': {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
}

const SECURITY_HEADER_MAP_NGINX: Record<string, string> = {
  'missing-hsts': "add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains' always;",
  'missing-x-frame': "add_header X-Frame-Options 'SAMEORIGIN' always;",
  'missing-xcto': "add_header X-Content-Type-Options 'nosniff' always;",
  'missing-referrer-policy': "add_header Referrer-Policy 'strict-origin-when-cross-origin' always;",
  'missing-permissions-policy': "add_header Permissions-Policy 'camera=(), microphone=(), geolocation=()' always;",
}

function generateSecurityHeadersNextJs(missingHeaderIds: string[]): string {
  const headers = missingHeaderIds
    .filter(id => SECURITY_HEADER_MAP_NEXTJS[id])
    .map(id => `      { key: '${SECURITY_HEADER_MAP_NEXTJS[id].key}', value: '${SECURITY_HEADER_MAP_NEXTJS[id].value}' }`)
    .join(',\n')

  if (!headers) return ''

  return `// next.config.js — add inside your config object:
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
${headers}
      ],
    },
  ]
},`
}

function generateSecurityHeadersNginx(missingHeaderIds: string[]): string {
  const lines = missingHeaderIds
    .filter(id => SECURITY_HEADER_MAP_NGINX[id])
    .map(id => `  ${SECURITY_HEADER_MAP_NGINX[id]}`)

  if (!lines.length) return ''

  return `# nginx — add inside your server {} block:\n${lines.join('\n')}`
}

export function generateArtifacts(
  result: ScanResult,
  businessContext: BusinessContext | null,
): GeneratedArtifacts {
  const artifacts: GeneratedArtifacts = {}

  const hasLlmsTxtIssue = result.ai_visibility.issues.some(
    i => i.id === 'missing-llms-txt' || i.id === 'thin-llms-txt',
  )
  if (hasLlmsTxtIssue) {
    artifacts.llmsTxt = generateLlmsTxt(result.url, businessContext)
  }

  const hasSchemaIssue = result.ai_visibility.issues.some(i => i.id === 'missing-schema-org')
  if (hasSchemaIssue) {
    artifacts.schemaOrgJson = generateSchemaOrg(result.url, businessContext)
  }

  const missingSecurityHeaders = result.security.issues
    .map(i => i.id)
    .filter(id => Object.keys(SECURITY_HEADER_MAP_NEXTJS).includes(id))

  if (missingSecurityHeaders.length > 0) {
    artifacts.securityHeadersNextJs = generateSecurityHeadersNextJs(missingSecurityHeaders)
    artifacts.securityHeadersNginx = generateSecurityHeadersNginx(missingSecurityHeaders)
  }

  return artifacts
}
