'use client'

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
  chartConfig: { xKey: string; yKey: string; title: string }
}

export function ChartRenderer({
  vizType,
  data,
  columns,
  chartConfig,
}: ChartRendererProps) {
  const { xKey, yKey, title } = chartConfig

  function renderChart() {
    switch (vizType) {
      case 'bar':
        return (
          <BarChartView
            data={data}
            xKey={xKey}
            yKey={yKey}
            title={title}
          />
        )
      case 'line':
        return (
          <LineChartView
            data={data}
            xKey={xKey}
            yKey={yKey}
            title={title}
          />
        )
      case 'pie':
        return (
          <PieChartView
            data={data}
            nameKey={xKey}
            valueKey={yKey}
            title={title}
          />
        )
      case 'scatter':
        return (
          <ScatterChartView
            data={data}
            xKey={xKey}
            yKey={yKey}
            title={title}
          />
        )
      case 'table':
      default:
        return (
          <TableView
            columns={columns}
            rows={data}
            title={title}
          />
        )
    }
  }

  return (
    <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-6">
      {renderChart()}
    </div>
  )
}
