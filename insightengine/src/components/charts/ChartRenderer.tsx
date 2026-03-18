'use client'

import { useState } from 'react'
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

const VIZ_OPTIONS: { type: VizType; icon: string; label: string }[] = [
  { type: 'bar',     icon: '▐▌', label: 'Bar' },
  { type: 'line',    icon: '↗',  label: 'Line' },
  { type: 'pie',     icon: '◕',  label: 'Pie' },
  { type: 'scatter', icon: '⁙',  label: 'Scatter' },
  { type: 'table',   icon: '⊞',  label: 'Table' },
]

export function ChartRenderer({
  vizType,
  data,
  columns,
  chartConfig,
}: ChartRendererProps) {
  // User can override the AI-suggested viz type
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
        return (
          <ScatterChartView
            data={data}
            xKey={yKeys[1] ?? xKey}
            yKey={primaryY}
            title={title}
          />
        )
      case 'table':
      default:
        return <TableView columns={columns} rows={data} title={title} />
    }
  }

  return (
    <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      {/* Chart type switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.05]">
          {VIZ_OPTIONS.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                activeType === type
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-xs leading-none">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Row count badge */}
        <span className="text-[11px] text-white/25 tabular-nums">
          {data.length.toLocaleString()} row{data.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Chart area */}
      {renderChart()}
    </div>
  )
}
