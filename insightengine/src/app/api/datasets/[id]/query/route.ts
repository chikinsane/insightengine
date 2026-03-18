import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { datasets, queries, resultsCache } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'
import { executeWithRetry } from '@/lib/ai/nl-to-sql'
import { runParallelEnrichment } from '@/lib/ai/enrichment'
import { downloadBlob } from '@/lib/storage/blob-store'
import type { SchemaColumn } from '@/types/query'

// Extend Netlify function timeout to 60 seconds — DuckDB + Anthropic calls need time
export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const { id } = await params

    // Fetch dataset with tenant isolation
    const datasetRows = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.id, id), eq(datasets.userId, userId)))
      .limit(1)

    if (datasetRows.length === 0) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    const dataset = datasetRows[0]

    // Tenant isolation double-check (belt-and-suspenders)
    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Schema confirmation gate — must be confirmed before querying
    const schemaData = dataset.schema as {
      confirmed?: boolean
      columns?: SchemaColumn[]
    } | null

    if (!schemaData || schemaData.confirmed !== true) {
      return NextResponse.json(
        {
          error:
            'Schema must be confirmed before querying. Please review and confirm the column types.',
        },
        { status: 400 }
      )
    }

    const columns: SchemaColumn[] = schemaData.columns ?? []

    // Validate request body
    let body: { question?: unknown; previousContext?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { question, previousContext } = body

    if (
      !question ||
      typeof question !== 'string' ||
      question.trim().length === 0 ||
      question.length > 500
    ) {
      return NextResponse.json(
        { error: 'question is required and must be 1–500 characters' },
        { status: 400 }
      )
    }

    // Build enhanced question if there is prior context from a follow-up
    let enhancedQuestion = question.trim()
    if (
      previousContext &&
      typeof previousContext === 'string' &&
      previousContext.trim().length > 0
    ) {
      enhancedQuestion = `[Context from previous question: ${previousContext.trim()}]\n\nNew question: ${enhancedQuestion}`
    }

    // Determine file type from dataset name extension
    const datasetName = dataset.name.toLowerCase()
    const fileType: 'csv' | 'xlsx' = datasetName.endsWith('.xlsx') ? 'xlsx' : 'csv'

    // Download file from Netlify Blobs
    let fileBuffer: Buffer
    try {
      fileBuffer = await downloadBlob(userId, id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `Failed to load dataset file: ${msg}` },
        { status: 500 }
      )
    }

    const rowCount = dataset.rowCount ?? 0

    // Execute NL → SQL → DuckDB with retry
    let sql: string
    let explanation: string
    let queryResult: Awaited<ReturnType<typeof executeWithRetry>>['result']

    try {
      const execResult = await executeWithRetry(
        enhancedQuestion,
        columns,
        rowCount,
        fileBuffer,
        id,
        fileType
      )
      sql = execResult.sql
      explanation = execResult.explanation
      queryResult = execResult.result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Could not generate a valid query after 3 attempts')) {
        // Extract the last error detail for the response
        const detail = msg.replace('Could not generate a valid query after 3 attempts. Last error: ', '')
        console.error('[query/route] NL-to-SQL failed:', msg)
        return NextResponse.json(
          {
            error: 'Unable to answer this question. Try rephrasing or ask something simpler about your data.',
            detail,
          },
          { status: 422 }
        )
      }
      throw err
    }

    // Parallel enrichment: insight + vizType + follow-up questions
    const enrichment = await runParallelEnrichment(queryResult, question.trim())

    // Persist query record to Neon
    const [savedQuery] = await db
      .insert(queries)
      .values({
        userId,
        datasetId: id,
        naturalLanguage: question.trim(),
        generatedSql: sql,
        vizType: enrichment.vizType,
      })
      .returning()

    // Cache result in Neon for future retrieval
    await db.insert(resultsCache).values({
      queryId: savedQuery.id,
      userId,
      resultJson: { result: queryResult, enrichment },
    })

    return NextResponse.json({
      queryId: savedQuery.id,
      sql,
      explanation,
      result: {
        columns: queryResult.columns,
        rows: queryResult.rows,
        rowCount: queryResult.rowCount,
      },
      enrichment: {
        insight: enrichment.insight,
        vizType: enrichment.vizType,
        followUpQuestions: enrichment.followUpQuestions,
        chartConfig: enrichment.chartConfig,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    console.error('[query/route] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
