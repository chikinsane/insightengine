import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import TabBar from '../components/ui/TabBar'
import ScoreGauge from '../components/ui/ScoreGauge'
import PillarCard from '../components/ui/PillarCard'
import Toast from '../components/ui/Toast'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'
import { usePillars } from '../hooks/usePillars'
import { useSurveyData } from '../hooks/useSurveyData'
import { parseCSVFile } from '../utils/csvParser'
import type { SurveyResponse } from '../types'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface UploadResult {
  processed: SurveyResponse[]
  skipped: { row: number; error: string }[]
}

// ─────────────────────────────────────────────
// Tab: Overview
// ─────────────────────────────────────────────
function OverviewTab() {
  const PILLARS = usePillars()
  const deptData = [
    { name: 'Nursing', value: 82 },
    { name: 'Clinical', value: 68 },
    { name: 'Admin', value: 44 },
    { name: 'Operations', value: 37 },
    { name: 'Pharmacy', value: 31 },
    { name: 'Management', value: 25 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-[var(--text)]">Internal Surveys</h2>
        <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold px-3 py-1 rounded-full">
          Q1 2026
        </span>
      </div>

      {/* Top row: gauge + bar chart + donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completion Rate */}
        <div className="bg-[var(--card)] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold text-[var(--text)]">Completion Rate</p>
          <ScoreGauge score={73} max={100} label="Complete" size={120} />
          <p className="text-xs text-[var(--muted)]">287 of 393 eligible respondents</p>
        </div>

        {/* Responses by Department */}
        <div className="bg-[var(--card)] rounded-xl shadow-sm p-6 md:col-span-2">
          <p className="text-sm font-semibold text-[var(--text)] mb-4">Responses by Department</p>
          <BarChart data={deptData} horizontal={true} height={220} />
        </div>
      </div>

      {/* eNPS Donut */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <p className="text-sm font-semibold text-[var(--text)] mb-2">eNPS Distribution</p>
        <p className="text-xs text-[var(--muted)] mb-4">Based on 287 responses</p>
        <div className="max-w-sm mx-auto">
          <DonutChart promoters={166} passives={52} detractors={69} enps={34} />
        </div>
      </div>

      {/* Pillar Cards */}
      <div>
        <p className="text-sm font-semibold text-[var(--text)] mb-4">EVP Pillar Scores</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Survey Builder
// ─────────────────────────────────────────────
function BuilderTab() {
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  const surveyUrl = `${window.location.origin}/survey/q1-2026`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl)
      setToast({ visible: true, message: 'Link copied to clipboard!', type: 'success' })
    } catch {
      setToast({ visible: true, message: 'Could not copy link', type: 'info' })
    }
  }

  const handleNewSurvey = () => {
    setToast({ visible: true, message: 'Coming soon in production', type: 'info' })
  }

  const closeToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Active Survey Card */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-1">Active Survey</p>
            <h3 className="text-base font-semibold text-[var(--text)]">
              Aster QCIL EVP Survey Q1 2026
            </h3>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              <span className="text-emerald-500 font-medium">Active</span> • 287 responses
            </p>
          </div>
          <button
            onClick={handleNewSurvey}
            className="px-4 py-2 border border-[var(--border)] text-sm text-[var(--muted)] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            + New Survey
          </button>
        </div>

        {/* Share URL */}
        <div>
          <p className="text-xs text-[var(--muted)] mb-2">Share URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-100 dark:bg-slate-800 text-[var(--text)] text-xs px-3 py-2 rounded-lg truncate">
              {surveyUrl}
            </code>
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <p className="text-sm font-semibold text-[var(--text)] mb-4">QR Code</p>
        <p className="text-xs text-[var(--muted)] mb-4">
          Print or display this QR code for employees to scan and complete the survey on their mobile device.
        </p>
        <div className="flex justify-center p-4 bg-white dark:bg-white rounded-xl w-fit">
          <QRCodeSVG value={surveyUrl} size={160} />
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={closeToast}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Responses
// ─────────────────────────────────────────────
const DEPARTMENTS = ['All', 'Nursing', 'Clinical', 'Admin', 'Operations', 'Pharmacy', 'Management']
const LOCATIONS = ['All', 'Bangalore', 'Hyderabad', 'Kochi', 'Delhi NCR', 'Chennai']
const PAGE_SIZE = 20

function calcAvgScore(scores: Record<string, number>): number {
  const vals = Object.values(scores)
  if (vals.length === 0) return 0
  return vals.reduce((s, v) => s + v, 0) / vals.length
}

function getSentiment(avg: number): string {
  if (avg >= 4) return 'Positive'
  if (avg >= 3) return 'Neutral'
  return 'Negative'
}

function sentimentColor(s: string) {
  if (s === 'Positive') return 'text-emerald-600 dark:text-emerald-400'
  if (s === 'Neutral') return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function enpsColor(enps: number) {
  if (enps >= 9) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
  if (enps >= 7) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
}

function ResponsesTab() {
  const surveyData = useSurveyData()
  const [deptFilter, setDeptFilter] = useState('All')
  const [locFilter, setLocFilter] = useState('All')
  const [page, setPage] = useState(0)

  const filtered = surveyData.all.filter(r => {
    const deptOk = deptFilter === 'All' || r.department === deptFilter
    const locOk = locFilter === 'All' || r.location === locFilter
    return deptOk && locOk
  })

  const total = filtered.length
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)

  const handleDeptChange = (val: string) => { setDeptFilter(val); setPage(0) }
  const handleLocChange = (val: string) => { setLocFilter(val); setPage(0) }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Department</label>
          <select
            value={deptFilter}
            onChange={e => handleDeptChange(e.target.value)}
            className="bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Location</label>
          <select
            value={locFilter}
            onChange={e => handleLocChange(e.target.value)}
            className="bg-[var(--card)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Date', 'Department', 'Role', 'Location', 'eNPS', 'Avg Score', 'Sentiment'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[var(--muted)] px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(r => {
                const avg = calcAvgScore(r.scores)
                const sentiment = getSentiment(avg)
                return (
                  <tr key={r.id} className="border-b border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">{r.department}</td>
                    <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">{r.role}</td>
                    <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">{r.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${enpsColor(r.enps)}`}>
                        {r.enps}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                      {avg.toFixed(1)}/5
                    </td>
                    <td className={`px-4 py-3 font-medium whitespace-nowrap ${sentimentColor(sentiment)}`}>
                      {sentiment}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)]">
            Showing {total === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text)] rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text)] rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Admin Console
