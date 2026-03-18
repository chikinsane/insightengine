'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface LineChartViewProps {
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
  cursor: { stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 },
}

export function LineChartView({ data, xKey, yKey, title }: LineChartViewProps) {
  return (
    <div className="w-full">
      {title && (
        <p className="text-white/80 text-sm font-medium mb-4">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'rgba(139,92,246,0.3)', strokeWidth: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
