import React from 'react'

interface MobileFrameProps {
  children: React.ReactNode
  enabled: boolean
}

export default function MobileFrame({ children, enabled }: MobileFrameProps) {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center py-8 min-h-screen bg-slate-200 dark:bg-slate-900">
      <div className="text-xs text-slate-500 mb-3 font-medium tracking-widest uppercase">
        Mobile Preview
      </div>
      <div
        className="w-[390px] rounded-3xl border-8 border-slate-800 overflow-hidden shadow-2xl relative"
        style={{ height: '844px' }}
      >
        <div className="overflow-y-auto h-full bg-[var(--bg)]">
          {children}
        </div>
      </div>
    </div>
  )
}
