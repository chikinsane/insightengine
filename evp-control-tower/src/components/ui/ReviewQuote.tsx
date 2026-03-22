interface ReviewQuoteProps {
  text: string
  source?: string
  sentiment: 'positive' | 'negative'
  date?: string
}

export default function ReviewQuote({ text, source, sentiment, date }: ReviewQuoteProps) {
  const borderClass = sentiment === 'positive' ? 'border-emerald-400' : 'border-rose-400'

  return (
    <div className={`bg-[var(--card)] rounded-xl p-4 border-l-4 ${borderClass}`}>
      <p className="text-sm italic text-[var(--text)] mb-2">"{text}"</p>
      <div className="flex items-center gap-2">
        {source && (
          <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-[var(--muted)] px-2 py-0.5 rounded-full">
            {source}
          </span>
        )}
        {date && (
          <span className="text-xs text-[var(--muted)]">{date}</span>
        )}
      </div>
    </div>
  )
}
