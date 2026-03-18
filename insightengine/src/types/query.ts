export type VizType = 'bar' | 'line' | 'pie' | 'scatter' | 'table'
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface SchemaColumn {
  name: string
  inferredType: 'string' | 'number' | 'date' | 'boolean'
  confidence: ConfidenceLevel
  sampleValues: string[]
  nullRate: number
}

export interface ColumnMeta {
  headers: string[]
  rows: string[][]
}

export interface QueryResult {
  columns: { name: string; type: string }[]
  rows: Record<string, unknown>[]
  rowCount: number
  sql: string
}

export interface EnrichmentResult {
  insight: string
  vizType: VizType
  followUpQuestions: string[]
  chartConfig: {
    xKey: string
    /** All numeric output columns — first is primary, rest are secondary series */
    yKeys: string[]
    title: string
  }
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}
