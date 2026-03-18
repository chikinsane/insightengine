import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseExcelBuffer } from './excel-parser'

function makeExcelBuffer(data: unknown[][]): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

describe('parseExcelBuffer', () => {
  it('parses an Excel buffer with headers and rows', () => {
    const buffer = makeExcelBuffer([
      ['name', 'age'],
      ['Alice', 30],
      ['Bob', 25],
    ])
    const result = parseExcelBuffer(buffer)

    expect(result.headers).toEqual(['name', 'age'])
    expect(result.rows[0]).toEqual(['Alice', '30'])
    expect(result.rows[1]).toEqual(['Bob', '25'])
  })

  it('returns empty headers and rows for an empty workbook', () => {
    const buffer = makeExcelBuffer([[]])
    const result = parseExcelBuffer(buffer)
    // Empty first row means no headers
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })

  it('handles single column Excel data', () => {
    const buffer = makeExcelBuffer([['score'], [100], [200], [300]])
    const result = parseExcelBuffer(buffer)
    expect(result.headers).toEqual(['score'])
    expect(result.rows).toEqual([['100'], ['200'], ['300']])
  })

  it('casts all header values to string', () => {
    const buffer = makeExcelBuffer([[1, 2, 3], [10, 20, 30]])
    const result = parseExcelBuffer(buffer)
    expect(result.headers).toEqual(['1', '2', '3'])
  })
})
