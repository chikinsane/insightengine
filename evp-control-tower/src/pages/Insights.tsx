import { useState, lazy, Suspense } from 'react'
import { PILLARS } from '../data/pillars'
import { TREND_DATA, TREND_ANNOTATIONS } from '../data/trends'
import TabBar from '../components/ui/TabBar'
const RadarChart = lazy(() => import('../components/charts/RadarChart'))
import LineChart from '../components/charts/LineChart'
import ScoreGauge from '../components/ui/ScoreGauge'
import RAGBadge from '../components/ui/RAGBadge'
import ReviewQuote from '../components/ui/ReviewQuote'
import type { Pillar } from '../types'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pillar', label: 'Pillar Deep-Dive' },
  { id: 'posneg', label: 'Positives & Negatives' },
  { id: 'trend', label: 'Trend' },
]

// Map pillar status to a position in the priority matrix
function getPillarPosition(p: Pillar, index: number): React.CSSProperties {
  const offset = index * 5
  switch (p.status) {
    case 'critical':
      return { left: `${70 + offset}%`, top: '15%' }
    case 'gap':
      return { left: `${25 + offset}%`, top: '20%' }
    case 'mixed':
      return { left: `${45 + offset}%`, top: '55%' }
    case 'strength':
      return { left: `${20 + offset}%`, top: '65%' }
    case 'top-strength':
      return { left: `${15 + offset}%`, top: '75%' }
    default:
      return { left: '50%', top: '50%' }
  }
}

// Generate palette of distinct hues for per-pillar lines
const PILLAR_LINE_COLORS: Record<string, string> = {
  comp_benefits: '#f97316',
  work_life_balance: '#ef4444',
  career_growth: '#22c55e',
  culture_values: '#8b5cf6',
  leadership: '#0ea5e9',
  work_environment: '#14b8a6',
  dei: '#a855f7',
  wellbeing: '#ec4899',
  clinical_excellence: '#84cc16',
  mission_purpose: '#f59e0b',
}

