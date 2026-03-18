import { getAnthropicClient } from './anthropic-client'
import { INSIGHT_SYSTEM_PROMPT, FOLLOWUP_SYSTEM_PROMPT } from './prompts'
import { buildStatSummary } from '../query/result-formatter'
import type { QueryResult, VizType, EnrichmentResult } from '@/types/query'

const HAIKU_MODEL = 'claude-haiku-4-5'

/**
 * Generates a 1-2 sentence plain English insight from the statistical summary.
 * IMPORTANT: Uses stat summary, never raw rows.
 */
export async function generateInsight(
  statSummary: string,
  question: string
): Promise<string> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 256,
    system: INSIGHT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Statistical summary:\n${statSummary}\n\nOriginal question: ${question}`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text ?? 'No insight available.'
}

/**
 * Uses Claude Haiku to suggest a visualization type for the query result.
 */
export async function selectVizType(
  result: QueryResult,
  question: string
): Promise<VizType> {
  const client = getAnthropicClient()
  const statSummary = buildStatSummary(result)
  const columnInfo = result.columns.map((c) => `${c.name} (${c.type})`).join(', ')

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 64,
    system:
      'You are a data visualization expert. Given a query result schema and question, suggest the best chart type. Respond with ONLY one of: bar, line, pie, scatter, table',
    messages: [
      {
        role: 'user',
        content: `Columns: ${columnInfo}\nStatistical summary:\n${statSummary}\n\nQuestion: ${question}\n\nBest chart type:`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const raw = textBlock?.text?.trim().toLowerCase() ?? 'table'
  const validTypes: VizType[] = ['bar', 'line', 'pie', 'scatter', 'table']
  const suggested = validTypes.find((t) => raw.includes(t)) ?? 'table'

  return suggested
}

/**
 * Applies rule-based guardrails to override LLM viz type suggestion.
 * Pure function — no LLM dependency.
 *
 * Rules (in priority order):
 * 1. 1 date/datetime col + 1 numeric col → "line"
 * 2. Category col with >8 unique values → "table"
 * 3. 2 numeric cols (no category) → "scatter"
 * 4. Values sum to ~100 or ~1.0 → "pie"
 * 5. <8 categories + 1 numeric col → "bar"
 * 6. Default → "table"
 */
export function applyVizGuardrails(
  suggestedType: VizType,
  result: QueryResult
): VizType {
  const { columns, rows } = result

  const DATE_TYPES = new Set(['date', 'datetime', 'timestamp', 'time'])
  const NUMERIC_TYPES = new Set(['number', 'integer', 'float', 'double', 'bigint', 'decimal', 'int', 'int32', 'int64', 'float32', 'float64'])

  // First pass: classify by explicit type metadata
  const typedDateColumns = columns.filter((c) => DATE_TYPES.has(c.type.toLowerCase()))
  const typedNumericColumns = columns.filter((c) => NUMERIC_TYPES.has(c.type.toLowerCase()))
  const typedStringColumns = columns.filter(
    (c) => !DATE_TYPES.has(c.type.toLowerCase()) && !NUMERIC_TYPES.has(c.type.toLowerCase())
  )

  // Second pass: use heuristics only for unknown-typed columns
  const unknownColumns = typedStringColumns.filter(
    (c) => c.type.toLowerCase() === 'unknown' || c.type.toLowerCase() === 'string'
  )
  const heuristicDateColumns = unknownColumns.filter((c) => !isNumericColumn(c.name, rows) && isDateColumn(c.name, rows))
  const heuristicNumericColumns = unknownColumns.filter((c) => isNumericColumn(c.name, rows))

  const dateColumns = [...typedDateColumns, ...heuristicDateColumns]
  const numericColumns = [...typedNumericColumns, ...heuristicNumericColumns]
  const stringColumns = typedStringColumns.filter(
    (c) => !heuristicDateColumns.includes(c) && !heuristicNumericColumns.includes(c)
  )

  // Rule 1: date + numeric → line
  if (dateColumns.length === 1 && numericColumns.length === 1) {
    return 'line'
  }

  // Rule 2: category column with >8 unique values → table
  for (const col of stringColumns) {
    const uniqueValues = new Set(rows.map((r) => String(r[col.name])))
    if (uniqueValues.size > 8) {
      return 'table'
    }
  }

  // Rule 3: 2 numeric columns, no string/category → scatter
  if (numericColumns.length === 2 && stringColumns.length === 0 && dateColumns.length === 0) {
    return 'scatter'
  }

  // Rule 4: values sum to ~100 or ~1.0 → pie
  for (const col of numericColumns) {
    const values = rows
      .map((r) => Number(r[col.name]))
      .filter((n) => !isNaN(n))
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0)
      if (Math.abs(sum - 100) < 5 || Math.abs(sum - 1.0) < 0.05) {
        return 'pie'
      }
    }
  }

  // Rule 5: ≤8 categories + 1 numeric → bar
  if (stringColumns.length >= 1 && numericColumns.length === 1) {
    const catCol = stringColumns[0]
    const uniqueValues = new Set(rows.map((r) => String(r[catCol.name])))
    if (uniqueValues.size <= 8) {
      return 'bar'
    }
  }

  // Default fallback
  return 'table'
}

/**
 * Generates exactly 3 follow-up questions based on the stat summary and question.
 */
export async function generateFollowUps(
  statSummary: string,
  question: string
): Promise<string[]> {
  const client = getAnthropicClient()

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 512,
    system: FOLLOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Statistical summary:\n${statSummary}\n\nOriginal question: ${question}\n\nGenerate 3 follow-up questions as a JSON array of strings.`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const text = textBlock?.text ?? '[]'

  try {
    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        const questions = parsed.filter((q) => typeof q === 'string').slice(0, 3)
        // Pad to exactly 3 if needed
        while (questions.length < 3) {
          questions.push('What other insights can you find?')
        }
        return questions
      }
    }
  } catch {
    // Fall through to default
  }

  return [
    'What is the trend over time?',
    'Which category performs best?',
    'Are there any significant outliers?',
  ]
}

