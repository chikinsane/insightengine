import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { useMobilePreview } from './hooks/useMobilePreview'
import { useOrgConfig } from './hooks/useOrgConfig'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Surveys from './pages/Surveys'
import Listening from './pages/Listening'
import Insights from './pages/Insights'
import Reports from './pages/Reports'
import SurveyForm from './pages/SurveyForm'

export default function App() {
  const theme = useTheme()
  const mobilePreview = useMobilePreview()
  const orgConfig = useOrgConfig()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing orgConfig={orgConfig} />} />
        <Route path="/survey/:id" element={<SurveyForm />} />
        <Route element={
          <AppShell
            theme={theme}
            mobilePreview={mobilePreview}
            org={orgConfig.org}
            onLogout={orgConfig.logout}
          />
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/surveys/*" element={<Surveys />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/insights/*" element={<Insights />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
