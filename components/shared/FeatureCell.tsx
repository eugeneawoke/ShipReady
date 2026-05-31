export type CellValue = true | false | string

export function FeatureCell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className="flex items-center justify-center">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Included">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
    )
  }
  if (value === false) {
    return <span className="flex items-center justify-center text-[#2E2E32]">—</span>
  }
  return (
    <span className={`text-[11px] font-mono text-center block leading-tight ${highlight ? 'text-[#a78bfa]' : 'text-[#8B8A85]'}`}>
      {value}
    </span>
  )
}