// ─────────────────────────────────────────────
function AdminConsoleTab() {
  const surveyData = useSurveyData()
  const [dragOver, setDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [applied, setApplied] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  })
  const closeToast = useCallback(() => setToast(t => ({ ...t, visible: false })), [])

  async function processFile(file: File) {
    setUploadError(null)
    setUploadResult(null)
    setApplied(false)
    try {
      const result = await parseCSVFile(file)
      setUploadResult(result)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDownloadTemplate() {
    const a = document.createElement('a')
    a.href = '/sample-survey-template.csv'
    a.download = 'sample-survey-template.csv'
    a.click()
  }

  function handleApplyUpload() {
    if (!uploadResult) return
    surveyData.addUploaded(uploadResult.processed)
    setApplied(true)
    setToast({ visible: true, message: `${uploadResult.processed.length} responses added successfully`, type: 'success' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Download Template */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Download Template</h3>
        <p className="text-xs text-[var(--muted)] mb-4">
          Download the CSV template with all required columns before uploading bulk responses.
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[var(--text)] text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Download Template
        </button>
      </div>

      {/* Upload Zone */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Bulk Upload Responses</h3>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
            ${dragOver ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'border-[var(--border)] bg-[var(--bg)]'}`}
        >
          <Upload className="mx-auto mb-3 text-[var(--muted)]" size={32} />
          <p className="font-medium text-[var(--text)]">Drop CSV or Excel file here</p>
          <p className="text-sm text-[var(--muted)]">or</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="mt-2 inline-block px-4 py-2 bg-rose-500 text-white rounded-lg cursor-pointer text-sm hover:bg-rose-600 transition-colors"
          >
            Browse Files
          </label>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg">
            <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">Upload Error</p>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-1">{uploadError}</p>
          </div>
        )}

        {/* Upload Summary */}
        {uploadResult && !applied && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ✅ {uploadResult.processed.length} rows processed
                {uploadResult.skipped.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {' '}• ⚠️ {uploadResult.skipped.length} rows skipped
                  </span>
                )}
              </p>
            </div>

            {uploadResult.skipped.length > 0 && (
              <div>
                <button
                  onClick={() => setShowErrors(v => !v)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--text)] underline transition-colors"
                >
                  {showErrors ? 'Hide' : 'Show'} skipped row details ({uploadResult.skipped.length})
                </button>
                {showErrors && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    {uploadResult.skipped.map((s, i) => (
                      <p key={i} className="text-xs text-[var(--muted)]">
                        <span className="font-medium text-rose-500">Row {s.row}:</span> {s.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {uploadResult.processed.length > 0 && (
              <button
                onClick={handleApplyUpload}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply Upload ({uploadResult.processed.length} responses)
              </button>
            )}
          </div>
        )}

        {applied && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              ✅ Upload applied. Responses are now included in all dashboards.
            </p>
          </div>
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={closeToast}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Surveys Page
// ─────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'builder', label: 'Survey Builder' },
  { id: 'responses', label: 'Responses' },
  { id: 'admin-console', label: 'Admin Console' },
]

export default function Surveys() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-6 md:p-8 space-y-6">
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'builder' && <BuilderTab />}
      {activeTab === 'responses' && <ResponsesTab />}
      {activeTab === 'admin-console' && <AdminConsoleTab />}
    </div>
  )
}
