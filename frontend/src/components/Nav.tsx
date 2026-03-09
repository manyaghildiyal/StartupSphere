import type { View, User } from '../types/types'

type NavProps = {
  view: View
  onLogin: () => void
  onRegister: () => void
  onLogo: () => void
  user: User | null
  onLogout: () => void
}

export default function Nav({ view, onLogin, onRegister, onLogo, user, onLogout }: NavProps) {
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={onLogo} role="button" tabIndex={0}>
        <div className="nav-logo-dot" />
        StartuSphere
      </div>
      <div className="nav-actions">
        {user ? (
          <>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{user.name}</span>
            <button className="btn btn-danger btn-sm" onClick={onLogout}>Sign out</button>
          </>
        ) : view === 'landing' ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={onLogin}>Sign in</button>
            <button className="btn btn-primary btn-sm" onClick={onRegister}>Get started</button>
          </>
        ) : null}
      </div>
    </nav>
  )
}