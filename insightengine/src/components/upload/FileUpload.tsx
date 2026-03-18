'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'
import type { SchemaColumn } from '@/types/query'

export interface UploadResponse {
  datasetId: string
  filename: string
  rowCount: number
  schema: SchemaColumn[]
  hasLowConfidence: boolean
  schemaConfirmed: boolean
}

interface FileUploadProps {
  onUploadComplete: (dataset: UploadResponse) => void
}

type UploadState = 'idle' | 'uploading' | 'error' | 'success'

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0]?.errors[0]?.message
        setErrorMessage(firstError ?? 'File was rejected. Check file type and size.')
        setState('error')
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      setState('uploading')
      setErrorMessage(null)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error ?? `Upload failed (${res.status})`)
        }

        const data: UploadResponse = await res.json()
        setUploadedFilename(file.name)
        setState('success')
        onUploadComplete(data)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.')
        setState('error')
      }
    },
    [onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 25 * 1024 * 1024,
    multiple: false,
    disabled: state === 'uploading',
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={[
          'relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200',
          'bg-[#0f0f1a]',
          isDragActive
            ? 'border-violet-500/60 bg-violet-500/5'
            : state === 'error'
            ? 'border-red-500/40 hover:border-red-500/60'
            : state === 'success'
            ? 'border-emerald-500/40'
            : 'border-white/[0.08] hover:border-violet-500/40',
          state === 'uploading' ? 'opacity-70 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input {...getInputProps()} />

        {/* Upload icon */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={[
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              isDragActive
                ? 'bg-violet-500/20'
                : state === 'success'
                ? 'bg-emerald-500/15'
                : state === 'error'
                ? 'bg-red-500/15'
                : 'bg-white/[0.04]',
            ].join(' ')}
          >
            {state === 'uploading' ? (
              /* Spinner */
              <svg
                className="w-7 h-7 text-violet-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : state === 'success' ? (
              <svg
                className="w-7 h-7 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : state === 'error' ? (
              <svg
                className="w-7 h-7 text-red-400"
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
            ) : (
              <svg
                className="w-7 h-7 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            )}
          </div>

          {/* Status text */}
          {state === 'uploading' && (
            <div>
              <p className="text-sm font-medium text-white/70">Uploading and analyzing…</p>
              <p className="text-xs text-white/30 mt-1">Inferring schema from your data</p>
            </div>
          )}

          {state === 'success' && uploadedFilename && (
            <div>
              <p className="text-sm font-medium text-emerald-400">{uploadedFilename}</p>
              <p className="text-xs text-white/30 mt-1">Upload complete — review schema below</p>
            </div>
          )}

          {state === 'error' && (
            <div>
              <p className="text-sm font-medium text-red-400">
                {errorMessage ?? 'Upload failed'}
              </p>
              <p className="text-xs text-white/40 mt-1">Click or drag to try again</p>
            </div>
          )}

          {(state === 'idle' || (!uploadedFilename && state !== 'error')) && state !== 'uploading' && (
            <div>
              <p className="text-sm font-medium text-white/60">
                {isDragActive
                  ? 'Drop your file here'
                  : 'Drag & drop your CSV or Excel file'}
              </p>
              <p className="text-xs text-white/30 mt-1">
                or <span className="text-violet-400 underline underline-offset-2">browse to select</span>
              </p>
              <p className="text-xs text-white/20 mt-2">
                .csv, .xlsx, .xls — up to 25 MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File retention notice */}
      <p className="text-xs text-white/30 mt-3 text-center">
        Files are automatically deleted after 30 days
      </p>
    </div>
  )
}
