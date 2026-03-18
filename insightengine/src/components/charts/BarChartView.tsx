'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface BarChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  title?: string
}

const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0f0f1a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
  },
  labelStyle: { color: 'rgba(255,255,255,0.5)' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

export function BarChartView({ data, xKey, yKey, title }: BarChartViewProps) {
  return (
    <div className="w-full">
      {title && (
        <p className="text-white/80 text-sm font-medium mb-4">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
            labelStyle={DARK_TOOLTIP_STYLE.labelStyle}
            cursor={DARK_TOOLTIP_STYLE.cursor}
          />
          <Bar
            dataKey={yKey}
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
