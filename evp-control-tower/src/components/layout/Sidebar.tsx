import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Radio, Lightbulb, FileDown } from 'lucide-react'

interface SidebarProps {
  mobile: boolean
}

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Control Tower' },
  { to: '/surveys', icon: ClipboardList, label: 'Internal Surveys' },
  { to: '/listening', icon: Radio, label: 'External Listening' },
  { to: '/insights', icon: Lightbulb, label: 'EVP Insights' },
  { to: '/reports', icon: FileDown, label: 'Export Reports' },
]

export default function Sidebar({ mobile }: SidebarProps) {
  if (mobile) return null

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 bg-[var(--card)] border-r border-[var(--border)] z-30">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          AQ
        </div>
        <span className="text-sm font-semibold text-[var(--text)] leading-tight">
          EVP Control Tower
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 text-rose-600 text-sm font-medium'
                : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--muted)] hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium transition-colors'
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
