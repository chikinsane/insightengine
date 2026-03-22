import { useState } from 'react'
import { SURVEY_RESPONSES } from '../data/surveyResponses'
import type { SurveyResponse } from '../types'

export function useSurveyData() {
  const [uploaded, setUploaded] = useState<SurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem('evp_uploaded_responses')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [formResponses, setFormResponses] = useState<SurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem('evp_form_responses')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const addUploaded = (responses: SurveyResponse[]) => {
    const next = [...uploaded, ...responses]
    setUploaded(next)
    localStorage.setItem('evp_uploaded_responses', JSON.stringify(next))
  }
  const addFormResponse = (r: SurveyResponse) => {
    const next = [...formResponses, r]
    setFormResponses(next)
    localStorage.setItem('evp_form_responses', JSON.stringify(next))
  }
  return {
    all: [...SURVEY_RESPONSES, ...uploaded, ...formResponses],
    synthetic: SURVEY_RESPONSES,
    uploaded,
    formResponses,
    addUploaded,
    addFormResponse,
  }
}
