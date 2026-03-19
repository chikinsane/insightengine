'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import { CHART_PALETTE, GRADIENT_PAIRS } from './BarChartView'

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
    <div className="bg-[#0d0d1a]/95 backdrop-blur border border-white/[0.1] rounded-2xl px-4 py-3.5 shadow-2xl min-w-[160px]">
      <p className="text-[11px] font-medium text-white/40 mb-2.5">{label}</p>
      {payload.map((p: { name: string; value: unknown; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2.5 mt-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[11px] text-white/55 truncate">{p.name}</span>
          <span className="text-sm font-bold text-white ml-auto tabular-nums">
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
  const fmtTick = (v: unknown) => { const s = String(v ?? ''); return s.length > 12 ? s.slice(0, 11) + '…' : s }
  const fmtNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(v)

  return (
    <div className="w-full">
      {title && <p className="text-white/80 text-sm font-semibold mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={420}>
        <AreaChart data={data} margin={{ top: 12, right: 20, left: 12, bottom: 20 }}>
          <defs>
            {yKeys.map((_, i) => (
              <linearGradient key={i} id={`lineGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][0]} stopOpacity={0.35} />
                <stop offset="95%" stopColor={GRADIENT_PAIRS[i % GRADIENT_PAIRS.length][0]} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey={xKey}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            interval={Math.max(0, Math.floor(data.length / 8) - 1)}
            tickFormatter={fmtTick} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false} tickLine={false} tickFormatter={fmtNum} />
          <Tooltip content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
          {yKeys.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', paddingTop: 12 }} />
          )}
          {yKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} name={key}
              stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
              strokeWidth={3}
              fill={`url(#lineGrad${i})`}
              dot={false}
              activeDot={{ r: 6, fill: CHART_PALETTE[i % CHART_PALETTE.length], stroke: 'rgba(255,255,255,0.3)', strokeWidth: 3 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
