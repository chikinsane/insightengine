'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { CHART_PALETTE } from './BarChartView'

interface PieChartViewProps {
  data: Record<string, unknown>[]
  nameKey: string
  valueKey: string
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-[#13131f] border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.payload.fill }} />
        <span className="text-[11px] text-white/70">{p.name}</span>
      </div>
      <div className="mt-1.5 flex gap-3">
        <span className="text-sm font-semibold text-white">
          {typeof p.value === 'number'
            ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
            : String(p.value)}
        </span>
        <span className="text-[11px] text-white/40 self-end pb-0.5">
          {((p.payload.percent ?? 0) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

function renderLabel(props: PieLabelRenderProps) {
  const percent = props.percent ?? 0
  if (percent < 0.05) return null
  const cx = Number(props.cx ?? 0)
  const cy = Number(props.cy ?? 0)
  const midAngle = props.midAngle ?? 0
  const innerRadius = Number(props.innerRadius ?? 0)
  const outerRadius = Number(props.outerRadius ?? 0)
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.9)" textAnchor="middle"
      dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function PieChartView({ data, nameKey, valueKey, title }: PieChartViewProps) {
  // Cap at 10 slices to keep pie readable; merge rest as "Other"
  const MAX_SLICES = 10
  let chartData = [...data]
  if (chartData.length > MAX_SLICES) {
    const top = chartData.slice(0, MAX_SLICES - 1)
    const otherSum = chartData.slice(MAX_SLICES - 1).reduce((s, r) => s + Number(r[valueKey] ?? 0), 0)
    chartData = [...top, { [nameKey]: 'Other', [valueKey]: otherSum }]
  }

  return (
    <div className="w-full">
      {title && <p className="text-white/70 text-sm font-medium mb-3">{title}</p>}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey={valueKey} nameKey={nameKey}
              cx="50%" cy="50%"
              innerRadius={70} outerRadius={120}
              paddingAngle={2}
              labelLine={false} label={renderLabel}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Side legend */}
        <div className="flex flex-col gap-1.5 min-w-[140px] sm:max-w-[200px] w-full sm:w-auto">
          {chartData.map((row, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
              <span className="text-white/55 truncate flex-1">{String(row[nameKey] ?? '')}</span>
              <span className="text-white/80 font-medium tabular-nums ml-2">
                {typeof row[valueKey] === 'number'
                  ? (row[valueKey] as number).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                  : String(row[valueKey] ?? '')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
