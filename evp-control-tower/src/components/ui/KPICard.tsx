import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: number
  icon?: React.ReactNode
  accentColor?: string
}

export default function KPICard({ label, value, subtext, trend, icon, accentColor }: KPICardProps) {
  const borderClass = accentColor ? `border-l-4 border-${accentColor}-500` : 'border-l-4 border-rose-500'

  return (
    <div className={`bg-[var(--card)] rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${borderClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[var(--text)]">{value}</p>
          {subtext && (
            <p className="text-xs text-[var(--muted)] mt-1">{subtext}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {trend >= 0
                ? <TrendingUp size={14} />
                : <TrendingDown size={14} />
              }
              <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-[var(--muted)] ml-3 mt-1">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
