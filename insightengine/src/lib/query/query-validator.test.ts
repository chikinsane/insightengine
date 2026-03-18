import { describe, it, expect } from 'vitest'
import { validateSQL, validateColumnReferences } from './query-validator'

describe('validateSQL', () => {
  // Valid cases
  it('accepts a basic SELECT statement', () => {
    const result = validateSQL('SELECT * FROM data')
    expect(result.valid).toBe(true)
  })

  it('accepts a WITH...SELECT (CTE) statement', () => {
    const result = validateSQL('WITH cte AS (SELECT * FROM data) SELECT * FROM cte')
    expect(result.valid).toBe(true)
  })

  it('accepts SELECT with WHERE clause', () => {
    const result = validateSQL('SELECT name, age FROM data WHERE age > 30')
    expect(result.valid).toBe(true)
  })

  // DML rejection cases
  it('rejects DROP TABLE', () => {
    const result = validateSQL('DROP TABLE data')
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/disallowed/i)
  })

  it('rejects INSERT statement', () => {
    const result = validateSQL('INSERT INTO data VALUES (1)')
    expect(result.valid).toBe(false)
  })

  it('rejects DELETE statement', () => {
    const result = validateSQL('DELETE FROM data')
    expect(result.valid).toBe(false)
  })

  it('rejects UPDATE statement', () => {
    const result = validateSQL('UPDATE data SET x=1')
    expect(result.valid).toBe(false)
  })

  it('rejects CREATE statement', () => {
    const result = validateSQL('CREATE TABLE x (id int)')
    expect(result.valid).toBe(false)
  })

  it('rejects ALTER statement', () => {
    const result = validateSQL('ALTER TABLE data ADD COLUMN x int')
    expect(result.valid).toBe(false)
  })

  it('rejects TRUNCATE statement', () => {
    const result = validateSQL('TRUNCATE data')
    expect(result.valid).toBe(false)
  })

  it('rejects GRANT statement', () => {
    const result = validateSQL('GRANT ALL ON data TO public')
    expect(result.valid).toBe(false)
  })

  it('rejects REVOKE statement', () => {
    const result = validateSQL('REVOKE SELECT ON data FROM public')
    expect(result.valid).toBe(false)
  })

  it('rejects EXEC statement', () => {
    const result = validateSQL('EXEC sp_helpdb')
    expect(result.valid).toBe(false)
  })

  it('rejects empty string', () => {
    const result = validateSQL('')
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/SELECT/i)
  })

  it('rejects whitespace-only string', () => {
    const result = validateSQL('   ')
    expect(result.valid).toBe(false)
  })

  it('is case-insensitive for DML keywords', () => {
    expect(validateSQL('drop table data').valid).toBe(false)
    expect(validateSQL('Delete FROM data').valid).toBe(false)
    expect(validateSQL('insert into data values (1)').valid).toBe(false)
  })
})

describe('validateColumnReferences', () => {
  it('returns valid when all referenced columns exist', () => {
    const result = validateColumnReferences(
      'SELECT name, age FROM data WHERE age > 30',
      ['name', 'age', 'city']
    )
    expect(result.valid).toBe(true)
  })

  it('returns invalid with unknown columns listed', () => {
    const result = validateColumnReferences(
      'SELECT name, salary FROM data',
      ['name', 'age']
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('salary')
    expect(result.reason).toMatch(/Unknown columns/i)
  })
})
