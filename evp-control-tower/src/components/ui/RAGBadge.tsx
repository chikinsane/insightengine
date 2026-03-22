import type { RAGStatus } from '../../types'

type BadgeStatus = 'top-strength' | 'strength' | 'mixed' | 'gap' | 'critical' | RAGStatus

interface RAGBadgeProps {
  status: BadgeStatus
}

const statusConfig: Record<string, { classes: string; label: string }> = {
  'top-strength': {
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    label: 'Top Strength',
  },
  strength: {
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    label: 'Strength',
  },
  mixed: {
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Mixed',
  },
  gap: {
    classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'Gap',
  },
  critical: {
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    label: 'Critical',
  },
  // RAGStatus mappings
  red: {
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    label: 'Critical',
  },
  amber: {
    classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'Gap',
  },
  green: {
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    label: 'Strength',
  },
}

export default function RAGBadge({ status }: RAGBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.mixed

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}
