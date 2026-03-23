import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { usePillars } from '../hooks/usePillars'
import { useSurveyData } from '../hooks/useSurveyData'
import type { SurveyResponse } from '../types'

export default function SurveyForm() {
  const params = useParams<{ id: string }>()
  const PILLARS = usePillars()
  const surveyData = useSurveyData()

  const [section, setSection] = useState(1)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [enps, setEnps] = useState<number | null>(null)
  const [feedbackPositive, setFeedbackPositive] = useState('')
  const [feedbackImprove, setFeedbackImprove] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!params.id) return
    const response: SurveyResponse = {
      id: `form-${Date.now()}`,
      employeeId: `anon-${Date.now()}`,
      department: 'Unknown',
      location: 'Unknown',
      role: 'Employee',
      date: new Date().toISOString().split('T')[0],
      scores,
      enps: enps!,
      feedbackPositive,
      feedbackImprove,
    }
    surveyData.addFormResponse(response)
    setSubmitted(true)
  }

  // Section 1 is complete when all pillars have a score
  const section1Complete = PILLARS.every(p => scores[p.key] && scores[p.key] > 0)

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white dark:from-slate-900 dark:to-slate-800 py-10 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={36} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Thank You!</h2>
            <p className="text-[var(--muted)] max-w-sm mx-auto">
              Your response has been recorded. Your voice helps shape a better workplace at Aster QCIL.
            </p>
            <div className="mt-4 text-xs text-[var(--muted)]">This window can be closed.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white dark:from-slate-900 dark:to-slate-800 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AQ</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Aster QCIL</h1>
          <p className="text-[var(--muted)] mt-1">Your voice shapes our culture</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
          <div
            className="bg-rose-500 h-2 rounded-full transition-all"
            style={{ width: `${(section / 3) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[var(--muted)] text-center mb-6">Section {section} of 3</p>

        {/* Section 1 — Pillar Ratings */}
        {section === 1 && (
          <div>
            <h2 className="text-base font-semibold text-[var(--text)] mb-4">
              Rate each area of your experience (1 = Poor, 5 = Excellent)
            </h2>
            {PILLARS.map(pillar => (
              <div key={pillar.key} className="bg-[var(--card)] rounded-xl p-5 shadow-sm mb-4">
                <p className="font-medium text-[var(--text)] mb-3">{pillar.label}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setScores(s => ({ ...s, [pillar.key]: n }))}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors
                        ${scores[pillar.key] === n
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-[var(--muted)] hover:bg-rose-100 dark:hover:bg-rose-900/30'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSection(2)}
                disabled={!section1Complete}
                className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Section 2 — eNPS */}
        {section === 2 && (
          <div>
            <h2 className="text-base font-semibold text-[var(--text)] mb-4">
              Employee Net Promoter Score
            </h2>
            <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm">
              <p className="font-medium text-[var(--text)] mb-2">
                How likely are you to recommend Aster QCIL as a place to work?
              </p>
              <p className="text-xs text-[var(--muted)] mb-4">
                0 = Not at all likely · 10 = Extremely likely
              </p>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setEnps(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors
                      ${enps === n
                        ? n >= 9
                          ? 'bg-emerald-500 text-white'
                          : n >= 7
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-[var(--muted)]'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setSection(1)}
                className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setSection(3)}
                disabled={enps === null}
                className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Section 3 — Open-Ended */}
        {section === 3 && (
          <div>
            <h2 className="text-base font-semibold text-[var(--text)] mb-4">
              Share Your Thoughts
            </h2>
            <div className="space-y-4">
              <div className="bg-[var(--card)] rounded-xl p-5 shadow-sm">
                <label className="block font-medium text-[var(--text)] mb-2">
                  What do you love most about working at Aster QCIL?
                </label>
                <textarea
                  value={feedbackPositive}
                  onChange={e => setFeedbackPositive(e.target.value)}
                  rows={4}
                  placeholder="Share what makes Aster QCIL a great place to work..."
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>
              <div className="bg-[var(--card)] rounded-xl p-5 shadow-sm">
                <label className="block font-medium text-[var(--text)] mb-2">
                  What would you most like to see improved?
                </label>
                <textarea
                  value={feedbackImprove}
                  onChange={e => setFeedbackImprove(e.target.value)}
                  rows={4}
                  placeholder="Your honest feedback helps us improve..."
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setSection(2)}
                className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
              >
                Submit Response
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
