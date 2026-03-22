import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

interface LineConfig {
  key: string
  color: string
  label: string
}

interface Annotation {
  month: string
  label: string
}

interface LineChartProps {
  data: { month: string; [key: string]: number | string }[]
  lines: LineConfig[]
  annotations?: Annotation[]
  height?: number
}

export default function LineChart({ data, lines, annotations = [], height = 300 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
        <XAxis
          dataKey="month"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f1f5f9',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, fill: line.color }}
            activeDot={{ r: 6 }}
          />
        ))}
        {annotations.map((annotation) => (
          <ReferenceLine
            key={annotation.month}
            x={annotation.month}
            stroke="#e11d48"
            strokeDasharray="4 4"
            label={{
              value: annotation.label,
              angle: -90,
              fill: '#94a3b8',
              fontSize: 10,
              position: 'insideTopLeft',
            }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
