/**
 * SQL query execution over file buffers.
 *
 * Uses better-sqlite3 (SQLite in-memory) instead of DuckDB because
 * DuckDB's native module requires libduckdb.so — a shared library that
 * doesn't exist in Netlify's serverless Lambda environment.
 * better-sqlite3 statically compiles SQLite into its .node file and only
 * needs glibc/pthread, which are always present on Linux.
 */
import Database from 'better-sqlite3'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { QueryResult, SchemaColumn } from '@/types/query'
import { formatResult } from './result-formatter'

type ColType = 'REAL' | 'TEXT'

/** Convert a raw date string to ISO YYYY-MM-DD based on the detected format. */
function normaliseDateToISO(raw: string, fmt: string): string {
  if (!raw || !raw.trim()) return raw
  if (fmt === 'DD/MM/YYYY') {
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  if (fmt === 'DD-MMM-YYYY') {
    const MONTHS: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    }
    const m = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/)
    if (m) {
      const month = MONTHS[m[2].toLowerCase()]
      if (month) return `${m[3]}-${month}-${m[1].padStart(2, '0')}`
    }
  }
  return raw
}

/**
 * Samples up to 50 non-empty values in a column and returns REAL if ≥80%
 * parse cleanly as numbers after stripping currency/formatting characters.
 */
function detectColType(values: string[]): ColType {
  const sample = values.filter((v) => v && v.trim() !== '').slice(0, 50)
  if (sample.length === 0) return 'TEXT'
  const numericCount = sample.filter((v) => {
    const n = v.replace(/[₹$€£,\s%]/g, '').trim()
    return n !== '' && !isNaN(Number(n))
  }).length
  return numericCount / sample.length >= 0.8 ? 'REAL' : 'TEXT'
}

/**
 * Converts a raw string cell to the appropriate SQLite value.
 * Strips currency/formatting chars for REAL columns.
 */
function toSQLiteValue(raw: string, colType: ColType): number | string | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null
  if (colType === 'REAL') {
    const stripped = raw.replace(/[₹$€£,\s%]/g, '').trim()
    const n = Number(stripped)
    return isNaN(n) ? null : n
  }
  return raw
}

/**
 * Executes a SQL SELECT query over a CSV or XLSX file buffer.
 * - Parses the file to rows[]
 * - Auto-detects numeric columns and stores them as REAL (enables SUM/AVG/etc.)
 * - Loads all rows into an in-memory SQLite table named "data"
 * - Runs the query and returns a typed QueryResult
 */
export async function executeQueryOnFile(
  fileBuffer: Buffer,
  sql: string,
  _datasetId: string,
  fileType: 'csv' | 'xlsx',
  confirmedSchema?: SchemaColumn[]
): Promise<QueryResult> {
  // Build a lookup of dateFormat by column name from the confirmed schema
  const dateFormats: Record<string, string> = {}
  if (confirmedSchema) {
    for (const col of confirmedSchema) {
      if (col.inferredType === 'date' && col.dateFormat) {
        dateFormats[col.name] = col.dateFormat
      }
    }
  }
  let headers: string[] = []
  let rawRows: Record<string, string>[] = []

  // ── Parse file ──────────────────────────────────────────────────────────
  if (fileType === 'xlsx') {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    })
    if (data.length === 0) return { columns: [], rows: [], rowCount: 0, sql }
    headers = Object.keys(data[0])
    rawRows = data.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, String(v ?? '')])
      )
    ) as Record<string, string>[]
  } else {
    const csvText = fileBuffer.toString('utf8')
    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    })
    headers = result.meta.fields ?? []
    rawRows = result.data
  }

  if (headers.length === 0 || rawRows.length === 0) {
    return { columns: [], rows: [], rowCount: 0, sql }
  }

  // ── Detect column types ──────────────────────────────────────────────────
  const colTypes: Record<string, ColType> = {}
  for (const h of headers) {
    colTypes[h] = detectColType(rawRows.map((r) => r[h] ?? ''))
  }

  // ── Build in-memory SQLite DB ────────────────────────────────────────────
  const db = new Database(':memory:')

  try {
    // Create table — double-quote every column name to handle spaces, ₹, ()
    const colDefs = headers
      .map((h) => `"${h.replace(/"/g, '""')}" ${colTypes[h]}`)
      .join(', ')
    db.exec(`CREATE TABLE data (${colDefs})`)

    // Bulk insert inside a transaction for speed
    const placeholders = headers.map(() => '?').join(', ')
    const insertStmt = db.prepare(`INSERT INTO data VALUES (${placeholders})`)
    const insertAll = db.transaction((rows: Record<string, string>[]) => {
      for (const row of rows) {
        insertStmt.run(headers.map((h) => {
          const raw = row[h] ?? ''
          // Apply date normalisation before numeric conversion
          if (dateFormats[h]) return normaliseDateToISO(raw, dateFormats[h])
          return toSQLiteValue(raw, colTypes[h])
        }))
      }
    })
    insertAll(rawRows)

    // ── Execute query ──────────────────────────────────────────────────────
    let resultRows: Record<string, unknown>[]
    try {
      const stmt = db.prepare(sql)
      resultRows = stmt.all() as Record<string, unknown>[]
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`SQL execution failed: ${msg}. Query: ${sql.slice(0, 300)}`)
    }

    if (resultRows.length === 0) {
      // Still return correct column names when there are zero result rows
      const cols = db.prepare(sql).columns().map((c) => c.name)
      return formatResult(cols, [], sql)
    }

    const cols = Object.keys(resultRows[0])
    const rows = resultRows.map((row) => cols.map((c) => row[c]))
    return formatResult(cols, rows, sql)
  } finally {
    db.close()
  }
}
