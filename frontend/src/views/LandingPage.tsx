import {
  ArrowRight, Zap, Briefcase, TrendingUp, Search,
  MessageSquare, BarChart2, Users, Building2, CheckCircle,
  Cpu, Star, Sparkles, Shield, Target, ChevronRight,
  Activity, Globe, Layers, ArrowUpRight
} from 'lucide-react'
import type { AppData } from '../types/types'

const TICKER_ITEMS = [
  { label: 'Startups funded', val: '2.4K+' },
  { label: 'Investor matches', val: '98%' },
  { label: 'ML accuracy', val: '94%' },
  { label: 'Avg. deal size', val: '$480K' },
  { label: 'Industries covered', val: '60+' },
  { label: 'Time to match', val: '<48h' },
  { label: 'Startups funded', val: '2.4K+' },
  { label: 'Investor matches', val: '98%' },
  { label: 'ML accuracy', val: '94%' },
  { label: 'Avg. deal size', val: '$480K' },
  { label: 'Industries covered', val: '60+' },
  { label: 'Time to match', val: '<48h' },
]

type LandingPageProps = {
  data: AppData
  onGetStarted: (mode: 'register' | 'login') => void
}

export default function LandingPage({ data, onGetStarted }: LandingPageProps) {
  return (
    <div style={{
      background: '#EDF1F8',
      color: '#0F172A',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: 'hidden',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }

        .fa1 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .fa2 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .fa3 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.25s both; }
        .fa4 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.35s both; }
        .fa5 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.45s both; }

        .float-a { animation: floatA 4s ease-in-out infinite; }
        .float-b { animation: floatB 5.5s ease-in-out infinite 1s; }
        .float-c { animation: floatA 3.8s ease-in-out infinite 0.5s; }

        /* White glass card base */
        .glass-card {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(99,120,180,0.08), 0 1px 4px rgba(99,120,180,0.06);
        }

        .pill-btn-primary {
          background: linear-gradient(135deg, #4F7EF7 0%, #7B5EF8 100%);
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 14px 28px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(79,126,247,0.38);
          transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
        }
        .pill-btn-primary:hover { opacity: 0.92; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,126,247,0.45); }

        .pill-btn-outline {
          background: rgba(255,255,255,0.75);
          color: #374151;
          border: 1.5px solid rgba(255,255,255,0.9);
          border-radius: 100px;
          padding: 13px 26px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(99,120,180,0.08);
          transition: background 0.15s, transform 0.12s;
        }
        .pill-btn-outline:hover { background: rgba(255,255,255,0.95); transform: translateY(-2px); }

        .feature-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 2rem 2rem 2.25rem;
          box-shadow: 0 2px 16px rgba(99,120,180,0.07);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(79,126,247,0.12);
        }

        .step-num {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4F7EF7;
          background: rgba(79,126,247,0.08);
          border-radius: 100px;
          padding: 4px 10px;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .icon-circle {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* dashed grid lines */
        .grid-line-h {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: repeating-linear-gradient(90deg, rgba(99,130,200,0.18) 0px, rgba(99,130,200,0.18) 6px, transparent 6px, transparent 14px);
          pointer-events: none;
        }
        .grid-line-v {
          position: absolute;
          top: 0; bottom: 0;
          width: 1px;
          background: repeating-linear-gradient(180deg, rgba(99,130,200,0.18) 0px, rgba(99,130,200,0.18) 6px, transparent 6px, transparent 14px);
          pointer-events: none;
        }
        .grid-dot {
          position: absolute;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #a0b4d8;
          border: 2px solid #EDF1F8;
          pointer-events: none;
        }

        .bar-track {
          height: 5px;
          background: #EDF1F8;
          border-radius: 99px;
          overflow: hidden;
        }
        .bar-fill-blue {
          height: 100%;
          background: linear-gradient(90deg, #4F7EF7, #7B5EF8);
          border-radius: 99px;
        }

        .role-card {
          border-radius: 24px;
          padding: 3.5rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .role-card:hover { transform: translateY(-3px); }

        .section-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4F7EF7;
          margin-bottom: 0.75rem;
        }

        .check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.86rem;
          color: #475569;
          padding: 7px 0;
        }
      `}</style>

      {/* ══════════════════════════════════════ HERO */}
      <section style={{
        minHeight: '100vh',
        paddingTop: 'calc(64px + 80px)',
        paddingBottom: '80px',
        paddingLeft: '3rem',
        paddingRight: '3rem',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* dashed grid lines — like TrustLine */}
        <div className="grid-line-h" style={{ top: '18%' }} />
        <div className="grid-line-h" style={{ top: '55%' }} />
        <div className="grid-line-h" style={{ bottom: '12%' }} />
        <div className="grid-line-v" style={{ left: '16%' }} />
        <div className="grid-line-v" style={{ right: '16%' }} />
        {/* grid intersect dots */}
        <div className="grid-dot" style={{ top: 'calc(18% - 4px)', left: 'calc(16% - 4px)' }} />
        <div className="grid-dot" style={{ top: 'calc(18% - 4px)', right: 'calc(16% - 4px)' }} />
        <div className="grid-dot" style={{ top: 'calc(55% - 4px)', left: 'calc(16% - 4px)' }} />
        <div className="grid-dot" style={{ top: 'calc(55% - 4px)', right: 'calc(16% - 4px)' }} />
        <div className="grid-dot" style={{ bottom: 'calc(12% - 4px)', left: 'calc(16% - 4px)' }} />
        <div className="grid-dot" style={{ bottom: 'calc(12% - 4px)', right: 'calc(16% - 4px)' }} />

        {/* background radial glow */}
        <div style={{
          position: 'absolute', top: '8%', left: '50%',
          transform: 'translateX(-50%)',
          width: 700, height: 400,
          background: 'radial-gradient(ellipse at center, rgba(79,126,247,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── HERO TEXT — centered ── */}
        <div style={{ textAlign: 'center', maxWidth: 680, position: 'relative', zIndex: 2 }}>
          <div className="fa1" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(79,126,247,0.09)',
            borderRadius: 100, padding: '6px 16px',
            fontSize: '0.75rem', fontWeight: 600, color: '#4F7EF7',
            marginBottom: '1.75rem',
            border: '1px solid rgba(79,126,247,0.15)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F7EF7', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            ML-Powered Startup Matchmaking
          </div>

          <h1 className="fa2" style={{
            fontSize: 'clamp(40px, 5.5vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#0F172A',
            margin: '0 0 1.5rem 0',
          }}>
            Find Your <span style={{ background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Perfect</span><br />
            Investor Match
          </h1>

          <p className="fa3" style={{
            fontSize: '1.05rem',
            color: '#64748B',
            lineHeight: 1.75,
            margin: '0 auto 2.5rem',
            maxWidth: 520,
          }}>
            StartupSphere uses ML algorithms to predict startup success, score compatibility,
            and connect founders with investors most likely to say yes.
          </p>

          <div className="fa4" style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="pill-btn-primary" onClick={() => onGetStarted('register')}>
              Get started free
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button className="pill-btn-outline" onClick={() => onGetStarted('login')}>
              Sign in
            </button>
          </div>
        </div>

        {/* ── FLOATING WIDGETS ── */}
        {/* Left widget — match stats */}
        <div className="glass-card float-a fa5" style={{
          position: 'absolute', left: '5%', top: '34%',
          padding: '1rem 1.25rem', minWidth: 200, zIndex: 3,
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Match stats</div>
          {[
            { label: 'Without StartupSphere', val: 8,  color: '#CBD5E1', active: false },
            { label: 'With StartupSphere',    val: 75, color: '#4F7EF7', active: true  },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: r.active ? '#4F7EF7' : '#94A3B8', minWidth: 26 }}>{r.val}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', flex: 1 }}>{r.label}</div>
              <div style={{
                width: 36, height: 20, borderRadius: 100,
                background: r.active ? '#4F7EF7' : '#E2E8F0',
                display: 'flex', alignItems: 'center',
                padding: '0 3px',
                justifyContent: r.active ? 'flex-end' : 'flex-start',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Right widget — security badge */}
        <div className="glass-card float-b fa5" style={{
          position: 'absolute', right: '5%', top: '28%',
          padding: '1rem 1.25rem', zIndex: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 160,
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secured Platform</div>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
          }}>
            <Shield size={24} strokeWidth={2} color="#fff" />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Verified & Active</div>
        </div>

        {/* Center bottom — 3-panel diagram card */}
        <div className="glass-card fa5" style={{
          marginTop: '4rem',
          width: '100%',
          maxWidth: 860,
          padding: '2rem',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'center',
        }}>
          {/* Startups panel */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Your Startups</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'NovaTech AI', stage: 'Series A', color: '#EEF2FF' },
                { name: 'GreenLoop', stage: 'Seed', color: '#F0FDF4' },
                { name: 'DataVault', stage: 'Pre-Seed', color: '#FFF7ED' },
              ].map(s => (
                <div key={s.name} style={{
                  background: s.color, borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={12} color="#fff" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B' }}>{s.name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{s.stage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* center logo node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 1.5rem' }}>
            <div style={{ width: 1, height: 40, background: 'repeating-linear-gradient(180deg, #CBD5E1 0px, #CBD5E1 4px, transparent 4px, transparent 8px)' }} />
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(79,126,247,0.38)',
              flexShrink: 0,
            }}>
              <Sparkles size={22} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4F7EF7' }}>StartupSphere</div>
            <div style={{ width: 1, height: 40, background: 'repeating-linear-gradient(180deg, #CBD5E1 0px, #CBD5E1 4px, transparent 4px, transparent 8px)' }} />
          </div>

          {/* Investors panel */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Your CX Team</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Team 1',   Icon: Users,    color: '#EEF2FF', ic: '#4F7EF7' },
                { label: 'AI',       Icon: Cpu,      color: '#FFF7ED', ic: '#F59E0B' },
                { label: 'Team 2',   Icon: Briefcase,color: '#F0FDF4', ic: '#22C55E' },
                { label: 'Analytics',Icon: BarChart2, color: '#FDF4FF', ic: '#A855F7' },
              ].map(({ label, Icon, color, ic }) => (
                <div key={label} style={{
                  background: color, borderRadius: 10, padding: '10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: ic + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} strokeWidth={2} color={ic} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ML score chip floating */}
        <div className="glass-card float-c" style={{
          position: 'absolute', right: '8%', bottom: '18%',
          padding: '0.875rem 1.25rem', zIndex: 3,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500 }}>Top match score</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4F7EF7', letterSpacing: '-0.02em' }}>94% compatible</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════ TICKER */}
      <div style={{ overflow: 'hidden', background: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.8)', padding: '14px 0' }}>
        <div style={{ display: 'flex', gap: '4rem', animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {TICKER_ITEMS.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8' }}>{t.label}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#CBD5E1', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4F7EF7' }}>{t.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════ HOW IT WORKS */}
      <section style={{ padding: '8rem 3.5rem', position: 'relative' }}>
        <div className="grid-line-h" style={{ top: 0 }} />
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-label">How it works</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#0F172A' }}>
            Three steps to funding
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', maxWidth: 1000, margin: '0 auto' }}>
          {[
            { n: '01', Icon: Building2,     name: 'Build your profile',  desc: 'Startups complete their pitch — industry, stage, team, funding target, and pitch deck. Investors define sectors, budget, and preferred stage.' },
            { n: '02', Icon: Cpu,           name: 'ML scores & matches', desc: 'Our algorithm analyses every startup profile and scores compatibility with each investor in real-time, surfacing the best fits first.' },
            { n: '03', Icon: MessageSquare, name: 'Connect & close',     desc: 'Investors browse ranked recommendations and message founders directly. Startups manage all incoming interest from one clean inbox.' },
          ].map((s) => (
            <div key={s.n} className="feature-card">
              <div className="step-num">{s.n}</div>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(79,126,247,0.12), rgba(123,94,248,0.12))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                <s.Icon size={20} strokeWidth={1.8} color="#4F7EF7" />
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.65rem', letterSpacing: '-0.01em' }}>{s.name}</div>
              <div style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.78 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════ FEATURES */}
      <section style={{ padding: '5rem 3.5rem 8rem', position: 'relative' }}>
        <div className="grid-line-h" style={{ top: 0 }} />
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-label">Platform features</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#0F172A' }}>
            Everything in one place
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', maxWidth: 1100, margin: '0 auto' }}>
          {[
            { Icon: Cpu,         label: 'ML Prediction',         desc: 'Success probability scoring for every startup profile — stage, team, and funding fit.',    color: '#EEF2FF', ic: '#4F7EF7', wide: false },
            { Icon: Star,        label: 'Smart Recommendations',  desc: 'Personalised top-5 investor list ranked by compatibility, sector, and budget.',            color: '#FFF7ED', ic: '#F59E0B', wide: false },
            { Icon: Search,      label: 'Search & Filter',        desc: 'Real-time filtering by industry, stage, and max funding needed.',                          color: '#F0FDF4', ic: '#22C55E', wide: false },
            { Icon: MessageSquare, label: 'Direct Outreach',      desc: 'Send personalised messages directly from any startup card.',                              color: '#FDF4FF', ic: '#A855F7', wide: false },
            { Icon: BarChart2,   label: 'Role Dashboards',        desc: 'Startups get an investor inbox. Investors get ML-ranked recommendations. Purpose-built for each role.', color: '#EFF6FF', ic: '#3B82F6', wide: true },
            { Icon: Users,       label: `${data.startups.length || 0} Startups`,     desc: 'Active startup profiles on the platform right now.',              color: '#F8FAFF', ic: '#6366F1', wide: false },
            { Icon: Briefcase,   label: `${data.investors.length || 0} Investors`,   desc: 'Verified investors actively seeking their next portfolio company.', color: '#FAFFF8', ic: '#10B981', wide: false },
          ].map(({ Icon, label, desc, color, ic, wide }) => (
            <div key={label} className="feature-card" style={{ gridColumn: wide ? '1 / 3' : undefined }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                <Icon size={20} strokeWidth={1.8} color={ic} />
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.55rem', letterSpacing: '-0.01em' }}>{label}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.75 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════ ROLES */}
      <section style={{ padding: '0 3.5rem 8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* Founders */}
        <div className="role-card" style={{ background: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)', border: '1px solid rgba(79,126,247,0.15)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(79,126,247,0.12)', borderRadius: 100,
            padding: '5px 12px', fontSize: '0.7rem', fontWeight: 700,
            color: '#4F7EF7', marginBottom: '1.75rem',
          }}>
            <Building2 size={11} strokeWidth={2} />
            For Founders
          </div>
          <h3 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.1, margin: '0 0 1.25rem' }}>
            Build. Score.<br />Raise.
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.75, marginBottom: '2rem', maxWidth: 300 }}>
            Create a compelling startup profile, get an instant ML success score, upload your pitch deck, and watch investor interest arrive.
          </p>
          {['ML success probability score', 'Pitch deck upload support', 'Real-time investor inbox', 'Stage & industry tagging'].map(p => (
            <div key={p} className="check-item">
              <CheckCircle size={14} strokeWidth={2.5} color="#4F7EF7" style={{ flexShrink: 0 }} />
              {p}
            </div>
          ))}
          <button className="pill-btn-primary" style={{ marginTop: '2rem' }} onClick={() => onGetStarted('register')}>
            Join as Startup
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Investors */}
        <div className="role-card" style={{ background: 'linear-gradient(145deg, #F5F3FF 0%, #EDE9FE 100%)', border: '1px solid rgba(123,94,248,0.15)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(123,94,248,0.12)', borderRadius: 100,
            padding: '5px 12px', fontSize: '0.7rem', fontWeight: 700,
            color: '#7B5EF8', marginBottom: '1.75rem',
          }}>
            <Briefcase size={11} strokeWidth={2} />
            For Investors
          </div>
          <h3 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.1, margin: '0 0 1.25rem' }}>
            Find. Match.<br />Invest.
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.75, marginBottom: '2rem', maxWidth: 300 }}>
            Set your sectors, budget, and preferred stage. Our engine ranks every startup by compatibility and surfaces your next great investment.
          </p>
          {['ML-ranked startup recommendations', 'Sector & budget filters', 'Direct in-platform messaging', 'Match score transparency'].map(p => (
            <div key={p} className="check-item">
              <CheckCircle size={14} strokeWidth={2.5} color="#7B5EF8" style={{ flexShrink: 0 }} />
              {p}
            </div>
          ))}
          <button className="pill-btn-primary" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #7B5EF8, #9B6FF8)', boxShadow: '0 4px 20px rgba(123,94,248,0.38)' }} onClick={() => onGetStarted('register')}>
            Join as Investor
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════ CTA */}
      <section style={{
        margin: '0 3.5rem 6rem',
        borderRadius: 28,
        background: 'linear-gradient(135deg, #4F7EF7 0%, #7B5EF8 100%)',
        padding: '5rem 4rem',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 1rem', lineHeight: 1.1 }}>
            Ready to launch<br />your journey?
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', maxWidth: 440, lineHeight: 1.75, margin: 0 }}>
            Join thousands of founders and investors already using StartupSphere to make the right connections.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 240 }}>
          <button
            onClick={() => onGetStarted('register')}
            style={{
              background: '#fff', color: '#4F7EF7',
              border: 'none', borderRadius: 100,
              padding: '14px 28px',
              font: "700 0.88rem/1 'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.12s, box-shadow 0.12s',
            }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
          >
            Create free account
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onGetStarted('login')}
            style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 100,
              padding: '13px 28px',
              font: "600 0.88rem/1 'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)' }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)' }}
          >
            Sign in
            <ChevronRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      <div style={{ height: '2rem' }} />
    </div>
  )
}