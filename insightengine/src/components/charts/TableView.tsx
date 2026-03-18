'use client'

const MAX_DISPLAY_ROWS = 100

interface TableViewProps {
  columns: { name: string; type: string }[]
  rows: Record<string, unknown>[]
  title?: string
}

/** Format a cell value: numbers get Indian locale (1,23,456) with 2dp */
function formatCell(value: unknown): { display: string; isNumeric: boolean } {
  if (value === null || value === undefined || value === '') {
    return { display: '—', isNumeric: false }
  }
  const n = Number(value)
  if (!isNaN(n) && String(value).trim() !== '') {
    return {
      display: n.toLocaleString('en-IN', {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2,
      }),
      isNumeric: true,
    }
  }
  return { display: String(value), isNumeric: false }
}

export function TableView({ columns, rows, title }: TableViewProps) {
  const displayRows = rows.slice(0, MAX_DISPLAY_ROWS)
  const hasMore = rows.length > MAX_DISPLAY_ROWS

  // Detect which columns are numeric by sampling first row
  const numericCols = new Set(
    columns
      .filter((col) => {
        const v = rows[0]?.[col.name]
        return v !== null && v !== undefined && !isNaN(Number(v)) && String(v).trim() !== ''
      })
      .map((c) => c.name)
  )

  return (
    <div className="w-full">
      {title && <p className="text-white/70 text-sm font-medium mb-3">{title}</p>}

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#0a0a14]">
              {columns.map((col) => (
                <th key={col.name}
                  className={`px-4 py-3 text-[10px] font-semibold border-b border-white/[0.06] whitespace-nowrap tracking-wider uppercase
                    ${numericCols.has(col.name) ? 'text-right text-violet-300/50' : 'text-left text-white/40'}`}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr key={rowIdx}
                className="border-b border-white/[0.03] hover:bg-white/[0.025] transition-colors">
                {columns.map((col) => {
                  const { display, isNumeric } = formatCell(row[col.name])
                  return (
                    <td key={col.name}
                      title={display === '—' ? undefined : display}
                      className={`px-4 py-2.5 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis
                        ${isNumeric
                          ? 'text-right text-white/80 tabular-nums font-medium'
                          : 'text-left text-white/60'}`}>
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex justify-between items-center">
        {hasMore ? (
          <p className="text-[11px] text-white/25">
            Showing first {MAX_DISPLAY_ROWS} of {rows.length.toLocaleString()} rows
          </p>
        ) : (
          <p className="text-[11px] text-white/20">
            {rows.length} row{rows.length !== 1 ? 's' : ''}
          </p>
        )}
        <p className="text-[11px] text-white/15">{columns.length} columns</p>
      </div>
    </div>
  )
}
