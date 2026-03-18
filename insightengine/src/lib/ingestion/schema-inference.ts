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
  // US date: 01/01/2024 or 1/1/2024
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) return true
  // UK date: 01-01-2024
  if (/^\d{1,2}-\d{2}-\d{4}$/.test(value)) return true
  return false
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

    return {
      name,
      inferredType: type,
      confidence,
      sampleValues,
      nullRate,
    }
  })
}
