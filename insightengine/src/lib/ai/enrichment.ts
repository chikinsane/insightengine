import { getAnthropicClient } from './anthropic-client'
import {
  INSIGHT_SYSTEM_PROMPT,
  FOLLOWUP_SYSTEM_PROMPT,
  RELATED_SEARCHES_PROMPT,
  PREBUILT_DASHBOARDS_PROMPT,
} from './prompts'
import { buildStatSummary } from '../query/result-formatter'
import type { QueryResult, VizType, EnrichmentResult, SchemaColumn, PrebuiltDashboard } from '@/types/query'

const HAIKU_MODEL = 'claude-haiku-4-5'

export async function generateInsight(statSummary: string, question: string): Promise<string> {
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: HAIKU_MODEL, max_tokens: 256, system: INSIGHT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Statistical summary:\n${statSummary}\n\nOriginal question: ${question}` }],
  })
  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text ?? 'No insight available.'
}

export async function selectVizType(result: QueryResult, question: string): Promise<VizType> {
  const client = getAnthropicClient()
  const statSummary = buildStatSummary(result)
  const columnInfo = result.columns.map((c) => `${c.name} (${c.type})`).join(', ')
  const response = await client.messages.create({
    model: HAIKU_MODEL, max_tokens: 64,
    system: 'You are a data visualization expert. Given a query result schema and question, suggest the best chart type. Respond with ONLY one of: bar, line, pie, scatter, table',
    messages: [{ role: 'user', content: `Columns: ${columnInfo}\nStatistical summary:\n${statSummary}\n\nQuestion: ${question}\n\nBest chart type:` }],
  })
  const textBlock = response.content.find((b) => b.type === 'text')
  const raw = textBlock?.text?.trim().toLowerCase() ?? 'table'
  const validTypes: VizType[] = ['bar', 'line', 'pie', 'scatter', 'table']
  return validTypes.find((t) => raw.includes(t)) ?? 'table'
}

export function applyVizGuardrails(suggestedType: VizType, result: QueryResult): VizType {
  const { columns, rows } = result
  const DATE_TYPES = new Set(['date', 'datetime', 'timestamp', 'time'])
  const NUMERIC_TYPES = new Set(['number', 'integer', 'float', 'double', 'bigint', 'decimal', 'int', 'int32', 'int64', 'float32', 'float64'])
  const typedDateColumns = columns.filter((c) => DATE_TYPES.has(c.type.toLowerCase()))
  const typedNumericColumns = columns.filter((c) => NUMERIC_TYPES.has(c.type.toLowerCase()))
  const typedStringColumns = columns.filter((c) => !DATE_TYPES.has(c.type.toLowerCase()) && !NUMERIC_TYPES.has(c.type.toLowerCase()))
  const unknownColumns = typedStringColumns.filter((c) => c.type.toLowerCase() === 'unknown' || c.type.toLowerCase() === 'string')
  const heuristicDateColumns = unknownColumns.filter((c) => !isNumericColumn(c.name, rows) && isDateColumn(c.name, rows))
  const heuristicNumericColumns = unknownColumns.filter((c) => isNumericColumn(c.name, rows))
  const dateColumns = [...typedDateColumns, ...heuristicDateColumns]
  const numericColumns = [...typedNumericColumns, ...heuristicNumericColumns]
  const stringColumns = typedStringColumns.filter((c) => !heuristicDateColumns.includes(c) && !heuristicNumericColumns.includes(c))
  if (dateColumns.length === 1 && numericColumns.length === 1) return 'line'
  for (const col of stringColumns) {
    const uniqueValues = new Set(rows.map((r) => String(r[col.name])))
    if (uniqueValues.size > 8) return 'table'
  }
  if (numericColumns.length === 2 && stringColumns.length === 0 && dateColumns.length === 0) return 'scatter'
  for (const col of numericColumns) {
    const values = rows.map((r) => Number(r[col.name])).filter((n) => !isNaN(n))
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0)
      if (Math.abs(sum - 100) < 5 || Math.abs(sum - 1.0) < 0.05) return 'pie'
    }
  }
  if (stringColumns.length >= 1 && numericColumns.length === 1) {
    const catCol = stringColumns[0]
    const uniqueValues = new Set(rows.map((r) => String(r[catCol.name])))
    if (uniqueValues.size <= 8) return 'bar'
  }
  return suggestedType === 'table' ? 'table' : 'table'
}

export async function generateFollowUps(statSummary: string, question: string): Promise<string[]> {
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: HAIKU_MODEL, max_tokens: 512, system: FOLLOWUP_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Statistical summary:\n${statSummary}\n\nOriginal question: ${question}\n\nGenerate 3 follow-up questions as a JSON array of strings.` }],
  })
  return parseStringArray(response, ['What is the trend over time?', 'Which category performs best?', 'Are there any significant outliers?'])
}

