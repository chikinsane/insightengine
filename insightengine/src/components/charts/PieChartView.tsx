'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PieChartViewProps {
  data: Record<string, unknown>[]
  nameKey: string
  valueKey: string
  title?: string
}

const VIOLET_PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
  '#818cf8',
  '#4f46e5',
  '#7c3aed',
  '#5b21b6',
]

const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0f0f1a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
  },
  labelStyle: { color: 'rgba(255,255,255,0.5)' },
}

import type { PieLabelRenderProps } from 'recharts'

function renderCustomLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0)
  const cy = Number(props.cy ?? 0)
  const midAngle = props.midAngle ?? 0
  const innerRadius = Number(props.innerRadius ?? 0)
  const outerRadius = Number(props.outerRadius ?? 0)
  const percent = props.percent ?? 0
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="rgba(255,255,255,0.85)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function PieChartView({ data, nameKey, valueKey, title }: PieChartViewProps) {
  return (
    <div className="w-full">
      {title && (
        <p className="text-white/80 text-sm font-medium mb-4">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={130}
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={VIOLET_PALETTE[index % VIOLET_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={DARK_TOOLTIP_STYLE.contentStyle}
            labelStyle={DARK_TOOLTIP_STYLE.labelStyle}
          />
          <Legend
            wrapperStyle={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              paddingTop: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
