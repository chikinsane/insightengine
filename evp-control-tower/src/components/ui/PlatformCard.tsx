import type { ExternalPlatform } from '../../types'

interface PlatformCardProps {
  platform: ExternalPlatform
}

export default function PlatformCard({ platform }: PlatformCardProps) {
  const { name, starScore, reviewCount, sentimentPositive, sentimentNeutral, sentimentNegative, topThemes } = platform

  const total = sentimentPositive + sentimentNeutral + sentimentNegative || 1
  const posW = Math.round((sentimentPositive / total) * 100)
  const neuW = Math.round((sentimentNeutral / total) * 100)
  const negW = 100 - posW - neuW

  return (
    <div className="bg-[var(--card)] rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{name}</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {reviewCount.toLocaleString()} reviews
          </p>
        </div>
        {starScore !== null && (
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-[var(--text)]">{starScore.toFixed(1)}</span>
            <span className="text-amber-400 text-lg">★</span>
          </div>
        )}
      </div>

      {/* Sentiment bar */}
      <div className="mb-3">
        <p className="text-xs text-[var(--muted)] mb-1">Sentiment</p>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div className="bg-emerald-400" style={{ width: `${posW}%` }} />
          <div className="bg-slate-300 dark:bg-slate-600" style={{ width: `${neuW}%` }} />
          <div className="bg-rose-400" style={{ width: `${negW}%` }} />
        </div>
        <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
          <span className="text-emerald-600">{posW}% positive</span>
          <span className="text-rose-500">{negW}% negative</span>
        </div>
      </div>

      {/* Top themes */}
      {topThemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topThemes.slice(0, 3).map((theme) => (
            <span
              key={theme}
              className="text-xs bg-slate-100 dark:bg-slate-700 text-[var(--muted)] px-2 py-0.5 rounded-full"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
