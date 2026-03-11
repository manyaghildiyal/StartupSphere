import { ArrowRight, LogOut, User as UserIcon, Sparkles } from 'lucide-react'
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .ss-nav-wrap {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          display: flex;
          justify-content: center;
          padding: 16px 2rem;
          pointer-events: none;
        }

        .ss-nav {
          pointer-events: all;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 100px;
          padding: 8px 10px 8px 20px;
          box-shadow: 0 4px 24px rgba(99,120,180,0.10), 0 1px 4px rgba(99,120,180,0.08);
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-width: min(760px, 90vw);
          max-width: 900px;
          width: 100%;
        }

        .ss-nav-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }

        .ss-nav-logo {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, #4F7EF7 0%, #7B5EF8 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(79,126,247,0.35);
        }

        .ss-nav-name {
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0F172A;
        }

        .ss-nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex: 1;
          justify-content: center;
        }

        .ss-nav-link {
          background: none;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          padding: 7px 14px;
          border-radius: 100px;
          transition: background 0.15s, color 0.15s;
        }
        .ss-nav-link:hover { background: rgba(79,126,247,0.08); color: #4F7EF7; }

        .ss-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .ss-nav-signin {
          background: none;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 100px;
          transition: color 0.15s;
        }
        .ss-nav-signin:hover { color: #4F7EF7; }

        .ss-nav-cta {
          background: linear-gradient(135deg, #4F7EF7 0%, #7B5EF8 100%);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 9px 22px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 12px rgba(79,126,247,0.4);
          transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
        }
        .ss-nav-cta:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(79,126,247,0.5); }

        .ss-nav-user-pill {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px;
          background: rgba(79,126,247,0.07);
          border-radius: 100px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #374151;
        }

        .ss-nav-signout {
          background: none;
          border: 1px solid #E5E7EB;
          border-radius: 100px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: #94A3B8;
          cursor: pointer;
          padding: 7px 14px;
          display: inline-flex; align-items: center; gap: 6px;
          transition: color 0.15s, border-color 0.15s;
        }
        .ss-nav-signout:hover { color: #EF4444; border-color: rgba(239,68,68,0.3); }
      `}</style>

      <div className="ss-nav-wrap">
        <nav className="ss-nav">
          {/* Brand */}
          <div className="ss-nav-brand" onClick={onLogo} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onLogo()}>
            <div className="ss-nav-logo">
              <Sparkles size={14} strokeWidth={2.5} color="#fff" />
            </div>
            <span className="ss-nav-name">StartuSphere</span>
          </div>

          {/* Center links — only on landing */}
          {view === 'landing' && !user && (
            <div className="ss-nav-links">
              {['Features', 'How it works', 'Pricing', 'About'].map(l => (
                <button key={l} className="ss-nav-link">{l}</button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="ss-nav-actions">
            {user ? (
              <>
                <div className="ss-nav-user-pill">
                  <UserIcon size={12} strokeWidth={2} color="#4F7EF7" />
                  {user.name}
                </div>
                <button className="ss-nav-signout" onClick={onLogout}>
                  <LogOut size={11} strokeWidth={2} />
                  Sign out
                </button>
              </>
            ) : view === 'landing' ? (
              <>
                <button className="ss-nav-signin" onClick={onLogin}>Sign in</button>
                <button className="ss-nav-cta" onClick={onRegister}>
                  Get started
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </>
            ) : null}
          </div>
        </nav>
      </div>
    </>
  )
}