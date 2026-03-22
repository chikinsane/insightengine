import { describe, it, expect } from 'vitest'
import { validateCSVHeaders, parseCSVRow } from './csvParser'

const REQUIRED_HEADERS = ['employee_id','department','location','role','comp_benefits','work_life_balance','career_growth','culture_values','leadership','work_environment','dei','wellbeing','clinical_excellence','mission_purpose','enps','feedback_positive','feedback_improve']

describe('validateCSVHeaders', () => {
  it('returns valid for correct headers', () => {
    expect(validateCSVHeaders(REQUIRED_HEADERS)).toEqual({ valid: true, missing: [] })
  })
  it('returns missing headers', () => {
    const result = validateCSVHeaders(['employee_id', 'department'])
    expect(result.valid).toBe(false)
    expect(result.missing.length).toBeGreaterThan(0)
  })
})

describe('parseCSVRow', () => {
  it('parses a valid row', () => {
    const row = {
      employee_id: 'E001', department: 'Nursing', location: 'Bangalore',
      role: 'Nurse', comp_benefits: '3', work_life_balance: '2',
      career_growth: '4', culture_values: '4', leadership: '3',
      work_environment: '4', dei: '4', wellbeing: '3',
      clinical_excellence: '5', mission_purpose: '5', enps: '8',
      feedback_positive: 'Great team', feedback_improve: 'Better shifts'
    }
    const result = parseCSVRow(row)
    expect(result.valid).toBe(true)
    expect(result.data?.scores.comp_benefits).toBe(3)
    expect(result.data?.enps).toBe(8)
  })
  it('rejects scores out of range', () => {
    const row = {
      employee_id: 'E002', department: 'Admin', location: 'Kochi',
      role: 'HR Officer', comp_benefits: '6', work_life_balance: '3',
      career_growth: '3', culture_values: '3', leadership: '3',
      work_environment: '3', dei: '3', wellbeing: '3',
      clinical_excellence: '3', mission_purpose: '3', enps: '5',
      feedback_positive: '', feedback_improve: ''
    }
    expect(parseCSVRow(row).valid).toBe(false)
  })
  it('rejects invalid enps', () => {
    const row = {
      employee_id: 'E003', department: 'Nursing', location: 'Hyderabad',
      role: 'Nurse', comp_benefits: '3', work_life_balance: '3',
      career_growth: '3', culture_values: '3', leadership: '3',
      work_environment: '3', dei: '3', wellbeing: '3',
      clinical_excellence: '3', mission_purpose: '3', enps: '11',
      feedback_positive: '', feedback_improve: ''
    }
    expect(parseCSVRow(row).valid).toBe(false)
  })
})
