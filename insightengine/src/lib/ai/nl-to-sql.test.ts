import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the anthropic-client module
vi.mock('./anthropic-client', () => ({
  getAnthropicClient: vi.fn(),
}))

// Mock duckdb-client to avoid native module issues in tests
vi.mock('../query/duckdb-client', () => ({
  executeQueryOnFile: vi.fn(),
}))

import { generateSQL, executeWithRetry } from './nl-to-sql'
import { getAnthropicClient } from './anthropic-client'
import { executeQueryOnFile } from '../query/duckdb-client'
import type { SchemaColumn, QueryResult } from '@/types/query'

const mockColumns: SchemaColumn[] = [
  { name: 'name', inferredType: 'string', confidence: 'HIGH', sampleValues: ['Alice', 'Bob'], nullRate: 0 },
  { name: 'age', inferredType: 'number', confidence: 'HIGH', sampleValues: ['25', '30'], nullRate: 0 },
  { name: 'city', inferredType: 'string', confidence: 'HIGH', sampleValues: ['NYC', 'LA'], nullRate: 0 },
]

const mockQueryResult: QueryResult = {
  columns: [{ name: 'name', type: 'string' }, { name: 'age', type: 'number' }],
  rows: [{ name: 'Alice', age: 25 }],
  rowCount: 1,
  sql: 'SELECT name, age FROM data',
}

describe('generateSQL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sql and explanation from structured output', async () => {
    const mockParsedMessage = {
      parsed_output: {
        sql: 'SELECT name, age FROM data WHERE age > 25',
        explanation: 'Filter records where age is greater than 25',
        confidence: 'high',
      },
    }

    const mockClient = {
      messages: {
        parse: vi.fn().mockResolvedValue(mockParsedMessage),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getAnthropicClient>)

    const result = await generateSQL('Who is older than 25?', mockColumns, 100)

    expect(result.sql).toBe('SELECT name, age FROM data WHERE age > 25')
    expect(result.explanation).toBe('Filter records where age is greater than 25')
    expect(mockClient.messages.parse).toHaveBeenCalledOnce()
  })

  it('includes schema context in the messages passed to Anthropic', async () => {
    const mockParsedMessage = {
      parsed_output: {
        sql: 'SELECT * FROM data',
        explanation: 'Return all rows',
        confidence: 'high',
      },
    }

    const mockClient = {
      messages: {
        parse: vi.fn().mockResolvedValue(mockParsedMessage),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getAnthropicClient>)

    await generateSQL('Show me all data', mockColumns, 100)

    const callArgs = mockClient.messages.parse.mock.calls[0][0]
    const userMessage = callArgs.messages[0].content as string
    // Schema context should reference column names
    expect(userMessage).toMatch(/name/)
    expect(userMessage).toMatch(/age/)
  })

  it('includes correction context when previousError is provided', async () => {
    const mockParsedMessage = {
      parsed_output: {
        sql: 'SELECT name FROM data',
        explanation: 'Select name column',
        confidence: 'high',
      },
    }

    const mockClient = {
      messages: {
        parse: vi.fn().mockResolvedValue(mockParsedMessage),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getAnthropicClient>)

    await generateSQL('Show names', mockColumns, 100, 'Unknown columns: salary')

    const callArgs = mockClient.messages.parse.mock.calls[0][0]
    const userMessage = callArgs.messages[0].content as string
    expect(userMessage).toMatch(/salary/)
  })
})

describe('executeWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('succeeds on first attempt when SQL is valid', async () => {
    const mockParsedMessage = {
      parsed_output: {
        sql: 'SELECT name, age FROM data',
        explanation: 'Return name and age',
        confidence: 'high',
      },
    }

    const mockClient = {
      messages: {
        parse: vi.fn().mockResolvedValue(mockParsedMessage),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getAnthropicClient>)
    vi.mocked(executeQueryOnFile).mockResolvedValue(mockQueryResult)

    const result = await executeWithRetry(
      'Show me names and ages',
      mockColumns,
      100,
      Buffer.from('name,age\nAlice,25'),
      'dataset-1',
      'csv'
    )

    expect(result.sql).toBe('SELECT name, age FROM data')
    expect(result.result).toBe(mockQueryResult)
    expect(mockClient.messages.parse).toHaveBeenCalledOnce()
  })

  it('retries when DuckDB throws an error on first attempt, succeeds on second', async () => {
    const mockParsedMessage = {
      parsed_output: {
        sql: 'SELECT name, age FROM data',
        explanation: 'Return name and age',
        confidence: 'high',
      },
    }

    const mockClient = {
      messages: {
        parse: vi.fn().mockResolvedValue(mockParsedMessage),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getAnthropicClient>)

    // Fail first, succeed second
    vi.mocked(executeQueryOnFile)
      .mockRejectedValueOnce(new Error('column "salary" does not exist'))
      .mockResolvedValueOnce(mockQueryResult)

    const result = await executeWithRetry(
      'Show me salaries',
      mockColumns,
      100,
      Buffer.from('name,age\nAlice,25'),
      'dataset-1',
      'csv'
    )

    expect(result.result).toBe(mockQueryResult)
    expect(mockClient.messages.parse).toHaveBeenCalledTimes(2)
  })

  it('throws an error after 3 failed attempts', async () => {
    const mockParsedMessage = {
      parsed_output: {
        sql: 'SELECT invalid_col FROM data',
        explanation: 'Will fail',
        confidence: 'low',
      },
    }

    const mockClient = {
      messages: {
        parse: vi.fn().mockResolvedValue(mockParsedMessage),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getAnthropicClient>)
    vi.mocked(executeQueryOnFile).mockRejectedValue(new Error('column does not exist'))

    await expect(
      executeWithRetry(
        'Show bad query',
        mockColumns,
        100,
        Buffer.from('name,age\nAlice,25'),
        'dataset-1',
        'csv'
      )
    ).rejects.toThrow('Could not generate a valid query after 3 attempts')

    expect(mockClient.messages.parse).toHaveBeenCalledTimes(3)
  })
})
