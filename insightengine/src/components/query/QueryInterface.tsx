'use client'

import { useEffect, useRef, useState } from 'react'
import type { EnrichmentResult, PrebuiltDashboard, QueryResult, SchemaColumn } from '@/types/query'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { InsightPanel } from '@/components/query/InsightPanel'
import { RecommendationsPanel } from '@/components/query/RecommendationsPanel'

interface QueryInterfaceProps {
  datasetId: string
  datasetName: string
  schema: SchemaColumn[]
  rowCount?: number
}

interface QueryResponse {
  queryId: string
  sql: string
  explanation: string
  result: QueryResult
  enrichment: EnrichmentResult
}

type LoadingLabel =
  | 'Understanding your question...'
  | 'Querying data...'
  | 'Building visualization...'

const LOADING_LABELS: LoadingLabel[] = [
  'Understanding your question...',
  'Querying data...',
  'Building visualization...',
]

/** Derive schema-based default dashboards without an API call */
function deriveLocalTemplates(schema: SchemaColumn[]): PrebuiltDashboard[] {
  const numericCols = schema.filter((c) => c.inferredType === 'number').map((c) => c.name)
  const textCols = schema.filter((c) => c.inferredType === 'string').map((c) => c.name)

  const templates: PrebuiltDashboard[] = []

  // Overview: total count
  templates.push({
    title: 'Record Count',
    description: 'Total number of records in the dataset',
    question: 'How many total records are in this dataset?',
    category: 'overview',
    icon: '🔢',
  })

  // Breakdown by first text column
  if (textCols[0]) {
    templates.push({
      title: `By ${textCols[0]}`,
      description: `Count of records grouped by ${textCols[0]}`,
      question: `How many records are there for each ${textCols[0]}?`,
      category: 'breakdown',
      icon: '📂',
    })
  }

  // Avg + sum of first numeric column
  if (numericCols[0] && textCols[0]) {
    templates.push({
      title: `${numericCols[0]} Summary`,
      description: `Average and total ${numericCols[0]} by ${textCols[0]}`,
      question: `What is the average and total ${numericCols[0]} for each ${textCols[0]}?`,
      category: 'breakdown',
      icon: '💰',
    })
  }

  // Top 10 by first numeric
  if (numericCols[0]) {
    templates.push({
      title: 'Top 10',
      description: `Top 10 records by ${numericCols[0]}`,
      question: `Show the top 10 records with the highest ${numericCols[0]}`,
      category: 'distribution',
      icon: '🏆',
    })
  }

  // Second text column breakdown
  if (textCols[1] && numericCols[0]) {
    templates.push({
      title: `${textCols[1]} Analysis`,
      description: `Average ${numericCols[0]} broken down by ${textCols[1]}`,
      question: `What is the average ${numericCols[0]} for each ${textCols[1]}?`,
      category: 'comparison',
      icon: '⚖️',
    })
  } else if (textCols[1]) {
    templates.push({
      title: `${textCols[1]} Mix`,
      description: `Distribution of records across ${textCols[1]}`,
      question: `What is the distribution of records by ${textCols[1]}?`,
      category: 'distribution',
      icon: '📊',
    })
  }

  // Pad to 5 if needed
  while (templates.length < 5) {
    templates.push({
      title: 'Full Dataset',
      description: 'View all columns and rows in the dataset',
      question: 'Show me all records with all columns',
      category: 'overview',
      icon: '📋',
    })
  }

  return templates.slice(0, 5)
}

