'use client'

import { useState } from 'react'

interface InsightPanelProps {
  insight: string
  sql?: string
}

export function InsightPanel({ insight, sql }: InsightPanelProps) {
  const [sqlExpanded, setSqlExpanded] = useState(false)

  return (
    <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 mt-4">
      {/* Insight row */}
      <div className="flex items-start gap-3">
        {/* Sparkle icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-4 h-4 text-violet-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>

        <p className="text-white/70 text-sm leading-relaxed flex-1">{insight}</p>
      </div>

      {/* Collapsible SQL section */}
      {sql && (
        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <button
            onClick={() => setSqlExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/40 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-150 ${sqlExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {sqlExpanded ? 'Hide SQL' : 'Show SQL'}
          </button>

          {sqlExpanded && (
            <pre className="mt-2 text-xs text-white/30 font-mono bg-black/20 rounded-lg px-3 py-2.5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
              {sql}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
