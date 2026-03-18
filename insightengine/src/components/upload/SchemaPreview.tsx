'use client'

import { useState } from 'react'
import type { SchemaColumn } from '@/types/query'

interface SchemaPreviewProps {
  datasetId: string
  schema: SchemaColumn[]
  hasLowConfidence: boolean
  onSchemaConfirmed: (confirmedSchema: SchemaColumn[]) => void
}

const TYPE_OPTIONS = ['string', 'number', 'date', 'boolean'] as const
type InferredType = (typeof TYPE_OPTIONS)[number]

function ConfidenceBadge({ level }: { level: SchemaColumn['confidence'] }) {
  if (level === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
        HIGH
      </span>
    )
  }
  if (level === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
        MEDIUM
      </span>
    )
  }
  // LOW
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
      {/* Warning icon */}
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      LOW
    </span>
  )
}

function truncate(value: string, maxLen = 24): string {
  return value.length > maxLen ? value.slice(0, maxLen) + '…' : value
}

export default function SchemaPreview({
  datasetId,
  schema,
  hasLowConfidence,
  onSchemaConfirmed,
}: SchemaPreviewProps) {
  // Local mutable copy of schema so user overrides are reflected
  const [columns, setColumns] = useState<SchemaColumn[]>(schema)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  function handleTypeChange(colIndex: number, newType: InferredType) {
    setColumns(prev =>
      prev.map((col, idx) =>
        idx === colIndex ? { ...col, inferredType: newType } : col
      )
    )
  }

  async function handleConfirm() {
    setIsConfirming(true)
    setConfirmError(null)

    try {
      const res = await fetch(`/api/datasets/${datasetId}/confirm-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: columns }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Confirmation failed (${res.status})`)
      }

      onSchemaConfirmed(columns)
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Confirmation failed. Please try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="w-full bg-[#07070f] rounded-2xl border border-white/[0.06] overflow-hidden">

      {/* Low confidence warning banner */}
      {hasLowConfidence && (
        <div className="flex items-start gap-3 px-5 py-3.5 bg-amber-500/5 border-b border-amber-500/20">
          <svg
            className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Some columns have low confidence type detection. Please review and confirm before querying.
          </p>
        </div>
      )}

      {/* Table header */}
      <div className="grid grid-cols-[1fr_140px_100px_1fr] gap-4 px-5 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Column</span>
        <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Type</span>
        <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Confidence</span>
        <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Sample Values</span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-white/[0.04]">
        {columns.map((col, idx) => (
          <div
            key={col.name}
            className="grid grid-cols-[1fr_140px_100px_1fr] gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
          >
            {/* Column name + null rate */}
            <div className="min-w-0">
              <span className="text-sm text-white/90 font-medium truncate block">{col.name}</span>
              {col.nullRate > 0 && (
                <span className="text-xs text-white/25 mt-0.5 block">
                  {Math.round(col.nullRate * 100)}% null
                </span>
              )}
            </div>

            {/* Type — dropdown for LOW confidence, static label otherwise */}
            <div>
              {col.confidence === 'LOW' ? (
                <select
                  value={col.inferredType}
                  onChange={e => handleTypeChange(idx, e.target.value as InferredType)}
                  className="w-full bg-[#0f0f1a] border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs text-white/80 outline-none focus:border-violet-500/50 transition-colors cursor-pointer appearance-none"
                  aria-label={`Type for column ${col.name}`}
                >
                  {TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs text-white/60 font-mono">
                  {col.inferredType}
                </span>
              )}
            </div>

            {/* Confidence badge */}
            <div>
              <ConfidenceBadge level={col.confidence} />
            </div>

            {/* Sample values */}
            <div className="min-w-0">
              {col.sampleValues.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {col.sampleValues.slice(0, 4).map((val, i) => (
                    <span
                      key={i}
                      className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono truncate max-w-[120px]"
                      title={val}
                    >
                      {truncate(val)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-white/20 italic">no samples</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="text-xs text-white/25">
          {columns.length} column{columns.length !== 1 ? 's' : ''} detected
        </div>

        <div className="flex items-center gap-3">
          {confirmError && (
            <span className="text-xs text-red-400">{confirmError}</span>
          )}
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="relative group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Gradient border glow */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity" aria-hidden />
            <span className="relative flex items-center gap-2 text-white">
              {isConfirming ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirming…
                </>
              ) : hasLowConfidence ? (
                'Confirm Schema'
              ) : (
                'Looks good, start querying'
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
