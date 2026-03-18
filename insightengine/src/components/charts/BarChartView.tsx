'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

export const CHART_PALETTE = [
  '#7c3aed', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#a78bfa', '#14b8a6',
]

interface BarChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]        // primary + any additional series
  title?: string
  horizontal?: boolean   // auto-flip when labels are long
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#13131f] border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl min-w-[140px]">
      <p className="text-[11px] text-white/40 mb-2 truncate max-w-[180px]">{label}</p>
      {payload.map((p: { name: string; value: unknown; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[11px] text-white/60 truncate max-w-[100px]">{p.name}:</span>
          <span className="text-[11px] font-semibold text-white ml-auto">
            {typeof p.value === 'number'
              ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
              : String(p.value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  )
}

export function BarChartView({ data, xKey, yKeys, title, horizontal }: BarChartViewProps) {
  const multiSeries = yKeys.length > 1
  // Auto-switch to horizontal when category labels are long
  const isHorizontal = horizontal ??
    data.some((d) => String(d[xKey] ?? '').length > 10)

  const fmtTick = (v: unknown) => {
    const s = String(v ?? '')
    return s.length > 14 ? s.slice(0, 13) + '…' : s
  }
  const fmtNum = (v: unknown) =>
    typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(v)

  return (
    <div className="w-full">
      {title && <p className="text-white/70 text-sm font-medium mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{
            top: 4,
            right: 16,
            bottom: isHorizontal ? 4 : (data.length > 7 ? 48 : 16),
            left: isHorizontal ? 100 : 8,
          }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"
            vertical={isHorizontal} horizontal={!isHorizontal} />

          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11 }}
                axisLine={false} tickLine={false} tickFormatter={fmtNum} />
              <YAxis type="category" dataKey={xKey} width={96}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false} tickLine={false} tickFormatter={fmtTick} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                interval={0}
                angle={data.length > 7 ? -38 : 0}
                textAnchor={data.length > 7 ? 'end' : 'middle'}
                tickFormatter={fmtTick} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11 }}
                axisLine={false} tickLine={false} tickFormatter={fmtNum} />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {multiSeries && (
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', paddingTop: 10 }} />
          )}

          {yKeys.map((key, seriesIdx) => (
            <Bar key={key} dataKey={key} name={key}
              fill={CHART_PALETTE[seriesIdx % CHART_PALETTE.length]}
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={multiSeries ? 36 : 52}
            >
              {/* Per-bar gradient colours only for single-series */}
              {!multiSeries && data.map((_, idx) => (
                <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} fillOpacity={0.9} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
