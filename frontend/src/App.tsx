import { useState } from 'react'
import type { View } from './types/types'
import { loadData } from './utils/storage'
import { useAuth } from './hooks/useAuth'
import OrbField from './components/OrbField'
import Nav from './components/Nav'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './views/LandingPage'
import AuthScreen from './views/AuthScreen'
import AppDashboard from './views/AppDashboard'
import './App.css'

export default function App() {
  const { user, status, login, logout } = useAuth()
  const [authMode, setAuthMode] = useState<'register' | 'login' | null>(null)

  const view: View = status === 'authenticated' ? 'app' : 'landing'

  function goAuth(mode: 'register' | 'login') {
    setAuthMode(mode)
  }

  if (status === 'loading') {
    return (
      <div className="page-shell">
        <OrbField />
        <LoadingScreen />
      </div>
    )
  }

  const showAuth = status === 'unauthenticated' && authMode !== null && view !== 'app'

  const data = loadData()

  return (
    <div className="page-shell">
      <OrbField />
      <Nav
        view={status === 'authenticated' ? 'app' : showAuth ? 'auth' : 'landing'}
        onLogin={() => goAuth('login')}
        onRegister={() => goAuth('register')}
        onLogo={() => setAuthMode(null)}
        user={user}
        onLogout={() => logout('user clicked sign out')}
      />

      {status === 'authenticated' && user && (
        <AppDashboard user={user} onLogout={() => logout('user clicked sign out')} />
      )}

      {status === 'unauthenticated' && showAuth && (
        <AuthScreen initialMode={authMode} onAuth={login} />
      )}

      {status === 'unauthenticated' && !showAuth && (
        <LandingPage data={data} onGetStarted={goAuth} />
      )}
    </div>
  )
}