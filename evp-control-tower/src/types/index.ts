export interface OrgConfig {
  name: string
  country: string
  industry: string
  logoInitials: string
}

export interface Pillar {
  id: number
  key: string
  label: string
  internalScore: number
  externalScore: number
  status: 'top-strength' | 'strength' | 'mixed' | 'gap' | 'critical'
  expertOpinion: string
  positiveThemes: string[]
  negativeThemes: string[]
  quotes: { text: string; source: 'internal' | 'external'; sentiment: 'positive' | 'negative' }[]
}

export interface SurveyResponse {
  id: string
  employeeId: string
  department: string
  location: string
  role: string
  date: string
  scores: Record<string, number>  // pillar key → 1-5
  enps: number                     // 0-10
  feedbackPositive: string
  feedbackImprove: string
}

export interface ExternalPlatform {
  id: string
  name: string
  logo: string
  starScore: number | null
  sentimentPositive: number
  sentimentNeutral: number
  sentimentNegative: number
  reviewCount: number
  url: string
  topThemes: string[]
  reviews: { text: string; rating: number | null; sentiment: 'positive' | 'negative'; date: string }[]
}

export interface TrendPoint {
  period: string      // e.g. "Q1 2025"
  month: string       // e.g. "Jan 2025"
  overallScore: number
  pillarScores: Record<string, number>
}

export type RAGStatus = 'red' | 'amber' | 'green'

export interface ExportConfig {
  org: OrgConfig
  pillars: Pillar[]
  enps: number
  overallScore: number
  responseCount: number
  includedPillarIds: number[]
  format: 'pdf' | 'pptx' | 'both'
  dateRange: string
}
