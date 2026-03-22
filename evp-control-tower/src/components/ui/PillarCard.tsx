import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Pillar } from '../../types'
import RAGBadge from './RAGBadge'

interface PillarCardProps {
  pillar: Pillar
  onClick?: () => void
}

const scoreColorMap: Record<Pillar['status'], string> = {
  'top-strength': 'text-emerald-600 dark:text-emerald-400',
  strength: 'text-emerald-600 dark:text-emerald-400',
  mixed: 'text-amber-600 dark:text-amber-400',
  gap: 'text-amber-600 dark:text-amber-400',
  critical: 'text-rose-600 dark:text-rose-400',
}

export default function PillarCard({ pillar, onClick }: PillarCardProps) {
  const { label, internalScore, externalScore, status } = pillar
  const gap = internalScore - externalScore
  const colorClass = scoreColorMap[status]

  const TrendIcon = gap > 0.2
    ? TrendingUp
    : gap < -0.2
      ? TrendingDown
      : Minus

  const trendColor = gap > 0.2
    ? 'text-emerald-500'
    : gap < -0.2
      ? 'text-rose-500'
      : 'text-[var(--muted)]'

  return (
    <div
      className={`bg-[var(--card)] rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text)]">{label}</h3>
        <RAGBadge status={status} />
      </div>

      <div className="flex items-end gap-3">
        <div>
          <p className={`text-2xl font-bold ${colorClass}`}>
            {internalScore.toFixed(1)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Internal</p>
        </div>

        <div className="mb-1">
          <p className="text-sm text-[var(--muted)]">
            External: <span className="font-medium text-[var(--text)]">{externalScore.toFixed(1)}</span>
          </p>
        </div>

        <div className={`mb-1 ml-auto ${trendColor}`}>
          <TrendIcon size={18} />
        </div>
      </div>
    </div>
  )
}
