import { describe, it, expect } from 'vitest'
import { inferColumnType, inferSchema } from './schema-inference'

describe('inferColumnType', () => {
  it('returns type=number, confidence=HIGH for pure numeric column', () => {
    const result = inferColumnType(['100', '200', '300'])
    expect(result.type).toBe('number')
    expect(result.confidence).toBe('HIGH')
  })

  it('returns type=string (not number) for values with leading zeros', () => {
    const result = inferColumnType(['01234', '02345', '03456'])
    expect(result.type).toBe('string')
  })

  it('returns type=number, confidence=LOW for mixed numeric/non-numeric column', () => {
    const result = inferColumnType(['100', 'abc', '200'])
    expect(result.type).toBe('number')
    expect(result.confidence).toBe('LOW')
  })

  it('returns type=string, confidence=LOW for all-null column', () => {
    const result = inferColumnType([null, null, null, ''])
    expect(result.type).toBe('string')
    expect(result.confidence).toBe('LOW')
  })

  it('returns type=date, confidence=HIGH for pure date column', () => {
    const result = inferColumnType(['2024-01-01', '2024-02-01', '2024-03-01'])
    expect(result.type).toBe('date')
    expect(result.confidence).toBe('HIGH')
  })

  it('returns type=boolean, confidence=HIGH for true/false column', () => {
    const result = inferColumnType(['true', 'false', 'true'])
    expect(result.type).toBe('boolean')
    expect(result.confidence).toBe('HIGH')
  })

  it('returns type=boolean, confidence=HIGH for yes/no column', () => {
    const result = inferColumnType(['yes', 'no', 'yes'])
    expect(result.type).toBe('boolean')
    expect(result.confidence).toBe('HIGH')
  })

  it('returns type=number after stripping currency symbols and commas', () => {
    const result = inferColumnType(['$1,234.00', '$5,678.00'])
    expect(result.type).toBe('number')
    expect(result.confidence).toBe('MEDIUM')
  })

  it('returns type=string, confidence=HIGH as default for unrecognized values', () => {
    const result = inferColumnType(['alice', 'bob', 'carol'])
    expect(result.type).toBe('string')
    expect(result.confidence).toBe('HIGH')
  })
})

describe('inferSchema', () => {
  it('returns correct SchemaColumn for each header', () => {
    const headers = ['name', 'age', 'zipcode']
    const rows = [
      ['Alice', '30', '01234'],
      ['Bob', '25', '02345'],
      ['Carol', '28', '03456'],
    ]
    const schema = inferSchema(headers, rows)

    expect(schema).toHaveLength(3)
    expect(schema[0].name).toBe('name')
    expect(schema[0].inferredType).toBe('string')

    expect(schema[1].name).toBe('age')
    expect(schema[1].inferredType).toBe('number')

    expect(schema[2].name).toBe('zipcode')
    expect(schema[2].inferredType).toBe('string')
  })

  it('populates sampleValues with first 5 non-null values', () => {
    const headers = ['val']
    const rows = [
      [''],
      ['a'],
      ['b'],
      ['c'],
      ['d'],
      ['e'],
      ['f'],
    ]
    const schema = inferSchema(headers, rows)
    expect(schema[0].sampleValues).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('computes nullRate as fraction of null/empty values', () => {
    const headers = ['val']
    const rows = [['a'], [''], ['b'], [''], ['c']]
    const schema = inferSchema(headers, rows)
    expect(schema[0].nullRate).toBeCloseTo(2 / 5)
  })

  it('handles all-null column with nullRate=1', () => {
    const headers = ['empty']
    const rows = [[''], [''], ['']]
    const schema = inferSchema(headers, rows)
    expect(schema[0].nullRate).toBe(1)
    expect(schema[0].inferredType).toBe('string')
    expect(schema[0].confidence).toBe('LOW')
  })

  it('samples first 200 rows by default', () => {
    const headers = ['n']
    const rows = Array.from({ length: 300 }, (_, i) => [String(i)])
    const schema = inferSchema(headers, rows)
    // Should still work correctly on large input
    expect(schema[0].inferredType).toBe('number')
  })
})
