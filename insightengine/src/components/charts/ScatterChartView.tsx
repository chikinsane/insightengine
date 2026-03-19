'use client'

import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface ScatterChartViewProps {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload ?? {}
  return (
    <div className="bg-[#0d0d1a]/95 backdrop-blur border border-white/[0.1] rounded-2xl px-4 py-3.5 shadow-2xl">
      {Object.entries(point).map(([k, v]) => (
        <div key={k} className="flex items-center gap-3 mt-1 first:mt-0">
          <span className="text-[11px] text-white/40 w-20 truncate">{k}</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(v)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ScatterChartView({ data, xKey, yKey, title }: ScatterChartViewProps) {
  const xVals = data.map((r) => Number(r[xKey])).filter((n) => !isNaN(n))
  const yVals = data.map((r) => Number(r[yKey])).filter((n) => !isNaN(n))
  const xMean = xVals.length ? xVals.reduce((a, b) => a + b, 0) / xVals.length : null
  const yMean = yVals.length ? yVals.reduce((a, b) => a + b, 0) / yVals.length : null

  const fmtNum = (v: unknown) => typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : String(v)
  const mappedData = data.map((row) => ({ [xKey]: row[xKey], [yKey]: row[yKey] }))

  return (
    <div className="w-full">
      {title && <p className="text-white/80 text-sm font-semibold mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 12, right: 20, left: 12, bottom: 20 }}>
          <defs>
            <radialGradient id="dotGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
            </radialGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <XAxis dataKey={xKey} type="number" name={xKey}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            axisLine={false} tickLine={false} tickFormatter={fmtNum} />
          <YAxis dataKey={yKey} type="number" name={yKey}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false} tickLine={false} tickFormatter={fmtNum} width={52} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.06)' }} />
          {xMean !== null && (
            <ReferenceLine x={xMean} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
          )}
          {yMean !== null && (
            <ReferenceLine y={yMean} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
          )}
          <Scatter data={mappedData} fill="url(#dotGrad)" fillOpacity={0.85} r={5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
