import type { SurveyResponse, RAGStatus } from '../types'

const PILLAR_KEYS = ['comp_benefits','work_life_balance','career_growth','culture_values','leadership','work_environment','dei','wellbeing','clinical_excellence','mission_purpose']

export function calcENPS(scores: number[]): number {
  if (!scores.length) return 0
  const promoters = scores.filter(s => s >= 9).length
  const detractors = scores.filter(s => s <= 6).length
  return Math.round(((promoters - detractors) / scores.length) * 100)
}

export function calcPillarAvg(responses: SurveyResponse[], pillarKey: string): number {
  const vals = responses.map(r => r.scores[pillarKey]).filter(v => v !== undefined && v !== null)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function calcOverallScore(avg1to5: number): number {
  return Math.round(((avg1to5 - 1) / 4) * 100)
}

export function getRAGStatus(score: number): RAGStatus {
  if (score < 3.3) return 'red'
  if (score <= 3.7) return 'amber'
  return 'green'
}

export function calcCompletionRate(responses: SurveyResponse[]): number {
  if (!responses.length) return 0
  const complete = responses.filter(r =>
    PILLAR_KEYS.every(k => r.scores[k] !== undefined) && r.enps !== undefined
  ).length
  return Math.round((complete / responses.length) * 100)
}
