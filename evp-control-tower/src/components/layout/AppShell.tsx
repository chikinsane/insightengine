import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileFrame from './MobileFrame'
import BottomTabBar from './BottomTabBar'

interface AppShellProps {
  theme: { dark: boolean; toggle: () => void }
  mobilePreview: { mobile: boolean; toggle: () => void }
  org: { name: string; country: string }
}

export default function AppShell({ theme, mobilePreview, org }: AppShellProps) {
  const { dark, toggle: toggleDark } = theme
  const { mobile, toggle: toggleMobile } = mobilePreview

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar — hidden in mobile preview */}
      <Sidebar mobile={mobile} />

      {/* Main column */}
      <div className={`flex flex-col flex-1 ${mobile ? '' : 'md:ml-60'}`}>
        {/* Fixed top header */}
        <Header
          dark={dark}
          onToggleDark={toggleDark}
          mobile={mobile}
          onToggleMobile={toggleMobile}
          orgName={org.name}
          country={org.country}
        />

        {/* Scrollable content area — padded past header */}
        <main className="flex-1 pt-16">
          <MobileFrame enabled={mobile}>
            <Outlet />
          </MobileFrame>
        </main>

        {/* Bottom tab bar — only in mobile preview */}
        {mobile && <BottomTabBar />}
      </div>
    </div>
  )
}