export default function QueryInterface({
  datasetId,
  datasetName,
  schema,
  rowCount,
}: QueryInterfaceProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingLabelIdx, setLoadingLabelIdx] = useState(0)
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previousContext, setPreviousContext] = useState<{
    question: string
    summary: string
  } | null>(null)
  // Cache dashboard templates from first AI response — don't regenerate on every query
  const [dashboardTemplates, setDashboardTemplates] = useState<PrebuiltDashboard[]>(
    () => deriveLocalTemplates(schema)
  )

  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
    }
  }, [])

  async function submitQuestion(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setLoadingLabelIdx(0)

    loadingTimerRef.current = setInterval(() => {
      setLoadingLabelIdx((prev) => Math.min(prev + 1, LOADING_LABELS.length - 1))
    }, 3000)

    try {
      const body: { question: string; previousContext?: string } = { question: trimmed }
      if (previousContext) {
        body.previousContext = `${previousContext.question}: ${previousContext.summary}`
      }

      const res = await fetch(`/api/datasets/${datasetId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        const errData = data as { error?: string; detail?: string }
        const msg = errData.error ?? `Query failed (${res.status})`
        const detail = errData.detail ? ` — ${errData.detail}` : ''
        throw new Error(`${msg}${detail}`)
      }

      const qr = data as QueryResponse
      setResult(qr)
      setError(null)

      // Update dashboard templates from AI response (richer than local defaults)
      if (qr.enrichment.prebuiltDashboards?.length) {
        setDashboardTemplates(qr.enrichment.prebuiltDashboards)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed. Please try again.')
      setResult(null)
    } finally {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
      setLoading(false)
      setLoadingLabelIdx(0)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitQuestion(question)
  }

  function handleRecommendationClick(q: string) {
    if (!result) return
    setPreviousContext({ question, summary: result.enrichment.insight })
    setQuestion(q)
    submitQuestion(q)
  }

  function handleTemplateClick(q: string) {
    setQuestion(q)
    submitQuestion(q)
  }

  return (
    <div className="w-full space-y-4">

      {/* Dataset info badge */}
      <div className="flex items-center gap-2 text-xs text-white/30">
        <svg className="w-3.5 h-3.5 text-violet-500/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
        <span>
          Querying: <span className="text-white/50 font-medium">{datasetName}</span>{' '}
          <span className="text-white/20">
            ({schema.length} columns{rowCount != null ? `, ${rowCount.toLocaleString()} rows` : ''})
          </span>
        </span>
      </div>

      {/* Query input */}
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-violet-600/50 to-indigo-600/50 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
          <div className="relative flex items-center bg-[#0f0f1a] border border-white/[0.08] group-focus-within:border-violet-500/40 rounded-2xl px-4 py-3.5 gap-3 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your data..."
              className="flex-1 bg-transparent text-white/90 placeholder-white/20 text-sm outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Thinking
                </>
              ) : (
                <>
                  Ask AI
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0f0f1a] border border-white/[0.06] rounded-xl">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-sm text-white/40 transition-all duration-500">
            {LOADING_LABELS[loadingLabelIdx]}
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-red-500/5 border border-red-500/20 rounded-xl">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-red-300/80">{error}</p>
        </div>
      )}

      {/* ── Results area ── */}
      {result && !loading && (
        <div className="space-y-4">
          <ChartRenderer
            vizType={result.enrichment.vizType}
            data={result.result.rows}
            columns={result.result.columns}
            chartConfig={result.enrichment.chartConfig}
          />
          <InsightPanel insight={result.enrichment.insight} sql={result.sql} />
          <RecommendationsPanel
            followUpQuestions={result.enrichment.followUpQuestions}
            relatedSearches={result.enrichment.relatedSearches ?? []}
            prebuiltDashboards={dashboardTemplates}
            onQuestionClick={handleRecommendationClick}
            disabled={loading}
          />
        </div>
      )}

      {/* ── Initial state: show quick dashboard templates before first query ── */}
      {!result && !loading && !error && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Quick Start Dashboards</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {dashboardTemplates.map((db, i) => {
              const colorMap: Record<string, string> = {
                overview: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                breakdown: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                distribution: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                trend: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                comparison: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
              }
              const colorClass = colorMap[db.category] ?? colorMap.overview
              return (
                <button
                  key={i}
                  onClick={() => handleTemplateClick(db.question)}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] text-left transition-all cursor-pointer"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base border ${colorClass}`}>
                    {db.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/70 group-hover:text-white/90 transition-colors leading-snug">
                      {db.title}
                    </p>
                    <p className="text-[11px] text-white/30 mt-0.5 leading-snug line-clamp-2">
                      {db.description}
                    </p>
                  </div>
                  <svg className="w-3 h-3 text-white/20 group-hover:text-violet-400 flex-shrink-0 mt-0.5 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
