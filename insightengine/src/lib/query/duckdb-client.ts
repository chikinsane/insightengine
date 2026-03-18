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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instance: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connection: any = null

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

    // Load file into "data" table.
    // Use read_csv with header=true to preserve column names exactly
    // (including Unicode like ₹, spaces, and parentheses).
    try {
      await connection.run(
        `CREATE TABLE data AS SELECT * FROM read_csv('${tmpPath}', header=true, auto_detect=true)`
      )
    } catch (csvErr) {
      const msg = csvErr instanceof Error ? csvErr.message : String(csvErr)
      throw new Error(`Failed to load CSV into DuckDB: ${msg}. File: ${tmpPath}, Type: ${fileType}`)
    }

    // Execute the user's SQL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reader: any
    try {
      reader = await connection.runAndReadAll(sql)
    } catch (sqlErr) {
      const msg = sqlErr instanceof Error ? sqlErr.message : String(sqlErr)
      throw new Error(`SQL execution failed: ${msg}. Query: ${sql.slice(0, 200)}`)
    }
    const columns = reader.columnNames()
    const columnTypes = reader.columnTypes()
    const rows = reader.getRows()

    // Build QueryResult
    const columnMeta = columns.map((name: string, i: number) => ({
      name,
      type: columnTypes[i]?.toString() ?? 'unknown',
    }))

    const rowObjects: Record<string, unknown>[] = rows.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col: string, i: number) => {
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
