import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { dataSources, datasets } from '@/db/schema'
import { getAuthenticatedUserId, ensureUserExists } from '@/lib/tenant'
import { parseCSVBuffer } from '@/lib/ingestion/csv-parser'
import { parseExcelBuffer } from '@/lib/ingestion/excel-parser'
import { inferSchema } from '@/lib/ingestion/schema-inference'
import { uploadBlob } from '@/lib/storage/blob-store'

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
])

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

function detectFileType(mimeType: string, filename: string): 'csv' | 'xlsx' | 'xls' {
  if (mimeType === 'text/csv') return 'csv'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx'
  if (mimeType === 'application/vnd.ms-excel') return 'xls'
  // Fallback to file extension
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  if (ext === 'xlsx') return 'xlsx'
  if (ext === 'xls') return 'xls'
  return 'csv'
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    await ensureUserExists(userId)

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only CSV and Excel files are supported.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File must be under 25MB.' },
        { status: 400 }
      )
    }

    // Convert to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Detect file type and parse
    const fileType = detectFileType(file.type, file.name)
    const columnMeta = fileType === 'csv'
      ? await parseCSVBuffer(buffer)
      : parseExcelBuffer(buffer)

    const { headers, rows } = columnMeta

    // Infer schema
    const schemaColumns = inferSchema(headers, rows)

    // Create data_source record
    const [dataSource] = await db
      .insert(dataSources)
      .values({ userId, name: file.name, type: fileType })
      .returning()

    // Create dataset record with a placeholder storageKey
    const [dataset] = await db
      .insert(datasets)
      .values({
        userId,
        dataSourceId: dataSource.id,
        name: file.name,
        schema: { columns: schemaColumns, confirmed: false },
        rowCount: rows.length,
        storageKey: `${userId}/__pending__`,
      })
      .returning()

    // Update storageKey now that we have the real dataset ID
    await db
      .update(datasets)
      .set({ storageKey: `${userId}/${dataset.id}` })
      .where(eq(datasets.id, dataset.id))

    // Store raw file in Netlify Blobs keyed by userId/datasetId
    await uploadBlob(userId, dataset.id, buffer, {
      filename: file.name,
      mimeType: file.type,
    })

    const hasLowConfidence = schemaColumns.some(c => c.confidence === 'LOW')

    return NextResponse.json(
      {
        datasetId: dataset.id,
        filename: file.name,
        rowCount: rows.length,
        schema: schemaColumns,
        hasLowConfidence,
        schemaConfirmed: false,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
