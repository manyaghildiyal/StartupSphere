import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Role, User } from '../types/types'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type AuthScreenProps = {
  initialMode: 'register' | 'login'
  onAuth: (user: User, token: string) => void
}

export default function AuthScreen({ initialMode, onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'startup' as Role })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
    const body = mode === 'register'
      ? { name: form.name, email: form.email, password: form.password, role: form.role }
      : { email: form.email, password: form.password }

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        onAuth(data.user, data.token)
      }
    } catch {
      setError('Could not connect to server. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen page-enter">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">StartuSphere</div>
          <h2 className="auth-title">
            {mode === 'register' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="auth-sub">
            {mode === 'register'
              ? 'Join the AI-powered startup-investor platform'
              : 'Sign in to continue to your dashboard'}
          </p>
        </div>

        <div className="tab-row">
          <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}>
            Register
          </button>
          <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}>
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="field">
                <label className="field-label">Full Name</label>
                <input className="field-input" placeholder="Ada Lovelace"
                  value={form.name} onChange={e => setForm(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">I am a …</label>
                <div className="role-picker">
                  {(['startup', 'investor'] as Role[]).map(r => (
                    <label className="role-option" key={r}>
                      <input type="radio" name="role" value={r}
                        checked={form.role === r}
                        onChange={() => setForm(c => ({ ...c, role: r }))} />
                      <div className="role-label">
                        <span className="role-icon">{r === 'startup' ? '🚀' : '💼'}</span>
                        <span className="role-name">{r === 'startup' ? 'Startup' : 'Investor'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="field">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm(c => ({ ...c, email: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(c => ({ ...c, password: e.target.value }))} />
          </div>
          {error && <div className="error-msg">⚠ {error}</div>}
          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}>
            {loading ? 'Please wait…' : mode === 'register' ? 'Create account →' : 'Sign in →'}
          </button>
        </form>

        <p className="auth-footer">
          {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}>
            {mode === 'register' ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  )
}