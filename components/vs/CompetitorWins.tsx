interface CompetitorWinsProps {
  wins: [string, string, string]
  competitorName: string
}

export function CompetitorWins({ wins, competitorName }: CompetitorWinsProps) {
  return (
    <div className="mb-12">
      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-5">
        Why Glook wins vs {competitorName}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {wins.map((win, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/15 flex flex-col gap-3"
          >
            <span className="text-[#6E56CF] text-lg">⬡</span>
            <p className="text-sm text-[#C9C8C3] leading-relaxed">{win}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
