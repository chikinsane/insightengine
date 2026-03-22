import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts'

interface DonutChartProps {
  promoters: number
  passives: number
  detractors: number
  enps: number
}

const COLORS = {
  Promoters: '#10b981',
  Passives: '#f59e0b',
  Detractors: '#e11d48',
}

export default function DonutChart({ promoters, passives, detractors, enps }: DonutChartProps) {
  const data = [
    { name: 'Promoters', value: promoters },
    { name: 'Passives', value: passives },
    { name: 'Detractors', value: detractors },
  ]

  const enpsColor = enps >= 30 ? '#10b981' : enps >= 0 ? '#f59e0b' : '#e11d48'

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center eNPS label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: '40px' }}>
        <span className="text-xs text-[var(--muted)] font-medium">eNPS</span>
        <span className="text-3xl font-bold" style={{ color: enpsColor }}>
          {enps > 0 ? `+${enps}` : enps}
        </span>
      </div>
    </div>
  )
}
