import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Radio, Lightbulb, FileDown, TrendingUp, Zap } from 'lucide-react'
import { useSurveyData } from '../hooks/useSurveyData'
import { calcENPS, calcOverallScore } from '../utils/scoreCalculator'
import { PILLARS } from '../data/pillars'
import { TREND_DATA } from '../data/trends'
import { EXTERNAL_PLATFORMS } from '../data/externalPlatforms'
import KPICard from '../components/ui/KPICard'
import AlertBanner from '../components/ui/AlertBanner'
import Sparkline from '../components/charts/Sparkline'
import Toast from '../components/ui/Toast'

export default function Dashboard() {
  const navigate = useNavigate()
  const surveyData = useSurveyData()
  const [toast, setToast] = useState({ visible: false, message: '' })

  // Compute metrics
  const responses = surveyData.all
  const enps = calcENPS(responses.map(r => r.enps))
  const pillarAvgSum = PILLARS.reduce((sum, p) => sum + p.internalScore, 0)
  const pillarAvg = pillarAvgSum / PILLARS.length
  const overallScore = calcOverallScore(pillarAvg)
  const externalSignals = EXTERNAL_PLATFORMS.reduce((sum, p) => sum + p.reviewCount, 0)

  // Sparkline data: overall brand score trend
  const sparklineData = TREND_DATA.map(t => t.overallScore)

  // Critical alerts
  const criticalAlerts = PILLARS
    .filter(p => p.status === 'critical')
    .map(p => `${p.label}: ${p.internalScore}/5 — Immediate attention required`)

  // Recent responses: last 5
  const recentResponses = [...responses].reverse().slice(0, 5)

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/survey/q1-2026`)
    setToast({ visible: true, message: 'Survey link copied!' })
  }

  function eNPSLabel(score: number) {
    return score >= 0 ? `+${score}` : `${score}`
  }

  function enpsColor(score: number) {
    if (score >= 9) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (score >= 7) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Alert Banner */}
      <AlertBanner alerts={criticalAlerts} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Employer Brand Score"
          value={`${overallScore}/100`}
          subtext="Avg across 10 EVP pillars"
          accentColor="rose"
          icon={<Sparkline data={sparklineData} color="#e11d48" height={36} />}
        />
        <KPICard
          label="eNPS"
          value={eNPSLabel(enps)}
          subtext="Employee Net Promoter Score"
          accentColor="sky"
        />
        <KPICard
          label="Survey Responses"
          value={responses.length}
          subtext="Total collected responses"
          accentColor="emerald"
        />
        <KPICard
          label="External Signals"
          value={externalSignals.toLocaleString()}
          subtext="Reviews across all platforms"
          accentColor="amber"
        />
      </div>

      {/* Hub Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Internal Surveys */}
        <div
          className="bg-[var(--card)] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)]"
          onClick={() => navigate('/surveys')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <ClipboardList size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">Internal Surveys</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">287 responses • 73% completion</p>
        </div>

        {/* External Listening */}
        <div
          className="bg-[var(--card)] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)]"
          onClick={() => navigate('/listening')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <Radio size={18} className="text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">External Listening</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">3,279 signals • 3.9/5.0 composite</p>
        </div>

        {/* EVP Insights */}
        <div
          className="bg-[var(--card)] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)]"
          onClick={() => navigate('/insights')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Lightbulb size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">EVP Insights</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">10 pillars • 74/100 brand score</p>
        </div>

        {/* Export Reports */}
        <div
          className="bg-[var(--card)] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-[var(--border)]"
          onClick={() => navigate('/reports')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <FileDown size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">Export Reports</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">PDF & PPTX ready</p>
        </div>

        {/* Trend Snapshot */}
        <div className="bg-[var(--card)] rounded-xl shadow-sm p-6 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <TrendingUp size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text)]">Brand Score Trend</h3>
              <p className="text-xs text-[var(--muted)]">Q1 2025 → Q1 2026</p>
            </div>
          </div>
          <div className="mt-3">
            <Sparkline data={sparklineData} color="#e11d48" height={60} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--card)] rounded-xl shadow-sm p-6 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={copyLink}
              className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-[var(--text)]"
            >
              📋 Copy Survey Link
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full text-left text-sm px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-[var(--text)]"
            >
              ⬇️ Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6 border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold text-[var(--text)]">Recent Responses</h2>
          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-[var(--muted)] px-2 py-0.5 rounded-full font-medium">
            {responses.length}
          </span>
        </div>
        <div>
          {recentResponses.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
            >
              <span className="text-sm text-[var(--muted)]">
                {r.role} • {r.department} • {r.location}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enpsColor(r.enps)}`}>
                {r.enps}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type="success"
        onClose={() => setToast({ visible: false, message: '' })}
      />
    </div>
  )
}
