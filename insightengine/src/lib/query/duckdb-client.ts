import * as fs from 'fs'
import * as path from 'path'
import type { QueryResult } from '@/types/query'

/**
 * Executes a SQL query over a file buffer using DuckDB in-memory instance.
 * Supports CSV and XLSX files. Always cleans up temp files and connections.
 */
export async function executeQueryOnFile(
  fileBuffer: Buffer,
  sql: string,
  datasetId: string,
  fileType: 'csv' | 'xlsx'
): Promise<QueryResult> {
  // We need to import DuckDB dynamically since it's an external native module
  const { DuckDBInstance } = await import('@duckdb/node-api')

  let tmpPath: string | null = null
  let instance: Awaited<ReturnType<typeof DuckDBInstance.create>> | null = null
  let connection: Awaited<ReturnType<typeof instance.connect>> | null = null

  try {
    // Write buffer to temp file
    const ext = fileType === 'xlsx' ? 'csv' : fileType
    tmpPath = path.join('/tmp', `${datasetId}.${ext}`)

    if (fileType === 'xlsx') {
      // Convert XLSX to CSV using SheetJS
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const csvData = XLSX.utils.sheet_to_csv(worksheet)
      fs.writeFileSync(tmpPath, csvData, 'utf8')
    } else {
      fs.writeFileSync(tmpPath, fileBuffer)
    }

    // Create in-memory DuckDB instance
    instance = await DuckDBInstance.create(':memory:')
    connection = await instance.connect()

    // Load file into "data" table
    await connection.run(
      `CREATE TABLE data AS SELECT * FROM read_csv_auto('${tmpPath}')`
    )

    // Execute the user's SQL
    const reader = await connection.runAndReadAll(sql)
    const columns = reader.columnNames()
    const columnTypes = reader.columnTypes()
    const rows = reader.getRows()

    // Build QueryResult
    const columnMeta = columns.map((name, i) => ({
      name,
      type: columnTypes[i]?.toString() ?? 'unknown',
    }))

    const rowObjects: Record<string, unknown>[] = rows.map((row) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col, i) => {
        obj[col] = row[i]
      })
      return obj
    })

    return {
      columns: columnMeta,
      rows: rowObjects,
      rowCount: rowObjects.length,
      sql,
    }
  } finally {
    // Always clean up resources
    try {
      if (connection) await connection.close()
    } catch {
      // ignore close errors
    }
    try {
      if (instance) await instance.close()
    } catch {
      // ignore close errors
    }
    if (tmpPath) {
      try {
        fs.unlinkSync(tmpPath)
      } catch {
        // ignore unlink errors
      }
    }
  }
}
