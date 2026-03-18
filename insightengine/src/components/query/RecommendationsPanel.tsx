'use client'

import type { PrebuiltDashboard } from '@/types/query'

const CATEGORY_COLORS: Record<string, string> = {
  overview:     'text-blue-400 bg-blue-500/10 border-blue-500/20',
  breakdown:    'text-violet-400 bg-violet-500/10 border-violet-500/20',
  distribution: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  trend:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  comparison:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

interface RecommendationsPanelProps {
  followUpQuestions: string[]
  relatedSearches: string[]
  prebuiltDashboards: PrebuiltDashboard[]
  onQuestionClick: (question: string) => void
  disabled?: boolean
}

export function RecommendationsPanel({
  followUpQuestions,
  relatedSearches,
  prebuiltDashboards,
  onQuestionClick,
  disabled = false,
}: RecommendationsPanelProps) {
  function ChipButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={[
          'px-3 py-2 text-xs rounded-full border transition-all text-left',
          disabled
            ? 'text-white/20 border-white/[0.04] cursor-wait opacity-50'
            : 'text-white/50 border-white/[0.07] cursor-pointer hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5',
        ].join(' ')}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="space-y-5 pt-1">

      {/* ── Follow-up questions ── */}
      {followUpQuestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Dig Deeper</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {followUpQuestions.map((q, i) => (
              <ChipButton key={i} label={q} onClick={() => !disabled && onQuestionClick(q)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Related searches ── */}
      {relatedSearches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Explore Different Angles</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedSearches.map((q, i) => (
              <ChipButton key={i} label={q} onClick={() => !disabled && onQuestionClick(q)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Prebuilt dashboards ── */}
      {prebuiltDashboards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Quick Dashboards</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {prebuiltDashboards.map((db, i) => {
              const colorClass = CATEGORY_COLORS[db.category] ?? CATEGORY_COLORS.overview
              return (
                <button
                  key={i}
                  onClick={() => !disabled && onQuestionClick(db.question)}
                  disabled={disabled}
                  className={[
                    'group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                    disabled
                      ? 'opacity-50 cursor-wait border-white/[0.05] bg-white/[0.02]'
                      : 'cursor-pointer hover:bg-white/[0.04] border-white/[0.06] hover:border-white/[0.12]',
                  ].join(' ')}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base border ${colorClass}`}>
                    {db.icon}
                  </div>
                  {/* Text */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/70 group-hover:text-white/90 transition-colors leading-snug">
                      {db.title}
                    </p>
                    <p className="text-[11px] text-white/30 mt-0.5 leading-snug line-clamp-2">
                      {db.description}
                    </p>
                  </div>
                  {/* Arrow */}
                  {!disabled && (
                    <svg className="w-3 h-3 text-white/20 group-hover:text-violet-400 flex-shrink-0 mt-0.5 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
