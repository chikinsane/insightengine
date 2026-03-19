'use client'

import { useState, type ReactElement } from 'react'
import type { VizType } from '@/types/query'
import { BarChartView } from './BarChartView'
import { LineChartView } from './LineChartView'
import { PieChartView } from './PieChartView'
import { ScatterChartView } from './ScatterChartView'
import { TableView } from './TableView'

interface ChartRendererProps {
  vizType: VizType
  data: Record<string, unknown>[]
  columns: { name: string; type: string }[]
  chartConfig: { xKey: string; yKeys: string[]; title: string }
}

const VIZ_OPTIONS: { type: VizType; icon: ReactElement; label: string }[] = [
  {
    type: 'bar', label: 'Bar',
    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="1" y="6" width="3" height="9" rx="1"/><rect x="6" y="3" width="3" height="12" rx="1"/><rect x="11" y="1" width="3" height="14" rx="1"/></svg>,
  },
  {
    type: 'line', label: 'Line',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><polyline points="1,12 5,7 9,9 15,3"/></svg>,
  },
  {
    type: 'pie', label: 'Pie',
    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M8 1a7 7 0 1 0 7 7H8V1z" opacity=".4"/><path d="M8 1v7h7A7 7 0 0 0 8 1z"/></svg>,
  },
  {
    type: 'scatter', label: 'Scatter',
    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><circle cx="3" cy="12" r="1.5"/><circle cx="7" cy="7" r="1.5"/><circle cx="5" cy="4" r="1.5"/><circle cx="12" cy="9" r="1.5"/><circle cx="13" cy="3" r="1.5"/></svg>,
  },
  {
    type: 'table', label: 'Table',
    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="1" y="1" width="14" height="3" rx="1" opacity=".5"/><rect x="1" y="6" width="6" height="3" rx="1"/><rect x="9" y="6" width="6" height="3" rx="1"/><rect x="1" y="11" width="6" height="3" rx="1"/><rect x="9" y="11" width="6" height="3" rx="1"/></svg>,
  },
]

export function ChartRenderer({
  vizType,
  data,
  columns,
  chartConfig,
}: ChartRendererProps) {
  const [activeType, setActiveType] = useState<VizType>(vizType)

  const { xKey, yKeys, title } = chartConfig
  const primaryY = yKeys[0] ?? columns[1]?.name ?? columns[0]?.name ?? 'y'

  function renderChart() {
    switch (activeType) {
      case 'bar':
        return <BarChartView data={data} xKey={xKey} yKeys={yKeys} title={title} />
      case 'line':
        return <LineChartView data={data} xKey={xKey} yKeys={yKeys} title={title} />
      case 'pie':
        return <PieChartView data={data} nameKey={xKey} valueKey={primaryY} title={title} />
      case 'scatter':
        return <ScatterChartView data={data} xKey={yKeys[1] ?? xKey} yKey={primaryY} title={title} />
      case 'table':
      default:
        return <TableView columns={columns} rows={data} title={title} />
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Ambient glow border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10 pointer-events-none" />
      <div className="relative bg-[#0b0b16] border border-white/[0.08] rounded-2xl p-6 space-y-5">

        {/* Header: switcher + row count */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
            {VIZ_OPTIONS.map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                title={label}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150',
                  activeType === type
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
                    : 'text-white/30 hover:text-white/65 hover:bg-white/[0.05]',
                ].join(' ')}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeType !== 'table' && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400/50 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                AI selected
              </span>
            )}
            <span className="text-[11px] text-white/20 tabular-nums">
              {data.length.toLocaleString()} rows
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="min-h-[420px] flex flex-col justify-center">
          {renderChart()}
        </div>
      </div>
    </div>
  )
}
