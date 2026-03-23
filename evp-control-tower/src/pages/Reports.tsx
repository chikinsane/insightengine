import { useState } from 'react'
import { PILLARS } from '../data/pillars'
import { SURVEY_RESPONSES } from '../data/surveyResponses'
import { exportPDF } from '../utils/exportPDF'
import { exportPPTX } from '../utils/exportPPTX'
import { calcENPS, calcOverallScore } from '../utils/scoreCalculator'
import { useOrgConfig } from '../hooks/useOrgConfig'
import Toast from '../components/ui/Toast'
import type { ExportConfig } from '../types'
import { FileDown, FileText, Settings, Eye } from 'lucide-react'

export default function Reports() {
  const { org } = useOrgConfig()
  const [includedPillarIds, setIncludedPillarIds] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const [format, setFormat] = useState<'pdf' | 'pptx' | 'both'>('both')
  const [dateRange, setDateRange] = useState('Q1 2026 (Jan–Mar)')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' })

  const togglePillar = (id: number) => {
    setIncludedPillarIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const config: ExportConfig = {
        org,
        pillars: PILLARS,
        enps: calcENPS(SURVEY_RESPONSES.map(r => r.enps)),
        overallScore: calcOverallScore(PILLARS.reduce((sum, p) => sum + p.internalScore, 0) / PILLARS.length),
        responseCount: SURVEY_RESPONSES.length,
        includedPillarIds,
        format,
        dateRange,
      }
      if (format === 'pdf' || format === 'both') await exportPDF(config)
      if (format === 'pptx' || format === 'both') await exportPPTX(config)
      setToast({ visible: true, message: `Report${format === 'both' ? 's' : ''} downloaded successfully!` })
    } catch (_e) {
      setToast({ visible: true, message: 'Export failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const missionPillar = PILLARS.find(p => p.id === 10)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
          <FileDown size={24} className="text-rose-600" />
          Reports & Exports
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Generate branded PDF and PPTX reports for {org.name}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── CONFIG PANEL ── */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-5">
            <h2 className="text-base font-semibold text-[var(--text)] flex items-center gap-2 mb-4">
              <Settings size={16} className="text-rose-500" />
              Report Configuration
            </h2>

            {/* Date Range */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wide">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option>Q1 2026 (Jan–Mar)</option>
                <option>Q4 2025 (Oct–Dec)</option>
                <option>2025 Full Year</option>
              </select>
            </div>

            {/* Sections to include */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wide">
                Sections to Include
              </label>
              <div className="space-y-2">
                {PILLARS.map(pillar => (
                  <label key={pillar.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={includedPillarIds.includes(pillar.id)}
                      onChange={() => togglePillar(pillar.id)}
                      className="w-4 h-4 rounded accent-rose-600"
                    />
                    <span className="text-sm text-[var(--text)] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {pillar.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wide">
                Format
              </label>
              <div className="flex gap-2">
                {(['pdf', 'pptx', 'both'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      format === f
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || includedPillarIds.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  Generate {format === 'both' ? 'PDF + PPTX' : format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── PREVIEW PANE ── */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-[var(--text)] flex items-center gap-2 mb-4">
            <Eye size={16} className="text-rose-500" />
            Report Preview
          </h2>

          <div className="space-y-4">
            {/* Preview card 1: Cover slide mockup */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-[var(--border)]">
              <div className="bg-rose-600 px-6 py-8 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center">
                    <span className="text-rose-600 font-bold text-sm">{org.logoInitials}</span>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">EVP Brand Report · Q1 2026</p>
                  </div>
                </div>
                <h3 className="text-white text-2xl font-bold mt-2">{org.name}</h3>
                <p className="text-rose-200 text-sm">Employer Brand Report</p>
                <p className="text-rose-300 text-xs">Q1 2026 · {org.country} · {org.industry}</p>
              </div>
            </div>

            {/* Preview card 2: Executive Summary */}
            <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] p-5">
              <div className="bg-rose-600 -mx-5 -mt-5 mb-4 px-5 py-3 rounded-t-2xl">
                <h3 className="text-white font-semibold text-sm">Executive Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 text-center">
                  <p className="text-rose-600 font-bold text-2xl">
                    {calcOverallScore(PILLARS.reduce((sum, p) => sum + p.internalScore, 0) / PILLARS.length)}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">Brand Score / 100</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
                  <p className="text-emerald-600 font-bold text-2xl">
                    {(() => { const v = calcENPS(SURVEY_RESPONSES.map(r => r.enps)); return (v > 0 ? '+' : '') + v })()}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">Employee NPS</p>
                </div>
                <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3 text-center">
                  <p className="text-sky-600 font-bold text-2xl">{SURVEY_RESPONSES.length}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Responses</p>
                </div>
              </div>
            </div>

            {/* Preview card 3: Sample pillar — Mission & Patient Purpose */}
            {missionPillar && (
              <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="bg-rose-600 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">
                    Pillar {missionPillar.id} · {missionPillar.label}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {missionPillar.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex gap-3 mb-4">
                    <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl px-4 py-3 flex-1 text-center">
                      <p className="text-rose-600 font-bold text-xl">{missionPillar.internalScore.toFixed(1)}</p>
                      <p className="text-slate-500 text-xs">Internal / 5.0</p>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl px-4 py-3 flex-1 text-center">
                      <p className="text-sky-600 font-bold text-xl">{missionPillar.externalScore.toFixed(1)}</p>
                      <p className="text-slate-500 text-xs">External / 5.0</p>
                    </div>
                  </div>
                  <p className="text-[var(--muted)] text-xs leading-relaxed line-clamp-3">
                    {missionPillar.expertOpinion}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {missionPillar.positiveThemes.map(t => (
                      <span key={t} className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Format info pill */}
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <FileText size={14} />
              <span>
                {includedPillarIds.length} of 10 pillar sections selected ·{' '}
                {format === 'both' ? 'PDF + PPTX' : format.toUpperCase()} format ·{' '}
                {dateRange}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </div>
  )
}
