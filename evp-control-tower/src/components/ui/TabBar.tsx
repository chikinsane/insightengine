interface Tab {
  id: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            active === tab.id
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
