import { describe, it, expect } from 'vitest'
import { parseCSVBuffer } from './csv-parser'

describe('parseCSVBuffer', () => {
  it('parses a basic CSV buffer into headers and rows', async () => {
    const csv = 'name,age\nAlice,30\nBob,25'
    const buffer = Buffer.from(csv)
    const result = await parseCSVBuffer(buffer)

    expect(result.headers).toEqual(['name', 'age'])
    expect(result.rows).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('returns empty headers and rows for an empty buffer', async () => {
    const result = await parseCSVBuffer(Buffer.from(''))
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })

  it('handles single-column CSV', async () => {
    const csv = 'id\n1\n2\n3'
    const result = await parseCSVBuffer(Buffer.from(csv))
    expect(result.headers).toEqual(['id'])
    expect(result.rows).toEqual([['1'], ['2'], ['3']])
  })

  it('preserves leading zeros as strings (dynamicTyping: false)', async () => {
    const csv = 'zipcode\n01234\n02345'
    const result = await parseCSVBuffer(Buffer.from(csv))
    expect(result.headers).toEqual(['zipcode'])
    expect(result.rows[0][0]).toBe('01234')
    expect(result.rows[1][0]).toBe('02345')
  })
})