export async function generateRelatedSearches(statSummary: string, question: string): Promise<string[]> {
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: HAIKU_MODEL, max_tokens: 512, system: RELATED_SEARCHES_PROMPT,
    messages: [{ role: 'user', content: `Statistical summary:\n${statSummary}\n\nOriginal question: ${question}\n\nGenerate 3 related searches from different angles as a JSON array of strings.` }],
  })
  return parseStringArray(response, ['What is the overall distribution?', 'Which groups are above average?', 'How does this compare across categories?'])
}

export async function generatePrebuiltDashboards(schemaColumns: SchemaColumn[]): Promise<PrebuiltDashboard[]> {
  if (schemaColumns.length === 0) return getDefaultDashboards()
  const client = getAnthropicClient()
  const colList = schemaColumns.map((c) => `"${c.name}" (${c.inferredType})`).join(', ')
  const response = await client.messages.create({
    model: HAIKU_MODEL, max_tokens: 1024, system: PREBUILT_DASHBOARDS_PROMPT,
    messages: [{ role: 'user', content: `Dataset schema columns:\n${colList}\n\nGenerate 5 prebuilt dashboard templates as a JSON array.` }],
  })
  const textBlock = response.content.find((b) => b.type === 'text')
  const text = textBlock?.text ?? '[]'
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((d) => typeof d.title === 'string' && typeof d.description === 'string' && typeof d.question === 'string' && typeof d.category === 'string' && typeof d.icon === 'string').slice(0, 5)
        if (valid.length > 0) return valid as PrebuiltDashboard[]
      }
    }
  } catch { /* fall through */ }
  return getDefaultDashboards()
}

/**
 * Runs all 5 enrichment functions in parallel using Promise.allSettled.
 * Returns EnrichmentResult with graceful fallbacks on partial failure.
 * schemaColumns enables schema-aware prebuilt dashboard generation.
 */
export async function runParallelEnrichment(result: QueryResult, question: string, schemaColumns?: SchemaColumn[]): Promise<EnrichmentResult> {
  const statSummary = buildStatSummary(result)
  const [insightResult, vizTypeResult, followUpsResult, relatedSearchesResult, prebuiltDashboardsResult] = await Promise.allSettled([
    generateInsight(statSummary, question),
    selectVizType(result, question),
    generateFollowUps(statSummary, question),
    generateRelatedSearches(statSummary, question),
    generatePrebuiltDashboards(schemaColumns ?? []),
  ])
  const insight = insightResult.status === 'fulfilled' ? insightResult.value : 'Unable to generate insight.'
  const suggestedVizType = vizTypeResult.status === 'fulfilled' ? vizTypeResult.value : 'table'
  const followUpQuestions = followUpsResult.status === 'fulfilled' ? followUpsResult.value : ['What trends exist?', 'What are the top values?', 'Are there any anomalies?']
  const relatedSearches = relatedSearchesResult.status === 'fulfilled' ? relatedSearchesResult.value : ['What is the overall distribution?', 'Which groups are above average?', 'How does this compare?']
  const prebuiltDashboards = prebuiltDashboardsResult.status === 'fulfilled' ? prebuiltDashboardsResult.value : getDefaultDashboards()
  const vizType = applyVizGuardrails(suggestedVizType, result)
  const chartConfig = buildChartConfig(result, vizType)
  return { insight, vizType, followUpQuestions, relatedSearches, prebuiltDashboards, chartConfig }
}

