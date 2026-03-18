import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the anthropic-client module
vi.mock('./anthropic-client', () => ({
  getAnthropicClient: vi.fn(),
}))

import {
  generateInsight,
  generateFollowUps,
  applyVizGuardrails,
  runParallelEnrichment,
} from './enrichment'
import { getAnthropicClient } from './anthropic-client'
import type { QueryResult, VizType } from '@/types/query'

function makeResult(columns: { name: string; type: string }[], rows: Record<string, unknown>[]): QueryResult {
  return { columns, rows, rowCount: rows.length, sql: 'SELECT * FROM data' }
}

describe('generateInsight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Claude with stat summary (not raw rows), returns insight string', async () => {
    const mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'The average age is 28.' }],
        }),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as ReturnType<typeof getAnthropicClient>)

    const statSummary = 'age (numeric): min=20, max=35, mean=28.00, count=5'
    const insight = await generateInsight(statSummary, 'What is the average age?')

    expect(insight).toBe('The average age is 28.')

    // Verify stat summary was sent, not raw rows
    const callArgs = mockClient.messages.create.mock.calls[0][0]
    const userContent = callArgs.messages[0].content as string
    expect(userContent).toMatch(/min=20/)
    expect(userContent).not.toMatch(/\[.*{.*}.*\]/) // not raw row objects
  })
})

describe('generateFollowUps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns exactly 3 follow-up question strings', async () => {
    const mockClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify([
              'Which city has the highest average age?',
              'What is the age distribution?',
              'Are there any outliers in age?',
            ]),
          }],
        }),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as ReturnType<typeof getAnthropicClient>)

    const followUps = await generateFollowUps('age stats summary', 'average age query')

    expect(Array.isArray(followUps)).toBe(true)
    expect(followUps).toHaveLength(3)
    followUps.forEach((q) => expect(typeof q).toBe('string'))
  })
})

describe('applyVizGuardrails (pure function)', () => {
  it('forces "line" when result has 1 date column + 1 numeric column', () => {
    const result = makeResult(
      [{ name: 'created_at', type: 'date' }, { name: 'revenue', type: 'number' }],
      [{ created_at: '2024-01-01', revenue: 1000 }, { created_at: '2024-02-01', revenue: 1200 }]
    )
    expect(applyVizGuardrails('bar', result)).toBe('line')
  })

  it('forces "table" when category column has >8 unique values', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ category: `cat${i}`, value: i }))
    const result = makeResult(
      [{ name: 'category', type: 'string' }, { name: 'value', type: 'number' }],
      rows
    )
    expect(applyVizGuardrails('bar', result)).toBe('table')
  })

  it('forces "scatter" when result has 2 numeric columns and no category column', () => {
    const result = makeResult(
      [{ name: 'height', type: 'number' }, { name: 'weight', type: 'number' }],
      [{ height: 170, weight: 65 }, { height: 180, weight: 75 }]
    )
    expect(applyVizGuardrails('bar', result)).toBe('scatter')
  })

  it('forces "pie" when numeric values sum to approximately 100', () => {
    const result = makeResult(
      [{ name: 'segment', type: 'string' }, { name: 'pct', type: 'number' }],
      [
        { segment: 'A', pct: 40 },
        { segment: 'B', pct: 35 },
        { segment: 'C', pct: 25 },
      ]
    )
    expect(applyVizGuardrails('bar', result)).toBe('pie')
  })

  it('returns "bar" for few categories + 1 numeric column', () => {
    const result = makeResult(
      [{ name: 'region', type: 'string' }, { name: 'sales', type: 'number' }],
      [
        { region: 'North', sales: 100 },
        { region: 'South', sales: 200 },
        { region: 'East', sales: 150 },
      ]
    )
    expect(applyVizGuardrails('pie', result)).toBe('bar')
  })

  it('defaults to "table" when no specific rule matches', () => {
    const result = makeResult(
      [{ name: 'name', type: 'string' }],
      [{ name: 'Alice' }, { name: 'Bob' }]
    )
    expect(applyVizGuardrails('line', result)).toBe('table')
  })
})

describe('runParallelEnrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls all 3 enrichment functions in parallel and returns EnrichmentResult', async () => {
    const mockClient = {
      messages: {
        create: vi.fn()
          .mockResolvedValueOnce({
            // generateInsight response
            content: [{ type: 'text', text: 'Sales peaked in Q3.' }],
          })
          .mockResolvedValueOnce({
            // selectVizType response
            content: [{ type: 'text', text: 'bar' }],
          })
          .mockResolvedValueOnce({
            // generateFollowUps response
            content: [{ type: 'text', text: JSON.stringify(['Q1 vs Q2?', 'What caused peak?', 'YoY trend?']) }],
          }),
      },
    }
    vi.mocked(getAnthropicClient).mockReturnValue(mockClient as ReturnType<typeof getAnthropicClient>)

    const result = makeResult(
      [{ name: 'quarter', type: 'string' }, { name: 'sales', type: 'number' }],
      [{ quarter: 'Q1', sales: 100 }, { quarter: 'Q2', sales: 200 }, { quarter: 'Q3', sales: 350 }]
    )

    const enrichment = await runParallelEnrichment(result, 'What are quarterly sales?')

    expect(enrichment.insight).toBeTruthy()
    expect(typeof enrichment.insight).toBe('string')
    expect(enrichment.followUpQuestions).toHaveLength(3)
    expect(['bar', 'line', 'pie', 'scatter', 'table']).toContain(enrichment.vizType)
    // chartConfig should have keys
    expect(enrichment.chartConfig).toHaveProperty('xKey')
    expect(enrichment.chartConfig).toHaveProperty('yKey')
    expect(enrichment.chartConfig).toHaveProperty('title')
  })
})
