'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

interface ScatterChartViewProps {
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
  cursor: { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.06)' },
}

export function ScatterChartView({ data, xKey, yKey, title }: ScatterChartViewProps) {
  // ScatterChart expects data with explicit x/y keys at the same level
  // Map to { x, y } format for simplicity, preserving original keys via name mapping
  const mappedData = data.map((row) => ({
    [xKey]: row[xKey],
    [yKey]: row[yKey],
  }))

  return (
    <div className="w-full">
      {title && (
        <p className="text-white/80 text-sm font-medium mb-4">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xKey}
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yKey}
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
          <Scatter
            data={mappedData}
            fill="#6366f1"
            fillOpacity={0.8}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
