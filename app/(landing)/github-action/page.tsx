// app/(landing)/github-action/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { readFileSync } from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'GitHub Action — Glook',
  description:
    'Block PRs that break your site score. Glook GitHub Action audits your deployment URL on every PR and fails CI if score drops below your threshold.',
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3DDC84] text-sm font-bold text-black">
        {n}
      </div>
      <div className="text-sm text-[#A8A7A3]">{children}</div>
    </div>
  )
}

export default function GitHubActionPage() {
  // Read template from public/ at build time
  const yamlPath = path.join(process.cwd(), 'public', 'github-action', 'shipready.yml')
  let yaml = ''
  try {
    yaml = readFileSync(yamlPath, 'utf8')
  } catch {
    yaml = '# Template not found — download from https://shipready.app/github-action/shipready.yml'
  }

  return (
    <div className="min-h-screen bg-[#0E0E0D] text-[#F1F0EE]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Hero */}
        <div className="mb-2 text-sm text-[#8B8A85]">CI/CD Integration</div>
        <h1 className="text-4xl font-bold tracking-tight">GitHub Action</h1>
        <p className="mt-4 text-lg text-[#A8A7A3]">
          Block PRs that break your site score. Audit every deployment URL automatically and comment a score breakdown directly on the pull request.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="rounded-lg bg-[#3DDC84] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Get Agency plan →
          </Link>
          <a
            href="/github-action/shipready.yml"
            download="shipready.yml"
            className="rounded-lg border border-[#2A2A2A] px-5 py-2.5 text-sm font-semibold text-[#F1F0EE] transition-colors hover:border-[#3A3A3A]"
          >
            Download template
          </a>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: '🔍', title: 'Auto-scan', body: 'Scans your PR preview URL on every push' },
            { icon: '💬', title: 'PR comments', body: 'Posts score breakdown as a PR comment' },
            { icon: '🚦', title: 'Threshold gate', body: 'Fails CI if score drops below your limit' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-xl border border-[#2A2A2A] bg-[#131312] p-5">
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-[#8B8A85]">{body}</p>
            </div>
          ))}
        </div>

        {/* Setup steps */}
        <h2 className="mt-14 mb-6 text-xl font-semibold">Setup in 3 steps</h2>
        <div className="space-y-5">
          <Step n={1}>
            <strong className="text-[#F1F0EE]">Get an Agency API key</strong>
            <p className="mt-0.5">
              Sign in →{' '}
              <Link href="/dashboard/api" className="underline hover:text-[#F1F0EE]">
                Dashboard → API Keys
              </Link>{' '}
              → Generate key. Requires Agency plan.
            </p>
          </Step>
          <Step n={2}>
            <strong className="text-[#F1F0EE]">Add the secret to your repo</strong>
            <p className="mt-0.5">
              In your GitHub repo: <em>Settings → Secrets and variables → Actions → New repository secret</em>.
              Name: <code className="rounded bg-[#1A1A18] px-1 text-xs">SHIPREADY_API_KEY</code>.
            </p>
          </Step>
          <Step n={3}>
            <strong className="text-[#F1F0EE]">Add the workflow file</strong>
            <p className="mt-0.5">
              Copy the template below to <code className="rounded bg-[#1A1A18] px-1 text-xs">.github/workflows/shipready.yml</code> in your repo.
              Set <code className="rounded bg-[#1A1A18] px-1 text-xs">DEPLOYMENT_URL</code> to your preview URL (e.g. from Vercel output).
            </p>
          </Step>
        </div>

        {/* Template */}
        <h2 className="mt-14 mb-4 text-xl font-semibold">Workflow template</h2>
        <p className="mb-4 text-sm text-[#8B8A85]">
          Copy this into <code className="rounded bg-[#1A1A18] px-1 text-xs">.github/workflows/shipready.yml</code>:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-[#0A0A09] p-5 text-xs leading-relaxed text-[#A8A7A3]">
          <code>{yaml}</code>
        </pre>

        {/* CTA */}
        <div className="mt-14 rounded-xl border border-[#3DDC84]/20 bg-[#3DDC84]/5 p-8 text-center">
          <h2 className="text-xl font-semibold">Start blocking broken deploys</h2>
          <p className="mt-2 text-sm text-[#8B8A85]">Agency plan includes API access, unlimited scans, and CI integration.</p>
          <Link
            href="/pricing"
            className="mt-5 inline-block rounded-lg bg-[#3DDC84] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            View pricing →
          </Link>
        </div>
      </div>
    </div>
  )
}
