'use client'

import { useEffect, useRef, useState } from 'react'
import type { EnrichmentResult, QueryResult, SchemaColumn } from '@/types/query'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import { InsightPanel } from '@/components/query/InsightPanel'
import { FollowUpChips } from '@/components/query/FollowUpChips'

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

  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear loading interval on unmount
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

    // Cycle through loading labels every 3 s
    loadingTimerRef.current = setInterval(() => {
      setLoadingLabelIdx(prev => Math.min(prev + 1, LOADING_LABELS.length - 1))
    }, 3000)

    try {
      const body: { question: string; previousContext?: string } = {
        question: trimmed,
      }

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

      setResult(data as QueryResponse)
      setError(null)
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

  function handleFollowUp(followUpQuestion: string) {
    if (!result) return

    // Carry context from the current result
    setPreviousContext({
      question,
      summary: result.enrichment.insight,
    })

    setQuestion(followUpQuestion)
    submitQuestion(followUpQuestion)
  }

  return (
    <div className="w-full space-y-4">

      {/* Dataset info badge */}
      <div className="flex items-center gap-2 text-xs text-white/30">
        <svg className="w-3.5 h-3.5 text-violet-500/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
        <span>
          Querying:{' '}
          <span className="text-white/50 font-medium">{datasetName}</span>
          {' '}
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
              ref={inputRef}
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
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

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          <ChartRenderer
            vizType={result.enrichment.vizType}
            data={result.result.rows}
            columns={result.result.columns}
            chartConfig={result.enrichment.chartConfig}
          />
          <InsightPanel
            insight={result.enrichment.insight}
            sql={result.sql}
          />
          <FollowUpChips
            questions={result.enrichment.followUpQuestions}
            onQuestionClick={handleFollowUp}
            disabled={loading}
          />
        </div>
      )}
    </div>
  )
}
