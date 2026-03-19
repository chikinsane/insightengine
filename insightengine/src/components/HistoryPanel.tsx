'use client'

import { useEffect, useState } from 'react'
import type { VizType } from '@/types/query'

interface HistoryEntry {
  id: string
  naturalLanguage: string
  vizType: string | null
  createdAt: string
  datasetId: string
  datasetName: string | null
  datasetRowCount: number | null
}

interface HistoryPanelProps {
  onSelectQuery: (datasetId: string, datasetName: string, question: string) => void
  onClose: () => void
}

const VIZ_ICONS: Record<VizType | string, string> = {
  bar: '▐▌',
  line: '↗',
  pie: '◕',
  scatter: '⁙',
  table: '⊞',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function HistoryPanel({ onSelectQuery, onClose }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/queries')
      .then(r => r.ok ? r.json() : [])
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? entries.filter(e =>
        e.naturalLanguage.toLowerCase().includes(search.toLowerCase()) ||
        (e.datasetName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : entries

  // Group by dataset
  const grouped = filtered.reduce<Record<string, HistoryEntry[]>>((acc, e) => {
    const key = e.datasetId
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white/90 tracking-tight">Query History</h2>
          <p className="text-xs text-white/30 mt-0.5">{entries.length} queries across all datasets</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.07] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2">
          <svg className="w-3.5 h-3.5 text-white/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search queries..."
            className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-12 text-white/25 text-sm">
            <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading history...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/30 font-medium">
              {search ? 'No matching queries' : 'No queries yet'}
            </p>
            <p className="text-xs text-white/15 mt-1">
              {search ? 'Try a different search term' : 'Run your first query to see it here'}
            </p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([, items]) => {
          const datasetName = items[0].datasetName ?? 'Unknown dataset'
          const rowCount = items[0].datasetRowCount
          return (
            <div key={items[0].datasetId}>
              {/* Dataset label */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-violet-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-white/40 truncate">{datasetName}</span>
                {rowCount != null && (
                  <span className="text-[10px] text-white/20 ml-1">{rowCount.toLocaleString()} rows</span>
                )}
              </div>

              {/* Queries for this dataset */}
              <div className="space-y-1.5 ml-1 pl-5 border-l border-white/[0.05]">
                {items.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => onSelectQuery(entry.datasetId, entry.datasetName ?? 'Dataset', entry.naturalLanguage)}
                    className="w-full group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.07] transition-all text-left"
                  >
                    {/* Viz type badge */}
                    <span className="flex-shrink-0 w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center text-[11px] text-white/35 mt-0.5">
                      {VIZ_ICONS[entry.vizType ?? 'table'] ?? '⊞'}
                    </span>
                    {/* Question text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/70 group-hover:text-white/90 transition-colors leading-snug line-clamp-2">
                        {entry.naturalLanguage}
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">{timeAgo(entry.createdAt)}</p>
                    </div>
                    {/* Re-run arrow */}
                    <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-violet-400 flex-shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
