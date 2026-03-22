import type { SurveyResponse } from '../types'

const PILLAR_KEYS = [
  'comp_benefits',
  'work_life_balance',
  'career_growth',
  'culture_values',
  'leadership',
  'work_environment',
  'dei',
  'wellbeing',
  'clinical_excellence',
  'mission_purpose',
]

// Pillar base scores (match pillars.ts)
const BASE_SCORES: Record<string, number> = {
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

// Dept modifiers (add to base score)
const DEPT_MODIFIERS: Record<string, Partial<Record<string, number>>> = {
  Nursing: { work_life_balance: -0.3, wellbeing: -0.2 },
  Management: { leadership: 0.3, comp_benefits: 0.2 },
  Clinical: { clinical_excellence: 0.2, mission_purpose: 0.1 },
}

const POSITIVE_TEMPLATES = [
  'Being part of a team that genuinely improves patient lives gives me immense satisfaction every day.',
  'The clinical training programmes here are exceptional — I have grown more in 12 months than in my previous three years.',
  'My colleagues are incredibly supportive and the sense of teamwork on the wards is something I genuinely value.',
  'Aster QCIL has a strong culture of clinical excellence that makes me proud to come to work.',
  'The mission of accessible, quality healthcare resonates deeply with why I chose this profession.',
  'Learning opportunities are abundant — the organisation actively encourages skill development and certifications.',
  'Senior leadership genuinely listens and acts on feedback. I feel my voice matters here.',
  'The DEI culture is real and visible — I feel respected and valued regardless of my background.',
  'Patient outcomes at Aster QCIL are something we all take pride in — it is a high-performance clinical environment.',
  'The camaraderie among the nursing team is outstanding. We support each other through challenging shifts.',
]

const IMPROVE_TEMPLATES = [
  'Shift scheduling needs urgent reform — consecutive night shifts with minimal recovery time are not sustainable.',
  'Compensation has not kept pace with market rates. A structured benchmarking exercise is overdue.',
  'Mental health support for frontline staff is inadequate. An Employee Assistance Programme should be a priority.',
  'Work-life balance for nursing staff is a serious concern. Protected days off and predictable rosters would help significantly.',
  'The pay increment cycle is too slow and lacks transparency — high performers feel underrewarded.',
  'Rest facilities for night shift staff need improvement — the current arrangements are not dignified.',
  'More structured career pathways for non-clinical support staff would improve engagement in those teams.',
  'Frontline manager training needs investment — the people management quality varies too widely across units.',
  'Burnout among nursing and pharmacy staff is visible and needs structural intervention, not just wellness campaigns.',
  'Better recognition programmes for clinical staff who go above and beyond would boost morale significantly.',
]

// Department distribution totalling 287
const DEPT_CONFIGS = [
  { dept: 'Clinical', count: 68, roles: ['Doctor', 'Lab Technician'] },
  { dept: 'Nursing', count: 82, roles: ['Nurse', 'Senior Nurse'] },
  { dept: 'Pharmacy', count: 31, roles: ['Pharmacist'] },
  { dept: 'Admin', count: 44, roles: ['HR Officer', 'Finance Officer', 'Admin Officer'] },
  { dept: 'Operations', count: 37, roles: ['Support Staff', 'Facilities Officer'] },
  { dept: 'Management', count: 25, roles: ['Manager', 'Director'] },
]

const LOCATIONS = ['Bangalore', 'Hyderabad', 'Kochi', 'Delhi NCR', 'Chennai']
// Approximate distribution [89, 74, 61, 38, 25] via cycling with weights
const LOCATION_SEQUENCE: string[] = []
{
  const counts = [89, 74, 61, 38, 25]
  LOCATIONS.forEach((loc, idx) => {
    for (let j = 0; j < counts[idx]; j++) {
      LOCATION_SEQUENCE.push(loc)
    }
  })
  // Interleave: sort by index so responses are spread across locations
  LOCATION_SEQUENCE.sort(() => 0) // keep insertion order (deterministic)
}

// Build a flat list of {dept, role} entries in department order
const RESPONSE_META: { dept: string; role: string }[] = []
for (const dc of DEPT_CONFIGS) {
  for (let j = 0; j < dc.count; j++) {
    const role = dc.roles[j % dc.roles.length]
    RESPONSE_META.push({ dept: dc.dept, role })
  }
}

// Base date: 2026-01-15, spread 60 days to 2026-03-15
const BASE_DATE_MS = new Date('2026-01-15').getTime()
const DAY_MS = 86400000

function generateScore(key: string, dept: string, i: number): number {
  const base = BASE_SCORES[key]
  const modifier = (DEPT_MODIFIERS[dept] ?? {})[key] ?? 0
  const variances = [-0.4, -0.2, 0, 0.2, 0.4]
  const variance = variances[i % 5]
  return Math.min(5, Math.max(1, Math.round((base + modifier + variance) * 10) / 10))
}

function generateEnps(i: number): number {
  const mod = i % 100
  if (mod < 58) return [9, 10][i % 2]
  if (mod < 76) return [7, 8][i % 2]
  return [2, 4, 5, 6][i % 4]
}

export const SURVEY_RESPONSES: SurveyResponse[] = RESPONSE_META.map(({ dept, role }, i) => {
  const scores: Record<string, number> = {}
  for (const key of PILLAR_KEYS) {
    scores[key] = generateScore(key, dept, i)
  }

  const dateMs = BASE_DATE_MS + (i % 60) * DAY_MS
  const date = new Date(dateMs).toISOString().split('T')[0]

  // Interleave locations: cycle through LOCATION_SEQUENCE by index
  const location = LOCATION_SEQUENCE[i % LOCATION_SEQUENCE.length]

  return {
    id: `SR-${String(i + 1).padStart(4, '0')}`,
    employeeId: `EMP-${String(1000 + i + 1)}`,
    department: dept,
    location,
    role,
    date,
    scores,
    enps: generateEnps(i),
    feedbackPositive: POSITIVE_TEMPLATES[i % POSITIVE_TEMPLATES.length],
    feedbackImprove: IMPROVE_TEMPLATES[i % IMPROVE_TEMPLATES.length],
  }
})
