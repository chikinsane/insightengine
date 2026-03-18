'use client'

interface FollowUpChipsProps {
  questions: string[]
  onQuestionClick: (question: string) => void
  disabled?: boolean
}

export function FollowUpChips({
  questions,
  onQuestionClick,
  disabled = false,
}: FollowUpChipsProps) {
  if (questions.length === 0) return null

  return (
    <div className="mt-4">
      <p className="text-white/30 text-xs mb-2">Follow-up questions</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => !disabled && onQuestionClick(question)}
            disabled={disabled}
            className={[
              'px-3 py-2 text-xs rounded-full border transition-all',
              disabled
                ? 'text-white/20 border-white/[0.04] cursor-wait opacity-50'
                : 'text-white/50 border-white/[0.07] cursor-pointer hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5',
            ].join(' ')}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
