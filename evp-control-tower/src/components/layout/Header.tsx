import { Moon, Sun, Smartphone, Monitor } from 'lucide-react'

interface HeaderProps {
  dark: boolean
  onToggleDark: () => void
  mobile: boolean
  onToggleMobile: () => void
  orgName: string
  country: string
  industry: string
}

const countryFlags: Record<string, string> = {
  India: '🇮🇳',
  US: '🇺🇸',
  UK: '🇬🇧',
  UAE: '🇦🇪',
}

export default function Header({ dark, onToggleDark, mobile, onToggleMobile, orgName, country, industry }: HeaderProps) {
  const flag = countryFlags[country] ?? '🏳️'

  return (
    <header className="h-16 fixed top-0 right-0 left-0 md:left-60 z-20 bg-[var(--card)] border-b border-[var(--border)] flex items-center px-5">
      {/* Left: org info */}
      <div className="flex items-center gap-2 flex-1">
        <span className="font-semibold text-[var(--text)]">{orgName}</span>
        <span className="text-lg">{flag}</span>
        <span className="text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
          {industry}
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* Mobile preview toggle */}
        <button
          onClick={onToggleMobile}
          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            mobile ? 'text-rose-500' : 'text-[var(--muted)]'
          }`}
          title={mobile ? 'Switch to desktop view' : 'Switch to mobile preview'}
        >
          {mobile ? <Monitor size={20} /> : <Smartphone size={20} />}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[var(--muted)]"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
