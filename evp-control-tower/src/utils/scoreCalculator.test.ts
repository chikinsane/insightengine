import { describe, it, expect } from 'vitest'
import { calcENPS, calcPillarAvg, calcOverallScore, getRAGStatus, calcCompletionRate } from './scoreCalculator'

describe('calcENPS', () => {
  it('returns correct eNPS from array of 0-10 scores', () => {
    // 2 promoters (9,10), 1 passive (7), 1 detractor (3) → (50% - 25%) * 100 = 25
    expect(calcENPS([9, 10, 7, 3])).toBe(25)
  })
  it('handles all promoters', () => {
    expect(calcENPS([9, 9, 10])).toBe(100)
  })
  it('returns 0 for empty array', () => {
    expect(calcENPS([])).toBe(0)
  })
})

describe('calcPillarAvg', () => {
  it('averages pillar scores from responses', () => {
    const responses = [
      { scores: { comp_benefits: 4, wlb: 3 } },
      { scores: { comp_benefits: 2, wlb: 5 } },
    ] as any
    expect(calcPillarAvg(responses, 'comp_benefits')).toBeCloseTo(3)
  })
  it('returns 0 for empty responses', () => {
    expect(calcPillarAvg([], 'comp_benefits')).toBe(0)
  })
})

describe('calcOverallScore', () => {
  it('converts 1-5 avg to 0-100 score', () => {
    // (3.7 - 1) / 4 * 100 = 67.5 → rounds to 68
    expect(calcOverallScore(3.7)).toBe(68)
  })
  it('returns 100 for max score 5', () => {
    expect(calcOverallScore(5)).toBe(100)
  })
  it('returns 0 for min score 1', () => {
    expect(calcOverallScore(1)).toBe(0)
  })
})

describe('getRAGStatus', () => {
  it('returns red for scores below 3.3', () => {
    expect(getRAGStatus(3.1)).toBe('red')
  })
  it('returns amber for 3.3-3.7', () => {
    expect(getRAGStatus(3.5)).toBe('amber')
  })
  it('returns green for above 3.7', () => {
    expect(getRAGStatus(4.0)).toBe('green')
  })
})

describe('calcCompletionRate', () => {
  it('returns 100 for all complete responses', () => {
    const r = { scores: { comp_benefits:4, work_life_balance:3, career_growth:4, culture_values:4, leadership:3, work_environment:4, dei:4, wellbeing:3, clinical_excellence:5, mission_purpose:5 }, enps: 8 } as any
    expect(calcCompletionRate([r, r])).toBe(100)
  })
  it('returns 0 for empty array', () => {
    expect(calcCompletionRate([])).toBe(0)
  })
})
