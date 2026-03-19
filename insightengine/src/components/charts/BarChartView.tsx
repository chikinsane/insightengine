'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell, Legend,
} from 'recharts'

export const CHART_PALETTE = [
  '#7c3aed', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#a78bfa', '#14b8a6',
]

export const GRADIENT_PAIRS: [string, string][] = [
  ['#9333ea', '#4f46e5'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d0d1a]/95 backdrop-blur border border-white/[0.1] rounded-2xl px-4 py-3.5 shadow-2xl min-w-[160px]">
      <p className="text-[11px] font-medium text-white/40 mb-2.5 truncate max-w-[200px]">{label}</p>
      {payload.map((p: { name: string; value: unknown; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2.5 mt-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[11px] text-white/55 truncate">{p.name}</span>
          <span className="text-sm font-bold text-white ml-auto tabular-nums">
            {typeof p.value === 'number'
              ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
              : String(p.value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  )
}

interface BarChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  title?: string
  horizontal?: boolean
}

export function BarChartView({ data, xKey, yKeys, title, horizontal }: BarChartViewProps) {
  const multiSeries = yKeys.length > 1
  const isHorizontal = horizontal ?? data.some((d) => String(d[xKey] ?? '').length > 10)
  const fmtTick = (v: unknown) => { const s = String(v ?? ''); return s.length > 16 ? s.slice(0, 15) + '…' : s }
  const fmtNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(v)

  return (
    <div className="w-full">
      {title && <p className="text-white/80 text-sm font-semibold mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 20, bottom: isHorizontal ? 8 : (data.length > 7 ? 56 : 20), left: isHorizontal ? 110 : 12 }}
        >
          <defs>
            {(multiSeries ? yKeys : ['single']).map((_, i) => (
              <linearGradient key={i} id={`barGrad${i}`} x1={isHorizontal ? '1' : '0'} y1={isHorizontal ? '0' : '0'} x2={isHorizontal ? '0' : '0'} y2={isHorizontal ? '0' : '1'}>
                <stop offset="0%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][0]} stopOpacity={1} />
                <stop offset="100%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][1]} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4"
            vertical={isHorizontal} horizontal={!isHorizontal} />

          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false} tickLine={false} tickFormatter={fmtNum} />
              <YAxis type="category" dataKey={xKey} width={106}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={false} tickLine={false} tickFormatter={fmtTick} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                interval={0}
                angle={data.length > 7 ? -38 : 0}
                textAnchor={data.length > 7 ? 'end' : 'middle'}
                tickFormatter={fmtTick} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false} tickLine={false} tickFormatter={fmtNum} />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
          {multiSeries && (
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', paddingTop: 12 }} />
          )}

          {yKeys.map((key, si) => (
            <Bar key={key} dataKey={key} name={key}
              fill={multiSeries ? `url(#barGrad${si})` : `url(#barGrad0)`}
              radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
              maxBarSize={multiSeries ? 40 : 56}
            >
              {!multiSeries && data.map((_, idx) => (
                <Cell key={idx} fill={`url(#barGrad${idx % GRADIENT_PAIRS.length})`} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
