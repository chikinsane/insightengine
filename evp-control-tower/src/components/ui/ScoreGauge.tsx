interface ScoreGaugeProps {
  score: number
  max?: number
  size?: number
  color?: string
  label?: string
}

export default function ScoreGauge({ score, max = 100, size = 120, color = '#e11d48', label }: ScoreGaugeProps) {
  const pct = Math.min(1, Math.max(0, score / max))

  // Arc: 270 degrees starting at 135 degrees (bottom-left)
  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2

  // Helper: polar to cartesian
  const polarToCartesian = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  const arcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle)
    const end = polarToCartesian(endAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  const startAngle = 135
  const totalDegrees = 270
  const endAngle = startAngle + totalDegrees
  const fillEndAngle = startAngle + totalDegrees * pct

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Background arc */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill arc */}
          {pct > 0 && (
            <path
              d={arcPath(startAngle, fillEndAngle)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center value */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingTop: size * 0.08 }}
        >
          <span className="font-bold text-[var(--text)]" style={{ fontSize: size * 0.22 }}>
            {typeof score === 'number' && score % 1 !== 0 ? score.toFixed(1) : score}
          </span>
          {label && (
            <span className="text-[var(--muted)]" style={{ fontSize: size * 0.1 }}>
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
