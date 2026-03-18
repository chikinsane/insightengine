import Papa from 'papaparse'
import type { ColumnMeta } from '@/types/query'

/**
 * Parse a CSV Buffer into headers and rows.
 * All values are returned as strings (dynamicTyping: false).
 */
export async function parseCSVBuffer(buffer: Buffer): Promise<ColumnMeta> {
  const text = buffer.toString('utf-8').trim()

  if (!text) {
    return { headers: [], rows: [] }
  }

  return new Promise((resolve, reject) => {
    const allRows: string[][] = []

    Papa.parse<string[]>(text, {
      dynamicTyping: false,
      skipEmptyLines: true,
      complete(results) {
        if (!results.data || results.data.length === 0) {
          resolve({ headers: [], rows: [] })
          return
        }
        const [headerRow, ...dataRows] = results.data
        const headers = headerRow.map(String)
        const rows = dataRows.map((row) => row.map(String))
        resolve({ headers, rows })
      },
      error(err: Error) {
        reject(err)
      },
    })
  })
}
