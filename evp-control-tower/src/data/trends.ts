import type { TrendPoint } from '../types'

// 15 monthly data points: Jan 2025 → Mar 2026
// Overall score arc: 68.0 → 74.0 (smooth rise)
// Per-pillar: start 0.2–0.3 below final value, trend up
// Exceptions: work_life_balance and wellbeing improve only +0.1 over 15 months

const MONTHS: { month: string; period: string }[] = [
  { month: 'Jan 2025', period: 'Q1 2025' },
  { month: 'Feb 2025', period: 'Q1 2025' },
  { month: 'Mar 2025', period: 'Q1 2025' },
  { month: 'Apr 2025', period: 'Q2 2025' },
  { month: 'May 2025', period: 'Q2 2025' },
  { month: 'Jun 2025', period: 'Q2 2025' },
  { month: 'Jul 2025', period: 'Q3 2025' },
  { month: 'Aug 2025', period: 'Q3 2025' },
  { month: 'Sep 2025', period: 'Q3 2025' },
  { month: 'Oct 2025', period: 'Q4 2025' },
  { month: 'Nov 2025', period: 'Q4 2025' },
  { month: 'Dec 2025', period: 'Q4 2025' },
  { month: 'Jan 2026', period: 'Q1 2026' },
  { month: 'Feb 2026', period: 'Q1 2026' },
  { month: 'Mar 2026', period: 'Q1 2026' },
]

// Final pillar scores (from pillars.ts internal scores)
const FINAL_SCORES: Record<string, number> = {
  comp_benefits: 3.4,
  work_life_balance: 3.1,
  career_growth: 4.0,
  culture_values: 4.3,
  leadership: 3.7,
  work_environment: 3.9,
  dei: 4.1,
  wellbeing: 3.2,
  clinical_excellence: 4.5,
  mission_purpose: 4.6,
}

// Starting deltas (how much below final the pillar starts)
// work_life_balance and wellbeing: only +0.1 improvement
// Others: +0.2 to +0.3 improvement
const START_DELTAS: Record<string, number> = {
  comp_benefits: -0.3,
  work_life_balance: -0.1,
  career_growth: -0.25,
  culture_values: -0.2,
  leadership: -0.25,
  work_environment: -0.2,
  dei: -0.25,
  wellbeing: -0.1,
  clinical_excellence: -0.2,
  mission_purpose: -0.2,
}

const PILLAR_KEYS = Object.keys(FINAL_SCORES)
const N = MONTHS.length // 15

export const TREND_DATA: TrendPoint[] = MONTHS.map(({ month, period }, i) => {
  // Linear interpolation factor: 0 at i=0, 1 at i=N-1
  const t = i / (N - 1)

  const pillarScores: Record<string, number> = {}
  for (const key of PILLAR_KEYS) {
    const startScore = FINAL_SCORES[key] + START_DELTAS[key]
    const rawScore = startScore + (FINAL_SCORES[key] - startScore) * t
    pillarScores[key] = Math.round(rawScore * 10) / 10
  }

  // Overall score: linear 68.0 → 74.0
  const overallScore = Math.round((68.0 + (74.0 - 68.0) * t) * 10) / 10

  return { period, month, overallScore, pillarScores }
})

export const TREND_ANNOTATIONS: { month: string; label: string }[] = [
  { month: 'Apr 2025', label: 'EVP Survey launched' },
  { month: 'Sep 2025', label: 'Wellbeing policy updated' },
]
