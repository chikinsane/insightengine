// @ts-ignore – echarts-for-react types may lag behind echarts 6
import ReactECharts from 'echarts-for-react'
import type { Pillar } from '../../types'

interface RadarChartProps {
  pillars: Pillar[]
  showExternal?: boolean
  height?: number
}

export default function RadarChart({ pillars, showExternal = false, height = 400 }: RadarChartProps) {
  const indicator = pillars.map((p) => ({ name: p.label, max: 5 }))

  const series: object[] = [
    {
      name: 'Internal',
      type: 'radar',
      data: [
        {
          value: pillars.map((p) => p.internalScore),
          name: 'Internal Score',
          areaStyle: { color: 'rgba(225, 29, 72, 0.15)' },
          lineStyle: { color: '#e11d48', width: 2 },
          itemStyle: { color: '#e11d48' },
        },
      ],
    },
  ]

  if (showExternal) {
    series.push({
      name: 'External',
      type: 'radar',
      data: [
        {
          value: pillars.map((p) => p.externalScore),
          name: 'External Score',
          lineStyle: { color: '#0ea5e9', width: 2, type: 'dashed' },
          itemStyle: { color: '#0ea5e9' },
          areaStyle: { color: 'transparent' },
        },
      ],
    })
  }

  const option = {
    backgroundColor: 'transparent',
    legend: {
      bottom: 0,
      textStyle: { color: '#94a3b8', fontSize: 12 },
      data: showExternal ? ['Internal Score', 'External Score'] : ['Internal Score'],
    },
    radar: {
      indicator,
      radius: '65%',
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } },
      axisName: {
        color: '#94a3b8',
        fontSize: 11,
      },
    },
    series,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
    },
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height }}
      notMerge
    />
  )
}
