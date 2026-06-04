// app/docs/api/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { MCP_TOOLS } from '@/lib/mcp/tools'

export const metadata: Metadata = {
  title: 'API Documentation — Glook',
  description:
    'REST API and MCP JSON-RPC documentation for Glook. Integrate website audits into your CI/CD pipeline, dashboards, and AI agents.',
  alternates: { canonical: 'https://glook.dev/docs/api' },
  openGraph: {
    title: 'API Documentation — Glook',
    description: 'REST API and MCP JSON-RPC documentation for Glook. Integrate website audits into your CI/CD pipeline, dashboards, and AI agents.',
    url: 'https://glook.dev/docs/api',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Glook API Documentation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Documentation — Glook',
    description: 'REST API and MCP JSON-RPC documentation for Glook.',
    images: ['/opengraph-image'],
  },
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#0E0E0D] p-4 text-xs leading-relaxed text-[#A8A7A3]">
      <code>{code}</code>
    </pre>
  )
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 mb-4 scroll-mt-20 text-xl font-semibold text-[#F1F0EE]">
      {children}
    </h2>
  )
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mt-8 mb-3 scroll-mt-20 text-base font-semibold text-[#F1F0EE]">
      {children}
    </h3>
  )
}

const CtaBanner = () => (
  <div className="my-8 flex flex-col items-start gap-3 rounded-xl border border-[#3DDC84]/20 bg-[#3DDC84]/5 p-6 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-semibold text-[#F1F0EE]">Need API access?</p>
      <p className="mt-0.5 text-sm text-[#8B8A85]">
        API keys are available on the Agency plan. Unlimited scans, team workflows, and priority support.
      </p>
    </div>
    <Link
      href="/pricing"
      className="shrink-0 rounded-lg bg-[#3DDC84] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
    >
      Get API access →
    </Link>
  </div>
)

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0D] text-[#F1F0EE]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-2">
          <Link href="/" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE]">
            ← Glook
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">API Reference</h1>
        <p className="mt-3 text-[#8B8A85]">
          Integrate Glook audits into your CI/CD, dashboards, and AI agents.
          Base URL: <code className="rounded bg-[#1A1A18] px-1.5 py-0.5 text-xs">https://glook.dev</code>
        </p>

        <CtaBanner />

        {/* Auth */}
        <SectionHeading id="auth">Authentication</SectionHeading>
        <p className="mb-3 text-sm text-[#A8A7A3]">
          All API endpoints require a Bearer token in the <code className="rounded bg-[#1A1A18] px-1 text-xs">Authorization</code> header.
          Generate keys at{' '}
          <Link href="/dashboard/api" className="underline hover:text-[#F1F0EE]">
            Dashboard → API Keys
          </Link>{' '}
          (Agency plan required).
        </p>
        <CodeBlock code={`curl -H "Authorization: Bearer sk_live_..." https://glook.dev/api/v1/scan`} />

        {/* Rate limits */}
        <SectionHeading id="rate-limits">Rate Limits</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-[#2A2A2A]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2A2A2A] bg-[#131312]">
              <tr>
                {['Plan', 'Daily limit', 'Concurrent scans'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#8B8A85]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { plan: 'Free', limit: '—', concurrent: '1' },
                { plan: 'Pro', limit: '100', concurrent: '2' },
                { plan: 'Agency', limit: '1,000 per key', concurrent: '5' },
              ].map((row) => (
                <tr key={row.plan} className="border-b border-[#2A2A2A] last:border-0">
                  <td className="px-4 py-2.5 font-medium">{row.plan}</td>
                  <td className="px-4 py-2.5 text-[#A8A7A3]">{row.limit}</td>
                  <td className="px-4 py-2.5 text-[#A8A7A3]">{row.concurrent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* REST Endpoints */}
        <SectionHeading id="rest">REST Endpoints</SectionHeading>

        <SubHeading id="post-scan">POST /api/v1/scan</SubHeading>
        <p className="mb-3 text-sm text-[#A8A7A3]">Submit a URL for a Glook audit. Returns the scan ID immediately; poll <code className="rounded bg-[#1A1A18] px-1 text-xs">GET /api/scan/:id</code> for results.</p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">Request body</p>
        <CodeBlock lang="json" code={`{
  "url": "https://example.com",       // required
  "goal": "seo"                        // optional: seo | security | ai_visibility | full (default: full)
}`} />
        <p className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">Response 200</p>
        <CodeBlock lang="json" code={`{ "id": "7f3d9..." }`} />
        <p className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">curl example</p>
        <CodeBlock code={`curl -X POST https://glook.dev/api/v1/scan \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","goal":"full"}'`} />

        <SubHeading id="get-scan">GET /api/scan/:id</SubHeading>
        <p className="mb-3 text-sm text-[#A8A7A3]">Poll scan status and retrieve results. No auth required for anonymous scans.</p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">Response 200</p>
        <CodeBlock lang="json" code={`{
  "id": "7f3d9...",
  "status": "done",           // pending | running | running_fast | running_deep | enriching | done | error
  "results": {
    "totalScore": 82,
    "performance": { "score": 91, "issues": [...] },
    "seo": { "score": 78, "issues": [...] },
    // ... security, mobile, ai_visibility, accessibility
  }
}`} />
        <p className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">curl example</p>
        <CodeBlock code={`curl https://glook.dev/api/scan/7f3d9... \\
  -H "Authorization: Bearer sk_live_..."`} />

        <SubHeading id="get-badge">GET /api/badge/:domain</SubHeading>
        <p className="mb-3 text-sm text-[#A8A7A3]">Returns an SVG badge with the domain&apos;s latest public score. Requires <code className="rounded bg-[#1A1A18] px-1 text-xs">badge_enabled = true</code> on the scan.</p>
        <CodeBlock code={`curl https://glook.dev/api/badge/example.com`} />
        <p className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">Markdown embed</p>
        <CodeBlock code={`![Glook score](https://glook.dev/api/badge/example.com)`} />

        {/* MCP tools */}
        <SectionHeading id="mcp">MCP JSON-RPC Tools</SectionHeading>
        <p className="mb-4 text-sm text-[#A8A7A3]">
          Glook exposes a JSON-RPC 2.0 MCP endpoint at <code className="rounded bg-[#1A1A18] px-1 text-xs">POST /api/mcp</code>.
          Use it with Claude Code, Cursor, or any MCP-compatible client to run audits from within your editor.
        </p>
        <CodeBlock code={`# Claude Code: add to settings.json under mcpServers
{
  "glook": {
    "command": "npx",
    "args": ["mcp-client", "https://glook.dev/api/mcp"],
    "env": { "GLOOK_API_KEY": "sk_live_..." }
  }
}`} />

        <div className="mt-4 space-y-6">
          {MCP_TOOLS.map((tool) => (
            <div key={tool.name} className="rounded-lg border border-[#2A2A2A] bg-[#131312] p-5">
              <code className="text-sm font-semibold text-[#3DDC84]">{tool.name}</code>
              <p className="mt-1 text-sm text-[#A8A7A3]">{tool.description}</p>
              {Object.keys(tool.inputSchema.properties).length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#8B8A85]">Parameters</p>
                  <div className="space-y-1">
                    {Object.entries(tool.inputSchema.properties).map(([name, def]) => (
                      <div key={name} className="flex gap-2 text-xs">
                        <code className="shrink-0 text-[#F1F0EE]">{name}</code>
                        <span className="text-[#8B8A85]">
                          {tool.inputSchema.required?.includes(name) ? '(required) ' : '(optional) '}
                          {def.description}
                          {def.enum && ` — ${def.enum.join(' | ')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error codes */}
        <SectionHeading id="errors">Error Codes</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-[#2A2A2A]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2A2A2A] bg-[#131312]">
              <tr>
                {['Code', 'Meaning'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#8B8A85]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { code: '401', meaning: 'Missing or invalid API key' },
                { code: '403', meaning: 'URL blocked (private IP, unsafe domain)' },
                { code: '422', meaning: 'Invalid request body or URL' },
                { code: '429', meaning: 'Daily rate limit reached' },
                { code: '500', meaning: 'Internal server error — try again or contact support' },
              ].map((row) => (
                <tr key={row.code} className="border-b border-[#2A2A2A] last:border-0">
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-[#1A1A18] px-1.5 py-0.5 text-xs">{row.code}</code>
                  </td>
                  <td className="px-4 py-2.5 text-[#A8A7A3]">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CtaBanner />
      </div>
    </div>
  )
}
