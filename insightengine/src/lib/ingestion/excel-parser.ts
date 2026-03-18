import * as XLSX from 'xlsx'
import type { ColumnMeta } from '@/types/query'

/**
 * Parse an Excel Buffer into headers and rows from the first sheet.
 * All values are cast to strings.
 */
export function parseExcelBuffer(buffer: Buffer): ColumnMeta {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const firstSheetName = wb.SheetNames[0]

  if (!firstSheetName) {
    return { headers: [], rows: [] }
  }

  const sheet = wb.Sheets[firstSheetName]
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
  }) as unknown[][]

  if (!data || data.length === 0) {
    return { headers: [], rows: [] }
  }

  const [headerRow, ...dataRows] = data

  // Filter out rows that are entirely empty arrays
  const rawHeaders = headerRow as unknown[]
  const headers = rawHeaders.map((h) => String(h))

  // If all headers are empty strings, treat as empty
  if (headers.every((h) => h === '')) {
    return { headers: [], rows: [] }
  }

  const rows = dataRows.map((row) => {
    const typedRow = row as unknown[]
    return typedRow.map((cell) => String(cell))
  })

  return { headers, rows }
}
