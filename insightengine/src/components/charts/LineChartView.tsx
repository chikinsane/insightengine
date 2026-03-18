'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CHART_PALETTE } from './BarChartView'

interface LineChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#13131f] border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl min-w-[140px]">
      <p className="text-[11px] text-white/40 mb-2">{label}</p>
      {payload.map((p: { name: string; value: unknown; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[11px] text-white/60 truncate max-w-[100px]">{p.name}:</span>
          <span className="text-[11px] font-semibold text-white ml-auto">
            {typeof p.value === 'number'
              ? p.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
              : String(p.value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  )
}

export function LineChartView({ data, xKey, yKeys, title }: LineChartViewProps) {
  const fmtTick = (v: unknown) => {
    const s = String(v ?? '')
    return s.length > 12 ? s.slice(0, 11) + '…' : s
  }
  const fmtNum = (v: unknown) =>
    typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(v)

  return (
    <div className="w-full">
      {title && <p className="text-white/70 text-sm font-medium mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey}
            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            interval={Math.max(0, Math.floor(data.length / 8) - 1)}
            tickFormatter={fmtTick} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11 }}
            axisLine={false} tickLine={false} tickFormatter={fmtNum} />
          <Tooltip content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
          {yKeys.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', paddingTop: 8 }} />
          )}
          {yKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} name={key}
              stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
              strokeWidth={2.5}
              dot={{ fill: CHART_PALETTE[i % CHART_PALETTE.length], r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: CHART_PALETTE[i % CHART_PALETTE.length], strokeOpacity: 0.35, strokeWidth: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
