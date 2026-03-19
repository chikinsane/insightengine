'use client'

const MAX_DISPLAY_ROWS = 100

interface TableViewProps {
  columns: { name: string; type: string }[]
  rows: Record<string, unknown>[]
  title?: string
}

function formatCell(value: unknown): { display: string; isNumeric: boolean } {
  if (value === null || value === undefined || value === '') return { display: '—', isNumeric: false }
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
      {title && <p className="text-white/80 text-sm font-semibold mb-4">{title}</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.07] shadow-xl">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#0d0d1e] to-[#0a0a18]">
              {columns.map((col) => (
                <th key={col.name}
                  className={[
                    'px-5 py-3.5 text-[10px] font-bold border-b border-white/[0.08] whitespace-nowrap tracking-widest uppercase',
                    numericCols.has(col.name)
                      ? 'text-right text-violet-400/70'
                      : 'text-left text-white/40',
                  ].join(' ')}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr key={rowIdx}
                className={[
                  'border-b border-white/[0.03] transition-colors',
                  rowIdx % 2 === 0 ? 'bg-[#08080f]' : 'bg-[#0a0a14]',
                  'hover:bg-violet-500/[0.04]',
                ].join(' ')}>
                {columns.map((col) => {
                  const { display, isNumeric } = formatCell(row[col.name])
                  return (
                    <td key={col.name}
                      title={display === '—' ? undefined : display}
                      className={[
                        'px-5 py-3 whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis',
                        isNumeric
                          ? 'text-right text-white/85 tabular-nums font-semibold'
                          : 'text-left text-white/60',
                      ].join(' ')}>
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex justify-between items-center px-1">
        {hasMore ? (
          <p className="text-[11px] text-amber-400/50">
            Showing first {MAX_DISPLAY_ROWS.toLocaleString()} of {rows.length.toLocaleString()} rows
          </p>
        ) : (
          <p className="text-[11px] text-white/25">
            {rows.length} row{rows.length !== 1 ? 's' : ''}
          </p>
        )}
        <p className="text-[11px] text-white/15">{columns.length} columns</p>
      </div>
    </div>
  )
}
