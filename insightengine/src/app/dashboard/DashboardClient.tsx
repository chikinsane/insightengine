'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { SchemaColumn } from '@/types/query'
import FileUpload, { type UploadResponse } from '@/components/upload/FileUpload'
import SchemaPreview from '@/components/upload/SchemaPreview'
import QueryInterface from '@/components/query/QueryInterface'
import { HistoryPanel } from '@/components/HistoryPanel'

const BrainCanvas = dynamic(() => import('@/components/BrainCanvas'), { ssr: false })

// ── Types ────────────────────────────────────────────────────────────────────

type DashboardView = 'home' | 'uploading' | 'schema-preview' | 'querying'

interface ActiveDataset {
  datasetId: string
  filename: string
  rowCount: number
  schema: SchemaColumn[]
  hasLowConfidence: boolean
}

interface StoredDataset {
  id: string
  name: string
  rowCount: number | null
  schema: { confirmed?: boolean; columns?: SchemaColumn[] } | null
  createdAt: string
}

// ── Example queries shown on the home screen ─────────────────────────────────

const EXAMPLE_QUERIES = [
  'Show revenue trend by month',
  'Top 10 customers by spend',
  'Compare Q3 vs Q4 sales',
  'Which region grew fastest?',
]

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardClient({ userId }: { userId: string }) {
  const [view, setView] = useState<DashboardView>('home')
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null)
  const [confirmedSchema, setConfirmedSchema] = useState<SchemaColumn[] | null>(null)
  const [existingDatasets, setExistingDatasets] = useState<StoredDataset[]>([])
  const [loadingDatasets, setLoadingDatasets] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Fetch existing datasets once on mount
  useEffect(() => {
    let cancelled = false
    setLoadingDatasets(true)

    fetch('/api/datasets')
      .then(r => r.ok ? r.json() : Promise.resolve([]))
      .then((data: StoredDataset[]) => {
        if (!cancelled) setExistingDatasets(data)
      })
      .catch(() => {
        // silently ignore — user may not have datasets yet
      })
      .finally(() => {
        if (!cancelled) setLoadingDatasets(false)
      })

    return () => { cancelled = true }
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleConnectData() {
    setView('uploading')
  }

  function handleUploadComplete(dataset: UploadResponse) {
    setActiveDataset({
      datasetId: dataset.datasetId,
      filename: dataset.filename,
      rowCount: dataset.rowCount,
      schema: dataset.schema,
      hasLowConfidence: dataset.hasLowConfidence,
    })
    setView('schema-preview')
  }

  function handleSchemaConfirmed(confirmedCols: SchemaColumn[]) {
    setConfirmedSchema(confirmedCols)
    setView('querying')
  }

  function handleSelectExistingDataset(ds: StoredDataset) {
    const cols: SchemaColumn[] = ds.schema?.columns ?? []
    setActiveDataset({
      datasetId: ds.id,
      filename: ds.name,
      rowCount: ds.rowCount ?? 0,
      schema: cols,
      hasLowConfidence: false,
    })
    setConfirmedSchema(cols)
    setView('querying')
  }

  function handleBackToHome() {
    setView('home')
    setActiveDataset(null)
    setConfirmedSchema(null)
  }

  function handleDeleteDataset(id: string) {
    // Optimistic removal
    const prev = existingDatasets
    setExistingDatasets(ds => ds.filter(d => d.id !== id))
    fetch(`/api/datasets/${id}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) setExistingDatasets(prev) })
      .catch(() => setExistingDatasets(prev))
  }

  function handleHistorySelect(datasetId: string, datasetName: string, question: string) {
    // Find the stored dataset to get its schema
    const ds = existingDatasets.find(d => d.id === datasetId)
    if (!ds) return
    const cols: SchemaColumn[] = ds.schema?.columns ?? []
    setActiveDataset({
      datasetId: ds.id,
      filename: ds.name,
      rowCount: ds.rowCount ?? 0,
      schema: cols,
      hasLowConfidence: false,
    })
    setConfirmedSchema(cols)
    setHistoryOpen(false)
    setView('querying')
    // Pre-fill the question — QueryInterface picks it up via key trick
    // We pass it through a URL-safe state mechanism
    sessionStorage.setItem('prefill_question', question)
  }

  // ── Confirmed datasets list (for home view) ───────────────────────────────

  const confirmedDatasets = existingDatasets.filter(
    ds => ds.schema?.confirmed === true
  )

  const dataSourcesCount = existingDatasets.length
  const queriesRunCount = 0 // placeholder — would need a queries count endpoint

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07070f] text-white overflow-hidden">

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={handleBackToHome}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white/90">InsightEngine</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/40">
          <button className="hover:text-white/80 transition-colors" onClick={handleBackToHome}>Dashboards</button>
          <button className="hover:text-white/80 transition-colors" onClick={handleConnectData}>Sources</button>
          <button className="hover:text-white/80 transition-colors" onClick={() => setHistoryOpen(true)}>History</button>
        </nav>

        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button
              onClick={handleBackToHome}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/[0.08] hover:border-violet-500/40 hover:text-violet-300 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
          )}
          <button
            onClick={() => setHistoryOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/[0.08] hover:border-violet-500/40 hover:text-violet-300 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
            History
          </button>
          <button
            onClick={handleConnectData}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/[0.08] hover:border-violet-500/40 hover:text-violet-300 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Connect data
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/30 flex items-center justify-center text-xs font-medium text-violet-300">
            {userId.slice(-2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative">

        {/* ── HOME VIEW ── */}
        {view === 'home' && (
          <div className="relative flex items-center min-h-[calc(100vh-65px)]">

            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-violet-700/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-700/10 rounded-full blur-[80px]" />
            </div>

            {/* Left: content */}
            <div className="relative z-10 flex-1 px-8 sm:px-12 lg:px-20 py-12">
              <div className="max-w-[520px]">

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Gen AI · Data Intelligence
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-4">
                  Ask anything
                  <br />
                  <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    about your data
                  </span>
                </h1>

                <p className="text-white/40 text-base leading-relaxed mb-8">
                  Upload a spreadsheet or connect a database. Type a question in plain English — get instant charts, trends, and AI-powered insights.
                </p>

                {/* Query input (placeholder — navigates to upload if no datasets) */}
                <div className="relative group mb-4">
                  <div className="absolute -inset-px bg-gradient-to-r from-violet-600/50 to-indigo-600/50 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300" />
                  <div className="relative flex items-center bg-[#0f0f1a] border border-white/[0.08] group-focus-within:border-violet-500/40 rounded-2xl px-4 py-3.5 gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="What were my top 5 products last quarter?"
                      className="flex-1 bg-transparent text-white/90 placeholder-white/20 text-sm outline-none cursor-pointer"
                      onFocus={handleConnectData}
                      readOnly
                    />
                    <button
                      onClick={handleConnectData}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-900/30"
                    >
                      Get started
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Example queries */}
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_QUERIES.map(q => (
                    <button
                      key={q}
                      onClick={handleConnectData}
                      className="px-3 py-1.5 text-xs text-white/30 border border-white/[0.07] rounded-full hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-white/[0.06]">
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                      {loadingDatasets ? '—' : dataSourcesCount}
                    </div>
                    <div className="text-xs text-white/25 mt-0.5 tracking-wide">Data Sources</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                      {queriesRunCount}
                    </div>
                    <div className="text-xs text-white/25 mt-0.5 tracking-wide">Queries Run</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">0</div>
                    <div className="text-xs text-white/25 mt-0.5 tracking-wide">Dashboards</div>
                  </div>
                </div>

                {/* Existing datasets */}
                {confirmedDatasets.length > 0 && (
                  <div className="mt-8">
                    <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Your datasets</p>
                    <div className="space-y-2">
                      {confirmedDatasets.map(ds => (
                        <div
                          key={ds.id}
                          className="group flex items-center gap-2"
                        >
                          {/* Main card — click to open dataset */}
                          <button
                            onClick={() => handleSelectExistingDataset(ds)}
                            className="flex-1 flex items-center gap-3 px-4 py-3 bg-[#0f0f1a] border border-white/[0.06] rounded-xl hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left min-w-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-violet-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/80 font-medium truncate group-hover:text-white transition-colors">{ds.name}</p>
                              <p className="text-xs text-white/25 mt-0.5">
                                {ds.schema?.columns?.length ?? 0} columns
                                {ds.rowCount != null ? ` · ${ds.rowCount.toLocaleString()} rows` : ''}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>

                          {/* Delete button — visible on hover */}
                          <button
                            onClick={() => handleDeleteDataset(ds.id)}
                            title="Remove this dataset"
                            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white/0 group-hover:text-white/25 hover:!text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right: 3D Brain */}
            <div className="absolute right-0 top-0 bottom-0 w-[52%] pointer-events-none select-none">
              <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#07070f] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#07070f] to-transparent z-10" />
              <BrainCanvas />
            </div>

          </div>
        )}

        {/* ── UPLOADING VIEW ── */}
        {view === 'uploading' && (
          <div className="flex items-start justify-center min-h-[calc(100vh-65px)] px-8 sm:px-12 py-16">
            <div className="w-full max-w-xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white/90 mb-2">
                  Upload your data
                </h2>
                <p className="text-sm text-white/40">
                  Upload a CSV or Excel file to get started. We&apos;ll infer column types automatically.
                </p>
              </div>
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        )}

        {/* ── SCHEMA PREVIEW VIEW ── */}
        {view === 'schema-preview' && activeDataset && (
          <div className="flex items-start justify-center min-h-[calc(100vh-65px)] px-8 sm:px-12 py-16">
            <div className="w-full max-w-3xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white/90 mb-2">
                  Confirm schema
                </h2>
                <p className="text-sm text-white/40">
                  Review the detected column types for{' '}
                  <span className="text-white/70 font-medium">{activeDataset.filename}</span>.
                  Adjust any LOW-confidence types before querying.
                </p>
              </div>
              <SchemaPreview
                datasetId={activeDataset.datasetId}
                schema={activeDataset.schema}
                hasLowConfidence={activeDataset.hasLowConfidence}
                onSchemaConfirmed={handleSchemaConfirmed}
              />
            </div>
          </div>
        )}

        {/* ── QUERYING VIEW ── */}
        {view === 'querying' && activeDataset && confirmedSchema && (
          <div className="flex items-start justify-center min-h-[calc(100vh-65px)] px-8 sm:px-12 py-12">
            <div className="w-full max-w-3xl">
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white/90 mb-1">
                    Query your data
                  </h2>
                  <p className="text-sm text-white/40">
                    Ask anything about{' '}
                    <span className="text-white/60 font-medium">{activeDataset.filename}</span>{' '}
                    in plain English.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConnectData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/[0.07] hover:border-violet-500/30 hover:text-violet-300 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New file
                  </button>
                </div>
              </div>

              <QueryInterface
                datasetId={activeDataset.datasetId}
                datasetName={activeDataset.filename}
                schema={confirmedSchema}
                rowCount={activeDataset.rowCount}
              />
            </div>
          </div>
        )}

      </main>

      {/* ── History slide-in panel ── */}
      {/* Backdrop */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setHistoryOpen(false)}
        />
      )}
      {/* Drawer */}
      <div className={[
        'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#0a0a14] border-l border-white/[0.08] shadow-2xl',
        'transform transition-transform duration-300 ease-in-out',
        historyOpen ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}>
        <HistoryPanel
          onSelectQuery={handleHistorySelect}
          onClose={() => setHistoryOpen(false)}
        />
      </div>

    </div>
  )
}
