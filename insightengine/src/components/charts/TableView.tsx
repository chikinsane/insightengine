'use client'

const MAX_DISPLAY_ROWS = 100

interface TableViewProps {
  columns: { name: string; type: string }[]
  rows: Record<string, unknown>[]
  title?: string
}

export function TableView({ columns, rows, title }: TableViewProps) {
  const displayRows = rows.slice(0, MAX_DISPLAY_ROWS)
  const hasMore = rows.length > MAX_DISPLAY_ROWS

  return (
    <div className="w-full">
      {title && (
        <p className="text-white/80 text-sm font-medium mb-4">{title}</p>
      )}

      {/* Scrollable container for wide tables */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#0f0f1a]">
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-4 py-3 text-left text-white/50 font-medium border-b border-white/[0.06] whitespace-nowrap tracking-wide uppercase text-[10px]"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => {
                  const value = row[col.name]
                  const displayValue =
                    value === null || value === undefined
                      ? '—'
                      : String(value)

                  return (
                    <td
                      key={col.name}
                      className="px-4 py-2.5 text-white/70 whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis"
                      title={displayValue}
                    >
                      {displayValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      {hasMore && (
        <p className="mt-2 text-xs text-white/25 text-right">
          Showing {MAX_DISPLAY_ROWS} of {rows.length} rows
        </p>
      )}
      {!hasMore && rows.length > 0 && (
        <p className="mt-2 text-xs text-white/20 text-right">
          {rows.length} row{rows.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