/**
 * Runs all 3 enrichment functions in parallel using Promise.allSettled.
 * Returns EnrichmentResult with graceful fallbacks on partial failure.
 */
export async function runParallelEnrichment(
  result: QueryResult,
  question: string
): Promise<EnrichmentResult> {
  const statSummary = buildStatSummary(result)

  const [insightResult, vizTypeResult, followUpsResult] = await Promise.allSettled([
    generateInsight(statSummary, question),
    selectVizType(result, question),
    generateFollowUps(statSummary, question),
  ])

  const insight =
    insightResult.status === 'fulfilled' ? insightResult.value : 'Unable to generate insight.'

  const suggestedVizType =
    vizTypeResult.status === 'fulfilled' ? vizTypeResult.value : 'table'

  const followUpQuestions =
    followUpsResult.status === 'fulfilled'
      ? followUpsResult.value
      : ['What trends exist?', 'What are the top values?', 'Are there any anomalies?']

  const vizType = applyVizGuardrails(suggestedVizType, result)

  // Build chart config from result shape
  const chartConfig = buildChartConfig(result, vizType)

  return {
    insight,
    vizType,
    followUpQuestions,
    chartConfig,
  }
}

/**
 * Builds chart config from the query result.
 * Returns yKeys[] (all numeric output columns) for multi-series support.
 */
function buildChartConfig(
  result: QueryResult,
  vizType: VizType
): { xKey: string; yKeys: string[]; title: string } {
  const { columns, rows } = result

  const DATE_TYPES = new Set(['date', 'datetime', 'timestamp'])
  const NUMERIC_TYPES = new Set(['number', 'integer', 'float', 'double', 'bigint', 'decimal', 'int', 'real'])

  // Helper: check if a column's actual row data looks numeric
  const looksNumeric = (colName: string) => {
    const sample = rows.slice(0, 5).map((r) => r[colName]).filter((v) => v !== null && v !== undefined)
    return sample.length > 0 && sample.every((v) => !isNaN(Number(v)))
  }

  const numericCols = columns.filter(
    (c) => NUMERIC_TYPES.has(c.type.toLowerCase()) || looksNumeric(c.name)
  )
  const dateCols = columns.filter((c) => DATE_TYPES.has(c.type.toLowerCase()))
  const categoryCols = columns.filter(
    (c) => !numericCols.includes(c) && !dateCols.includes(c)
  )

  // xKey: prefer date > category > first column
  const xKey = dateCols[0]?.name ?? categoryCols[0]?.name ?? columns[0]?.name ?? 'x'

  // yKeys: all numeric columns that are NOT the xKey
  const yKeys = numericCols
    .filter((c) => c.name !== xKey)
    .map((c) => c.name)

  // Fallback if no numeric cols detected
  if (yKeys.length === 0) {
    const fallback = columns.find((c) => c.name !== xKey)?.name ?? columns[0]?.name ?? 'y'
    yKeys.push(fallback)
  }

  const primaryY = yKeys[0]
  const title = vizType === 'pie'
    ? `${primaryY} breakdown`
    : `${yKeys.length > 1 ? yKeys.join(', ') : primaryY} by ${xKey}`

  return { xKey, yKeys, title }
}

// Helper: heuristically detect if a column contains date-like values
// Only matches actual date string patterns, not raw numbers that could parse as timestamps
const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}|^\d{2}[\/\-]\d{2}[\/\-]\d{4}|^\w{3,9}\s+\d{1,2},?\s+\d{4}/i

function isDateColumn(colName: string, rows: Record<string, unknown>[]): boolean {
  if (rows.length === 0) return false
  const sample = rows.slice(0, 5).map((r) => r[colName]).filter(Boolean)
  return (
    sample.length > 0 &&
    sample.every((v) => {
      const str = String(v)
      return DATE_STRING_PATTERN.test(str) && !isNaN(Date.parse(str))
    })
  )
}

// Helper: heuristically detect if a column contains numeric values
function isNumericColumn(colName: string, rows: Record<string, unknown>[]): boolean {
  if (rows.length === 0) return false
  const sample = rows.slice(0, 5).map((r) => r[colName]).filter((v) => v !== null && v !== undefined)
  return sample.length > 0 && sample.every((v) => !isNaN(Number(v)))
}
