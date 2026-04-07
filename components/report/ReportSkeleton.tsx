export function ReportSkeleton({ status }: { status: string }) {
  const steps = [
    'Checking performance',
    'Analyzing SEO & social',
    'Security audit',
    'Mobile checks',
    'AI visibility audit',
  ]

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center">
      {/* Back button */}
      <a
        href="/"
        className="fixed top-4 left-4 text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </a>

      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          {status === 'error' ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#FF4444]">Scan failed</p>
              <p className="text-sm text-[#8B8A85]">Something went wrong while analyzing your site.</p>
              <p className="text-xs text-[#5A5955]">
                Try again or contact me:{' '}
                <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">Telegram</a>
                {' '}·{' '}
                <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">Email</a>
              </p>
              <a href="/" className="inline-block mt-2 text-xs px-4 py-2 rounded-lg bg-[#161618] border border-white/6 text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">← Try another URL</a>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#8B8A85]">Analyzing your site...</p>
              <div className="mt-4 h-1 bg-[#1E1E21] rounded-full overflow-hidden">
                <div className="h-full bg-[#6E56CF] rounded-full animate-pulse w-3/4" />
              </div>
              <p className="mt-3 text-xs text-[#5A5955]">This takes 20–40 seconds</p>
            </>
          )}
        </div>
        {status !== 'error' && (
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#161618] border border-white/6">
                <div className="w-4 h-4 rounded-full border-2 border-[#6E56CF] border-t-transparent animate-spin shrink-0" />
                <span className="text-sm text-[#8B8A85]">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
