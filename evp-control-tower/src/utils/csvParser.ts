import * as XLSX from 'xlsx'
import type { SurveyResponse } from '../types'

const PILLAR_KEYS = ['comp_benefits','work_life_balance','career_growth','culture_values','leadership','work_environment','dei','wellbeing','clinical_excellence','mission_purpose']
const REQUIRED_HEADERS = ['employee_id','department','location','role',...PILLAR_KEYS,'enps','feedback_positive','feedback_improve']

export function validateCSVHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h))
  return { valid: missing.length === 0, missing }
}

export function parseCSVRow(row: Record<string, string>): { valid: boolean; error?: string; data?: SurveyResponse } {
  const scores: Record<string, number> = {}
  for (const key of PILLAR_KEYS) {
    const val = parseFloat(row[key])
    if (isNaN(val) || val < 1 || val > 5) {
      return { valid: false, error: `Invalid value for ${key}: "${row[key]}" (must be 1–5)` }
    }
    scores[key] = val
  }
  const enps = parseInt(row.enps)
  if (isNaN(enps) || enps < 0 || enps > 10) {
    return { valid: false, error: `Invalid eNPS: "${row.enps}" (must be 0–10)` }
  }
  return {
    valid: true,
    data: {
      id: `upload-${row.employee_id}-${Date.now()}`,
      employeeId: row.employee_id,
      department: row.department,
      location: row.location,
      role: row.role,
      date: new Date().toISOString().split('T')[0],
      scores,
      enps,
      feedbackPositive: row.feedback_positive || '',
      feedbackImprove: row.feedback_improve || '',
    }
  }
}

export async function parseCSVFile(file: File): Promise<{
  processed: SurveyResponse[];
  skipped: { row: number; error: string }[]
}> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false })

  if (rows.length === 0) return { processed: [], skipped: [] }

  const headers = Object.keys(rows[0])
  const { valid, missing } = validateCSVHeaders(headers)
  if (!valid) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`)
  }

  const processed: SurveyResponse[] = []
  const skipped: { row: number; error: string }[] = []

  rows.forEach((row, idx) => {
    const result = parseCSVRow(row)
    if (result.valid && result.data) {
      processed.push(result.data)
    } else {
      skipped.push({ row: idx + 2, error: result.error || 'Unknown error' })
    }
  })

  return { processed, skipped }
}
