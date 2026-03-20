import type { SchemaColumn, ConfidenceLevel } from '@/types/query'

const BOOLEAN_VALUES = new Set(['true', 'false', '1', '0', 'yes', 'no'])

/**
 * Detect if a string value has a leading zero (like a ZIP code).
 * Only flags strings that look numeric but start with 0.
 */
function hasLeadingZero(value: string): boolean {
  return /^0\d/.test(value)
}

/**
 * Strip currency symbols and formatting so "$1,234.00" becomes "1234.00"
 */
function stripCurrency(value: string): string {
  return value.replace(/[$€£¥,]/g, '')
}

/**
 * Check if a string is a valid ISO date or common date format.
 */
function isDateLike(value: string): boolean {
  // ISO date: 2024-01-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true
  // DD/MM/YYYY or MM/DD/YYYY: 01/01/2024 or 1/1/2024
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) return true
  // DD-MMM-YYYY: 15-Aug-1990
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(value)) return true
  // Numeric dash: 01-01-2024
  if (/^\d{1,2}-\d{2}-\d{4}$/.test(value)) return true
  return false
}

/**
 * Detect the specific date format in a column's sample values.
 * Returns undefined if values are already ISO (YYYY-MM-DD) or format is unknown.
 */
function detectDateFormat(samples: string[]): string | undefined {
  const nonEmpty = samples.filter(v => v && v.trim() !== '')
  if (nonEmpty.length === 0) return undefined

  // DD/MM/YYYY — check if any day value exceeds 12 (proving it can't be MM/DD)
  const slashPattern = nonEmpty.filter(v => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v))
  if (slashPattern.length > 0) {
    const hasUnambiguousDay = slashPattern.some(v => {
      const parts = v.split('/')
      return parseInt(parts[0], 10) > 12
    })
    // In Indian context, default to DD/MM/YYYY (even when ambiguous)
    return 'DD/MM/YYYY'
  }

  // DD-MMM-YYYY (e.g. 15-Aug-1990)
  if (nonEmpty.some(v => /^\d{1,2}-[A-Za-z]{3}-\d{4}$/i.test(v))) {
    return 'DD-MMM-YYYY'
  }

  // Already ISO
  if (nonEmpty.every(v => /^\d{4}-\d{2}-\d{2}$/.test(v))) return undefined

  return undefined
}

/**
 * Infer the type and confidence of a column based on its non-null values.
 */
export function inferColumnType(
  values: unknown[]
): { type: SchemaColumn['inferredType']; confidence: ConfidenceLevel } {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== ''
  ) as string[]

  // All null/empty
  if (nonNull.length === 0) {
    return { type: 'string', confidence: 'LOW' }
  }

  const total = nonNull.length

  // Check for leading zeros before any number detection
  const hasAnyLeadingZero = nonNull.some(hasLeadingZero)
  if (hasAnyLeadingZero) {
    return { type: 'string', confidence: 'HIGH' }
  }

  // Check for boolean
  const boolCount = nonNull.filter((v) =>
    BOOLEAN_VALUES.has(v.toLowerCase())
  ).length
  if (boolCount / total > 0.95) {
    return { type: 'boolean', confidence: 'HIGH' }
  }

  // Check for dates
  const dateCount = nonNull.filter(isDateLike).length
  if (dateCount / total > 0.9) {
    return { type: 'date', confidence: 'HIGH' }
  }
  if (dateCount / total > 0.6) {
    return { type: 'date', confidence: 'MEDIUM' }
  }

  // Check for currency-stripped numbers
  const strippedValues = nonNull.map(stripCurrency)
  const hasCurrencySymbol = nonNull.some((v) => /[$€£¥]/.test(v))

  const numericCount = strippedValues.filter((v) => {
    const trimmed = v.trim()
    if (trimmed === '') return false
    return !isNaN(Number(trimmed)) && trimmed !== ''
  }).length

  if (hasCurrencySymbol) {
    // Currency-formatted numbers: MEDIUM confidence
    const allNumericAfterStrip = numericCount / total > 0.95
    if (allNumericAfterStrip) {
      return { type: 'number', confidence: 'MEDIUM' }
    }
  }

  if (numericCount / total > 0.95) {
    return { type: 'number', confidence: 'HIGH' }
  }
  if (numericCount / total >= 0.6) {
    return { type: 'number', confidence: 'LOW' }
  }

  // Default
  return { type: 'string', confidence: 'HIGH' }
}

/**
 * Infer schema for a dataset given headers and rows.
 * Samples up to sampleSize rows (default 200).
 */
export function inferSchema(
  headers: string[],
  rows: string[][],
  sampleSize = 200
): SchemaColumn[] {
  const sample = rows.slice(0, sampleSize)

  return headers.map((name, colIndex) => {
    const columnValues = sample.map((row) => row[colIndex] ?? '')

    const nullCount = columnValues.filter((v) => v === null || v === undefined || v === '').length
    const nullRate = sample.length > 0 ? nullCount / sample.length : 1

    const nonNull = columnValues.filter((v) => v !== null && v !== undefined && v !== '')
    const sampleValues = nonNull.slice(0, 5)

    const { type, confidence } = inferColumnType(columnValues)
    const dateFormat = type === 'date' ? detectDateFormat(sampleValues) : undefined

    return {
      name,
      inferredType: type,
      confidence,
      sampleValues,
      nullRate,
      ...(dateFormat ? { dateFormat } : {}),
    }
  })
}