function buildChartConfig(result: QueryResult, vizType: VizType): { xKey: string; yKeys: string[]; title: string } {
  const { columns, rows } = result
  const DATE_TYPES = new Set(['date', 'datetime', 'timestamp'])
  const NUMERIC_TYPES = new Set(['number', 'integer', 'float', 'double', 'bigint', 'decimal', 'int', 'real'])
  const looksNumeric = (colName: string) => {
    const sample = rows.slice(0, 5).map((r) => r[colName]).filter((v) => v !== null && v !== undefined)
    return sample.length > 0 && sample.every((v) => !isNaN(Number(v)))
  }
  const numericCols = columns.filter((c) => NUMERIC_TYPES.has(c.type.toLowerCase()) || looksNumeric(c.name))
  const dateCols = columns.filter((c) => DATE_TYPES.has(c.type.toLowerCase()))
  const categoryCols = columns.filter((c) => !numericCols.includes(c) && !dateCols.includes(c))
  const xKey = dateCols[0]?.name ?? categoryCols[0]?.name ?? columns[0]?.name ?? 'x'
  const yKeys = numericCols.filter((c) => c.name !== xKey).map((c) => c.name)
  if (yKeys.length === 0) { const fallback = columns.find((c) => c.name !== xKey)?.name ?? columns[0]?.name ?? 'y'; yKeys.push(fallback) }
  const primaryY = yKeys[0]
  const title = vizType === 'pie' ? `${primaryY} breakdown` : `${yKeys.length > 1 ? yKeys.join(', ') : primaryY} by ${xKey}`
  return { xKey, yKeys, title }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStringArray(response: any, fallback: string[]): string[] {
  const textBlock = response.content?.find((b: { type: string }) => b.type === 'text')
  const text = textBlock?.text ?? '[]'
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        const questions = parsed.filter((q) => typeof q === 'string').slice(0, 3)
        while (questions.length < 3) questions.push(fallback[questions.length] ?? 'Explore more.')
        return questions
      }
    }
  } catch { /* fall through */ }
  return fallback
}

function getDefaultDashboards(): PrebuiltDashboard[] {
  return [
    { title: 'Overview Summary', description: 'High-level count and key totals across the dataset', question: 'Show me a summary with total records and key totals', category: 'overview', icon: '📊' },
    { title: 'Top 10 Records', description: 'The 10 highest-value entries in the dataset', question: 'Show the top 10 records ranked by the highest numeric value', category: 'distribution', icon: '🏆' },
    { title: 'Category Breakdown', description: 'Count of records grouped by each category', question: 'How many records are in each category?', category: 'breakdown', icon: '📂' },
    { title: 'Value Distribution', description: 'Average, min, max across all numeric columns', question: 'What are the average, minimum, and maximum values for each numeric column?', category: 'distribution', icon: '📈' },
    { title: 'Comparative Analysis', description: 'Side-by-side comparison across groups', question: 'Compare the average values across the main grouping dimensions', category: 'comparison', icon: '⚖️' },
  ]
}

const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}|^\d{2}[\/\-]\d{2}[\/\-]\d{4}|^\w{3,9}\s+\d{1,2},?\s+\d{4}/i
function isDateColumn(colName: string, rows: Record<string, unknown>[]): boolean {
  if (rows.length === 0) return false
  const sample = rows.slice(0, 5).map((r) => r[colName]).filter(Boolean)
  return sample.length > 0 && sample.every((v) => { const str = String(v); return DATE_STRING_PATTERN.test(str) && !isNaN(Date.parse(str)) })
}
function isNumericColumn(colName: string, rows: Record<string, unknown>[]): boolean {
  if (rows.length === 0) return false
  const sample = rows.slice(0, 5).map((r) => r[colName]).filter((v) => v !== null && v !== undefined)
  return sample.length > 0 && sample.every((v) => !isNaN(Number(v)))
}
