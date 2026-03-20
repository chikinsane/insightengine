import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { getAnthropicClient } from './anthropic-client'
import { NL_TO_SQL_SYSTEM_PROMPT, buildSchemaContext } from './prompts'
import { validateSQL, validateColumnReferences } from '../query/query-validator'
import { executeQueryOnFile } from '../query/duckdb-client'
import type { SchemaColumn, QueryResult } from '@/types/query'

const SQL_OUTPUT_SCHEMA = z.object({
  sql: z.string(),
  explanation: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
})

/**
 * Generates SQL from a natural language question using Anthropic structured outputs.
 * Optionally includes a correction context if a previous attempt failed.
 */
export async function generateSQL(
  question: string,
  columns: SchemaColumn[],
  rowCount: number,
  previousError?: string
): Promise<{ sql: string; explanation: string }> {
  const client = getAnthropicClient()
  const schemaContext = buildSchemaContext(columns, rowCount)
  const validColumnList = columns.map((c) => c.name).join(', ')

  let userMessage = `${schemaContext}\n\nQuestion: ${question}`

  if (previousError) {
    userMessage += `\n\nPrevious attempt failed with error: ${previousError}\nValid column names are: ${validColumnList}\nPlease regenerate the SQL using only valid column names.`
  }

  const response = await client.messages.parse({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: NL_TO_SQL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    output_config: {
      format: zodOutputFormat(SQL_OUTPUT_SCHEMA),
    },
  })

  const parsed = response.parsed_output
  if (!parsed) {
    throw new Error('No structured output returned from Anthropic')
  }

  return { sql: parsed.sql, explanation: parsed.explanation }
}

/**
 * Executes a natural language query against a file with up to 3 retry attempts.
 * Retries on SQL validation failures, column hallucinations, and DuckDB execution errors.
 */
export async function executeWithRetry(
  question: string,
  columns: SchemaColumn[],
  rowCount: number,
  fileBuffer: Buffer,
  datasetId: string,
  fileType: 'csv' | 'xlsx'
): Promise<{ sql: string; explanation: string; result: QueryResult }> {
  const MAX_ATTEMPTS = 3
  const validColumnNames = columns.map((c) => c.name)
  let lastError = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const previousError = attempt > 1 ? lastError : undefined

    let sql: string
    let explanation: string

    try {
      const generated = await generateSQL(question, columns, rowCount, previousError)
      sql = generated.sql
      explanation = generated.explanation
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      continue
    }

    // Layer 1: DML validation
    const dmlValidation = validateSQL(sql)
    if (!dmlValidation.valid) {
      lastError = `Query rejected: ${dmlValidation.reason}`
      continue
    }

    // Layer 2: Column reference validation
    const colValidation = validateColumnReferences(sql, validColumnNames)
    if (!colValidation.valid) {
      lastError = `${colValidation.reason}`
      continue
    }

    // Layer 3: Execute on SQLite
    try {
      const result = await executeQueryOnFile(fileBuffer, sql, datasetId, fileType, columns)
      return { sql, explanation, result }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      lastError = `DuckDB execution error: ${errMsg}. Valid columns: ${validColumnNames.join(', ')}`
    }
  }

  throw new Error(`Could not generate a valid query after 3 attempts. Last error: ${lastError}`)
}
