import type { ScanResult } from '@/types/scan'

const CRITICAL_IDS = ['exposed-env-file', 'api-key-in-html', 'no-https']

export function SecurityAlertBanner({ result }: { result: ScanResult }) {
  const criticalIssues = result.security.issues.filter(issue => CRITICAL_IDS.includes(issue.id))

  if (criticalIssues.length === 0) return null

  return (
    <section
      role="alert"
      className="rounded-xl border border-[#FF4444]/35 bg-[#FF4444]/8 px-4 py-4"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-sm text-[#FF6B6B] mt-0.5">⚠</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#FF8A8A]">
            Critical security {criticalIssues.length === 1 ? 'issue' : 'issues'} detected
          </p>
          <ul className="mt-2 space-y-0.5">
            {criticalIssues.map(issue => (
              <li key={issue.id} className="text-xs text-[#FF8A8A]/80">
                · {issue.title}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[#8B8A85] leading-relaxed">
            Fix these immediately — they expose your site or users to active risk.
          </p>
        </div>
      </div>
    </section>
  )
}
