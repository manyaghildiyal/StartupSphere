import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Role, User } from '../types/types'
import { Sparkles, ArrowRight, Building2, Briefcase, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react'

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
  const [otpMode, setOtpMode] = useState(false)
  const [otp, setOtp] = useState('')

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Something went wrong.')
      else onAuth(data.user, data.token)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.needsVerification) {
          setOtpMode(true)
        } else {
          setError(data.error || 'Something went wrong.')
        }
      } else {
        if (mode === 'register') {
          setOtpMode(true)
        } else {
          onAuth(data.user, data.token)
        }
      }
    } catch {
      setError('Could not connect to server. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDF1F8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* grid lines */
        .auth-grid-h { position: absolute; left: 0; right: 0; height: 1px; background: repeating-linear-gradient(90deg, rgba(99,130,200,0.15) 0px, rgba(99,130,200,0.15) 6px, transparent 6px, transparent 14px); pointer-events: none; }
        .auth-grid-v { position: absolute; top: 0; bottom: 0; width: 1px; background: repeating-linear-gradient(180deg, rgba(99,130,200,0.15) 0px, rgba(99,130,200,0.15) 6px, transparent 6px, transparent 14px); pointer-events: none; }

        .auth-field-input {
          width: 100%;
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .auth-field-input::placeholder { color: #94A3B8; }
        .auth-field-input:focus { border-color: #4F7EF7; box-shadow: 0 0 0 3px rgba(79,126,247,0.12); }

        .auth-submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #4F7EF7 0%, #7B5EF8 100%);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 20px rgba(79,126,247,0.35);
          transition: opacity 0.15s, transform 0.12s;
          margin-top: 0.5rem;
        }
        .auth-submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .role-opt input[type=radio] { display: none; }
        .role-opt-box {
          display: flex; align-items: center; gap: 10px;
          border: 2px solid #E2E8F0;
          border-radius: 14px;
          padding: 12px 16px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          background: #fff;
        }
        .role-opt input:checked ~ .role-opt-box {
          border-color: #4F7EF7;
          background: rgba(79,126,247,0.05);
        }
        .role-opt-box:hover { border-color: #A5B4FC; }

        .auth-tab-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          color: #94A3B8;
          cursor: pointer;
          border-radius: 100px;
          transition: background 0.15s, color 0.15s;
        }
        .auth-tab-btn.active {
          background: #fff;
          color: #4F7EF7;
          box-shadow: 0 2px 8px rgba(79,126,247,0.12);
        }

        .auth-link-btn {
          background: none; border: none;
          color: #4F7EF7; font-weight: 700;
          font-family: inherit; font-size: inherit;
          cursor: pointer; padding: 0;
          transition: opacity 0.15s;
        }
        .auth-link-btn:hover { opacity: 0.75; }

        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-card-enter { animation: authFadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* decorative grid lines */}
      <div className="auth-grid-h" style={{ top: '20%' }} />
      <div className="auth-grid-h" style={{ bottom: '20%' }} />
      <div className="auth-grid-v" style={{ left: '20%' }} />
      <div className="auth-grid-v" style={{ right: '20%' }} />

      {/* radial glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(79,126,247,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="auth-card-enter" style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.95)',
        borderRadius: 24,
        boxShadow: '0 8px 40px rgba(99,120,180,0.12), 0 2px 8px rgba(99,120,180,0.08)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: 440,
        position: 'relative',
        zIndex: 1,
      }}>

        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(79,126,247,0.35)',
          }}>
            <Sparkles size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A' }}>StartupSphere</span>
        </div>

        {/* heading */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', margin: '0 0 0.35rem' }}>
          {otpMode ? 'Verify your email' : mode === 'register' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: '0.87rem', color: '#64748B', margin: '0 0 1.75rem' }}>
          {otpMode ? `We sent a 6-digit code to ${form.email}.` : mode === 'register'
            ? 'Join the ML-powered startup-investor platform'
            : 'Sign in to continue to your dashboard'}
        </p>

        {/* tab switcher */}
        {!otpMode && (
          <div style={{
            display: 'flex', gap: 4, background: '#F1F5F9',
            borderRadius: 100, padding: 4, marginBottom: '1.75rem',
          }}>
            {(['register', 'login'] as const).map(m => (
              <button key={m} className={`auth-tab-btn ${mode === m ? 'active' : ''}`}
                onClick={() => { setMode(m); setError('') }}>
                {m === 'register' ? 'Register' : 'Sign in'}
              </button>
            ))}
          </div>
        )}

        {/* form */}
        {otpMode ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' }}>6-digit Code</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} strokeWidth={2} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input className="auth-field-input" type="text" placeholder="123456" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: '0.82rem', color: '#EF4444',
              }}>
                <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            <button type="submit" className="auth-submit-btn" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying…' : 'Verify & Sign in'}
              {!loading && <ArrowRight size={15} strokeWidth={2.5} />}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.84rem', color: '#64748B', marginTop: '1rem', marginBottom: 0 }}>
              <button type="button" className="auth-link-btn" onClick={() => { setOtpMode(false); setError('') }}>Back</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {mode === 'register' && (
              <>
                {/* name */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={15} strokeWidth={2} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input className="auth-field-input" placeholder="Ada Lovelace"
                      value={form.name} onChange={e => setForm(c => ({ ...c, name: e.target.value }))} />
                  </div>
                </div>

                {/* role picker */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8, display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' }}>I am a…</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['startup', 'investor'] as Role[]).map(r => (
                      <label key={r} className="role-opt" style={{ cursor: 'pointer' }}>
                        <input type="radio" name="role" value={r}
                          checked={form.role === r}
                          onChange={() => setForm(c => ({ ...c, role: r }))} />
                        <div className="role-opt-box">
                          {r === 'startup'
                            ? <Building2 size={16} strokeWidth={2} color={form.role === r ? '#4F7EF7' : '#94A3B8'} />
                            : <Briefcase size={16} strokeWidth={2} color={form.role === r ? '#4F7EF7' : '#94A3B8'} />}
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: form.role === r ? '#4F7EF7' : '#374151' }}>
                              {r === 'startup' ? 'Startup' : 'Investor'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                              {r === 'startup' ? 'Raise funding' : 'Find deals'}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* email */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} strokeWidth={2} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input className="auth-field-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(c => ({ ...c, email: e.target.value }))} />
              </div>
            </div>

            {/* password */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} strokeWidth={2} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input className="auth-field-input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(c => ({ ...c, password: e.target.value }))} />
              </div>
            </div>

            {/* error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: '0.82rem', color: '#EF4444',
              }}>
                <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
              {!loading && <ArrowRight size={15} strokeWidth={2.5} />}
            </button>
          </form>
        )}

        {/* footer */}
        {!otpMode && (
          <p style={{ textAlign: 'center', fontSize: '0.84rem', color: '#64748B', marginTop: '1.5rem', marginBottom: 0 }}>
            {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
            <button className="auth-link-btn"
              onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}>
              {mode === 'register' ? 'Sign in' : 'Register'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}