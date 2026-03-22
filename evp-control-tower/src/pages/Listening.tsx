import { useState } from 'react'
import ScoreGauge from '../components/ui/ScoreGauge'
import PlatformCard from '../components/ui/PlatformCard'
import ReviewQuote from '../components/ui/ReviewQuote'
import LineChart from '../components/charts/LineChart'
import { EXTERNAL_PLATFORMS } from '../data/externalPlatforms'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const sentimentTrend = [
  { month: 'Oct 2025', positive: 70, neutral: 16, negative: 14 },
  { month: 'Nov 2025', positive: 71, neutral: 16, negative: 13 },
  { month: 'Dec 2025', positive: 72, neutral: 15, negative: 13 },
  { month: 'Jan 2026', positive: 73, neutral: 15, negative: 12 },
  { month: 'Feb 2026', positive: 74, neutral: 14, negative: 12 },
  { month: 'Mar 2026', positive: 74, neutral: 14, negative: 12 },
]

const sentimentLines = [
  { key: 'positive', color: '#10b981', label: 'Positive' },
  { key: 'neutral', color: '#94a3b8', label: 'Neutral' },
  { key: 'negative', color: '#e11d48', label: 'Negative' },
]

const TOP_THEMES = [
  'Work-life balance concerns',
  'Strong mission',
  'Low compensation',
  'Great colleagues',
  'Career growth opportunities',
  'Burnout risk',
  'Supportive leadership',
  'Clinical excellence',
  'Poor shift rostering',
  'Good training programs',
]

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function Listening() {
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  // Collect reviews from selected platforms
  const selectedPlatforms = platformFilter === 'all'
    ? EXTERNAL_PLATFORMS
    : EXTERNAL_PLATFORMS.filter(p => p.id === platformFilter)

  const allReviews = selectedPlatforms.flatMap(p =>
    p.reviews.map(r => ({ ...r, platformName: p.name }))
  )

  // Show at most 4 reviews — mix positive and negative
  const positiveReviews = allReviews.filter(r => r.sentiment === 'positive').slice(0, 2)
  const negativeReviews = allReviews.filter(r => r.sentiment === 'negative').slice(0, 2)
  const featuredReviews = [...positiveReviews, ...negativeReviews]

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-[var(--text)]">External Listening</h1>
        <span className="bg-slate-100 dark:bg-slate-800 text-[var(--muted)] text-xs font-semibold px-3 py-1 rounded-full">
          3,279 total signals
        </span>
      </div>

      {/* ── Composite Score Hero ── */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide mb-1">Composite External Score</p>
            <p className="text-5xl font-bold text-[var(--text)]">3.9</p>
            <p className="text-sm text-[var(--muted)] mt-1">/ 5.0</p>
            <p className="text-xs text-[var(--muted)] mt-2">Across 6 platforms</p>
          </div>
          <div className="h-px sm:h-20 sm:w-px bg-[var(--border)] w-full sm:w-auto" />
          <div className="flex flex-col items-center gap-1">
            <ScoreGauge score={78} max={100} label="Sentiment" size={120} />
            <p className="text-xs text-[var(--muted)]">Overall Sentiment Score</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center sm:ml-4">
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">74%</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Positive</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-500">15%</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Neutral</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">11%</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">Negative</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Platform Cards ── */}
      <div>
        <p className="text-sm font-semibold text-[var(--text)] mb-4">Platform Breakdown</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXTERNAL_PLATFORMS.map(platform => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>

      {/* ── Sentiment Trend ── */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <p className="text-sm font-semibold text-[var(--text)] mb-1">Sentiment Trend</p>
        <p className="text-xs text-[var(--muted)] mb-4">6-month rolling sentiment across all external platforms</p>
        <LineChart data={sentimentTrend} lines={sentimentLines} height={260} />
      </div>

      {/* ── Top Themes ── */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <p className="text-sm font-semibold text-[var(--text)] mb-3">Top Themes</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TOP_THEMES.map(theme => (
            <span
              key={theme}
              className="bg-slate-100 dark:bg-slate-800 text-[var(--text)] rounded-full px-3 py-1 text-sm whitespace-nowrap flex-shrink-0"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* ── Featured Reviews ── */}
      <div className="bg-[var(--card)] rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm font-semibold text-[var(--text)]">What people are saying</p>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Platforms</option>
            {EXTERNAL_PLATFORMS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {featuredReviews.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">No reviews available for this platform.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredReviews.map((review, i) => (
              <ReviewQuote
                key={i}
                text={review.text}
                source={review.platformName}
                sentiment={review.sentiment}
                date={review.date}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