// ----- Overview Tab -----
function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* Heading + badge */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-[var(--text)]">EVP Insights</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-rose-500 text-white shadow-sm">
          74 / 100
        </span>
      </div>

      {/* Industry benchmark */}
      <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-5">
          Industry Benchmark Comparison
        </h2>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-[var(--text)]">Aster QCIL</span>
              <span className="text-sm font-semibold text-rose-500">74 / 100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div className="rounded-full h-3 bg-rose-500 transition-all" style={{ width: '74%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium text-[var(--text)]">Industry Avg</span>
              <span className="text-sm font-semibold text-slate-400">68 / 100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div className="rounded-full h-3 bg-slate-300 dark:bg-slate-600 transition-all" style={{ width: '68%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Radar */}
      <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          Pillar Radar — Internal vs External
        </h2>
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-[var(--muted)]">Loading chart...</div>}>
          <RadarChart pillars={PILLARS} showExternal={true} height={400} />
        </Suspense>
      </div>

      {/* Composite scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">eNPS</p>
          <ScoreGauge score={32} max={100} size={120} color="#e11d48" label="eNPS" />
          <p className="text-xs text-[var(--muted)] text-center mt-1">
            32% net promoter score — employees who actively recommend Aster QCIL as a place to work.
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Overall Brand Score</p>
          <ScoreGauge score={74} max={100} size={120} color="#e11d48" label="Score" />
          <p className="text-xs text-[var(--muted)] text-center mt-1">
            Composite EVP brand score based on internal surveys and external platform data.
          </p>
        </div>
      </div>
    </div>
  )
}

// ----- Pillar Deep-Dive Tab -----
function PillarDeepDiveTab() {
  const [selectedPillarKey, setSelectedPillarKey] = useState(PILLARS[0].key)
  const selectedPillar = PILLARS.find(p => p.key === selectedPillarKey) ?? PILLARS[0]

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div>
        <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
          Select Pillar
        </label>
        <select
          value={selectedPillarKey}
          onChange={e => setSelectedPillarKey(e.target.value)}
          className="bg-[var(--card)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 w-full sm:w-72"
        >
          {PILLARS.map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Score gauges */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <ScoreGauge
            score={Math.round(selectedPillar.internalScore * 20)}
            max={100}
            size={140}
            color="#e11d48"
            label="Internal"
          />
          <p className="text-xs text-[var(--muted)] mt-2">
            Raw: {selectedPillar.internalScore.toFixed(1)} / 5
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <ScoreGauge
            score={Math.round(selectedPillar.externalScore * 20)}
            max={100}
            size={140}
            color="#0ea5e9"
            label="External"
          />
          <p className="text-xs text-[var(--muted)] mt-2">
            Raw: {selectedPillar.externalScore.toFixed(1)} / 5
          </p>
        </div>
      </div>

      {/* Expert opinion */}
      <blockquote className="border-l-4 border-rose-500 pl-5 py-3 bg-rose-50 dark:bg-rose-950/30 rounded-r-xl italic text-[var(--text)] text-sm leading-relaxed">
        {selectedPillar.expertOpinion}
      </blockquote>

      {/* Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
            Positive Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPillar.positiveThemes.map(t => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3">
            Negative Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPillar.negativeThemes.map(t => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quotes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
          Representative Quotes
        </p>
        <div className="space-y-3">
          {selectedPillar.quotes.slice(0, 4).map((q, i) => (
            <ReviewQuote key={i} text={q.text} source={q.source} sentiment={q.sentiment} />
          ))}
        </div>
      </div>

      {/* RAG badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--muted)]">Status:</span>
        <RAGBadge status={selectedPillar.status} />
      </div>
    </div>
  )
}

// ----- Positives & Negatives Tab -----
function PosNegTab() {
  const strengths = PILLARS.filter(p => p.status === 'top-strength' || p.status === 'strength')
  const gaps = PILLARS.filter(p => p.status === 'critical' || p.status === 'gap')

  return (
    <div className="space-y-8">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Strengths */}
        <div>
          <h2 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">
            ✅ Top Strengths
          </h2>
          <div className="space-y-3">
            {strengths.map(p => (
              <div
                key={p.key}
                className="bg-[var(--card)] rounded-xl p-4 shadow-sm border-l-4 border-emerald-400"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-[var(--text)] text-sm">{p.label}</p>
                  <RAGBadge status={p.status} />
                </div>
                <p className="text-xs text-[var(--muted)] mb-2">
                  Internal: {p.internalScore.toFixed(1)} / 5
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {p.positiveThemes[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps */}
        <div>
          <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4">
            ⚠️ Critical Gaps
          </h2>
          <div className="space-y-3">
            {gaps.map(p => (
              <div
                key={p.key}
                className="bg-[var(--card)] rounded-xl p-4 shadow-sm border-l-4 border-rose-400"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-[var(--text)] text-sm">{p.label}</p>
                  <RAGBadge status={p.status} />
                </div>
                <p className="text-xs text-[var(--muted)] mb-2">
                  Internal: {p.internalScore.toFixed(1)} / 5
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Action: Address {p.negativeThemes[0]?.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Matrix */}
      <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-6">
          Priority Matrix — Impact vs Effort
        </h2>
        <div className="relative ml-8 mb-8">
          <div className="relative h-64 border-2 border-[var(--border)] rounded-xl overflow-visible">
            {/* Quadrant labels */}
            <div className="absolute top-2 left-2 text-xs text-[var(--muted)]">Quick Wins</div>
            <div className="absolute top-2 right-2 text-xs text-[var(--muted)]">Strategic Priorities</div>
            <div className="absolute bottom-2 left-2 text-xs text-[var(--muted)]">Low Priority</div>
            <div className="absolute bottom-2 right-2 text-xs text-[var(--muted)]">Major Projects</div>
            {/* Divider lines */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border)]" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]" />
            {/* Axis labels */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] -rotate-90">
              Impact
            </div>
            <div className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 text-xs text-[var(--muted)]">
              Effort →
            </div>
            {/* Pillar dots */}
            {(() => {
              const localCount: Record<string, number> = {}
              return PILLARS.map(p => {
                const idx = localCount[p.status] ?? 0
                localCount[p.status] = idx + 1
                const pos = getPillarPosition(p, idx)
                return (
                  <div key={p.key} className="absolute flex items-center" style={pos}>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        p.status === 'critical'
                          ? 'bg-rose-500'
                          : p.status === 'gap'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-[var(--text)] ml-1 whitespace-nowrap">
                      {p.label.split(' ')[0]}
                    </span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- Trend Tab -----
function TrendTab() {
  const [selectedPillars, setSelectedPillars] = useState<string[]>([])

  const togglePillar = (key: string) => {
    setSelectedPillars(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const chartData = TREND_DATA.map(t => ({
    month: t.month,
    overall: t.overallScore,
    ...Object.fromEntries(
      selectedPillars.map(key => [key, Math.round(t.pillarScores[key] * 20)])
    ),
  }))

  const lines = [
    { key: 'overall', color: '#e11d48', label: 'Brand Score' },
    ...selectedPillars.map(key => ({
      key,
      color: PILLAR_LINE_COLORS[key] ?? '#64748b',
      label: PILLARS.find(p => p.key === key)?.label ?? key,
    })),
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-[var(--text)]">
        Brand Score Trend · Q1 2025 → Q1 2026
      </h2>

      {/* Line chart */}
      <div className="bg-[var(--card)] rounded-2xl p-6 shadow-sm">
        <LineChart
          data={chartData}
          lines={lines}
          annotations={TREND_ANNOTATIONS}
          height={300}
        />
      </div>

      {/* Pillar toggle checkboxes */}
      <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
          Overlay Pillar Trends
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PILLARS.map(p => (
            <label key={p.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPillars.includes(p.key)}
                onChange={() => togglePillar(p.key)}
                className="accent-rose-500"
              />
              <span className="text-sm text-[var(--text)]">{p.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ----- Main Page -----
export default function Insights() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'pillar' && <PillarDeepDiveTab />}
      {activeTab === 'posneg' && <PosNegTab />}
      {activeTab === 'trend' && <TrendTab />}
    </div>
  )
}
