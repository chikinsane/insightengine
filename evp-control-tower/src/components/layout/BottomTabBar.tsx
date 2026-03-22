import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Radio, Lightbulb, FileDown } from 'lucide-react'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard },
  { to: '/surveys', icon: ClipboardList },
  { to: '/listening', icon: Radio },
  { to: '/insights', icon: Lightbulb },
  { to: '/reports', icon: FileDown },
]

export default function BottomTabBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] border-t border-[var(--border)]">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center justify-center p-3 text-rose-500'
                : 'flex items-center justify-center p-3 text-[var(--muted)]'
            }
          >
            <Icon size={22} />
          </NavLink>
        ))}
      </div>
    </div>
  )
}
