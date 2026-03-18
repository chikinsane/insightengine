import type { QueryResult } from '@/types/query'

/**
 * Formats raw DuckDB column names and row arrays into a typed QueryResult.
 */
export function formatResult(
  rawColumns: string[],
  rawRows: unknown[][],
  sql = ''
): QueryResult {
  const columns = rawColumns.map((name) => ({ name, type: 'unknown' }))

  const rows: Record<string, unknown>[] = rawRows.map((row) => {
    const obj: Record<string, unknown> = {}
    rawColumns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return obj
  })

  return {
    columns,
    rows,
    rowCount: rows.length,
    sql,
  }
}

/**
 * Builds a statistical summary string from a QueryResult.
 * - Numeric columns: min, max, mean, count
 * - String columns: top-10 unique values + unique count
 * - Caps at 20 columns; appends "and N additional columns" if more exist
 */
export function buildStatSummary(result: QueryResult): string {
  const MAX_COLUMNS = 20
  const { columns, rows } = result

  const processedColumns = columns.slice(0, MAX_COLUMNS)
  const additionalCount = columns.length - MAX_COLUMNS

  const lines: string[] = []

  for (const col of processedColumns) {
    const values = rows.map((row) => row[col.name])
    const nonNullValues = values.filter(
      (v) => v !== null && v !== undefined && v !== ''
    )

    // Attempt numeric interpretation
    const numericValues = nonNullValues
      .map((v) => Number(v))
      .filter((n) => !isNaN(n))

    if (numericValues.length > 0 && numericValues.length === nonNullValues.length) {
      // Numeric column
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)
      const mean =
        numericValues.reduce((sum, n) => sum + n, 0) / numericValues.length
      lines.push(
        `${col.name} (numeric): min=${min}, max=${max}, mean=${mean.toFixed(2)}, count=${numericValues.length}`
      )
    } else {
      // String / categorical column
      const stringValues = nonNullValues.map((v) => String(v))
      const uniqueValues = [...new Set(stringValues)]
      const topValues = uniqueValues.slice(0, 10)
      lines.push(
        `${col.name} (string): unique=${uniqueValues.length}, top values: [${topValues.join(', ')}]`
      )
    }
  }

  if (additionalCount > 0) {
    lines.push(`...and ${additionalCount} additional columns`)
  }

  return lines.join('\n')
}
