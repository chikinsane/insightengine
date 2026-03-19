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
    <div className="bg-[#0d0d1a]/95 backdrop-blur border border-white/[0.1] rounded-2xl px-4 py-3.5 shadow-2xl min-w-[160px]">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.payload.fill }} />
        <span className="text-[11px] font-medium text-white/70">{p.name}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <span className="text-lg font-bold text-white tabular-nums">
          {typeof p.value === 'number'
            ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
            : String(p.value)}
        </span>
        <span className="text-sm font-semibold text-white/50 pb-0.5">
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
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.95)" textAnchor="middle"
      dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function PieChartView({ data, nameKey, valueKey, title }: PieChartViewProps) {
  const MAX_SLICES = 10
  let chartData = [...data]
  if (chartData.length > MAX_SLICES) {
    const top = chartData.slice(0, MAX_SLICES - 1)
    const otherSum = chartData.slice(MAX_SLICES - 1).reduce((s, r) => s + Number(r[valueKey] ?? 0), 0)
    chartData = [...top, { [nameKey]: 'Other', [valueKey]: otherSum }]
  }

  const total = chartData.reduce((s, r) => s + Number(r[valueKey] ?? 0), 0)

  return (
    <div className="w-full">
      {title && <p className="text-white/80 text-sm font-semibold mb-4">{title}</p>}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Donut with total in center */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={320} height={320}>
            <PieChart>
              <Pie data={chartData} dataKey={valueKey} nameKey={nameKey}
                cx="50%" cy="50%"
                innerRadius={88} outerRadius={140}
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
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] text-white/30 font-medium tracking-wide">TOTAL</span>
            <span className="text-xl font-bold text-white tabular-nums leading-tight">
              {total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Side legend with proportion bars */}
        <div className="flex flex-col gap-2.5 w-full lg:max-w-[260px]">
          {chartData.map((row, i) => {
            const val = Number(row[valueKey] ?? 0)
            const pct = total > 0 ? (val / total) * 100 : 0
            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    <span className="text-[11px] text-white/60 truncate max-w-[140px]">
                      {String(row[nameKey] ?? '')}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/80 font-semibold tabular-nums ml-2">
                    {val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: CHART_PALETTE[i % CHART_PALETTE.length], opacity: 0.7 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
