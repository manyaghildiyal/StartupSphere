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
    <div className="landing page-enter">

      <section className="lp-hero">
        <div className="lp-bg-word" aria-hidden>STARTUP</div>

        <div className="lp-hero-left">
          <div className="lp-eyebrow">
            <div className="lp-eyebrow-dot" />
            AI-Powered Matchmaking
          </div>
          <h1 className="lp-headline">
            FIND YOUR<br />
            <span className="grad">PERFECT</span><br />
            <span className="outline">MATCH</span>
          </h1>
          <p className="lp-sub">
            StartuSphere uses ML algorithms to predict startup success,
            score compatibility, and connect founders with investors
            who are most likely to say&nbsp;yes.
          </p>
          <div className="lp-cta-row">
            <button className="btn-pill btn-pill-primary" onClick={() => onGetStarted('register')}>
              Launch your journey →
            </button>
            <button className="btn-pill btn-pill-outline" onClick={() => onGetStarted('login')}>
              Sign in
            </button>
          </div>
        </div>

        <div className="lp-hero-right">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aff" />
                <stop offset="100%" stopColor="#00e5b8" />
              </linearGradient>
            </defs>
          </svg>

          <div className="lp-score-ring">
            <svg className="lp-score-ring-svg" viewBox="0 0 88 88">
              <circle className="lp-score-ring-track" cx="44" cy="44" r="35" />
              <circle className="lp-score-ring-fill"  cx="44" cy="44" r="35" />
            </svg>
            <div className="lp-score-ring-label">
              <span className="lp-score-ring-num">82%</span>
              <span className="lp-score-ring-unit">ML Score</span>
            </div>
          </div>

          <div className="lp-float-card">
            <div className="lp-fc-label">// startup analysis</div>
            <div className="lp-fc-title">NovaTech AI</div>
            <div className="lp-fc-sub">Series A · SaaS · 12 members</div>
            <div className="lp-fc-bar-row">
              {[
                { label: 'Stage factor',  val: 82 },
                { label: 'Team strength', val: 68 },
                { label: 'Market fit',    val: 91 },
                { label: 'Funding match', val: 74 },
              ].map(b => (
                <div className="lp-fc-bar-item" key={b.label}>
                  <div className="lp-fc-bar-label">
                    <span>{b.label}</span>
                    <span>{b.val}%</span>
                  </div>
                  <div className="lp-fc-bar-track">
                    <div className="lp-fc-bar-fill" style={{ width: `${b.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-chip lp-chip-1">
            <span className="lp-chip-icon">⚡</span>
            <span>Match found</span>
            <span className="lp-chip-val">94%</span>
          </div>
          <div className="lp-chip lp-chip-2">
            <span className="lp-chip-icon">💼</span>
            <span>3 investors interested</span>
          </div>
          <div className="lp-chip lp-chip-3">
            <span className="lp-chip-icon">🚀</span>
            <span>Growth stage</span>
          </div>
        </div>
      </section>

      <div className="lp-ticker">
        <div className="lp-ticker-inner">
          {TICKER_ITEMS.map((t, i) => (
            <div className="lp-ticker-item" key={i}>
              <span>{t.label}</span>
              <span>—</span>
              <span>{t.val}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="lp-how">
        <div className="lp-section-eyebrow">// how it works</div>
        <h2 className="lp-section-title">
          THREE STEPS<br />
          <span className="dim">TO FUNDING</span>
        </h2>
        <div className="lp-steps">
          {[
            { n: '01', icon: '📝', name: 'Build your profile',    desc: 'Startups fill in their pitch: industry, stage, team, funding target and pitch deck. Investors set their sectors, budget and preferred stage.' },
            { n: '02', icon: '🤖', name: 'ML scores & matches',   desc: 'Our algorithm analyses every startup profile and scores compatibility with each investor in real-time, surfacing the best fits first.' },
            { n: '03', icon: '💬', name: 'Connect & close deals', desc: 'Investors browse recommendations, send personalised messages, and startups manage all incoming interest from a single clean dashboard.' },
          ].map(s => (
            <div className="lp-step" key={s.n}>
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-name">{s.name}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-bento">
        <div className="lp-section-eyebrow">// platform features</div>
        <h2 className="lp-section-title">
          EVERYTHING<br />
          <span className="dim">IN ONE PLACE</span>
        </h2>
        <div className="lp-bento-grid">
          <div className="lp-bento-cell wide">
            <div className="lp-bento-icon">🤖</div>
            <div className="lp-bento-name">ML Success Prediction</div>
            <div className="lp-bento-desc">
              Our scoring engine analyses stage, team size, funding ambition, and profile completeness
              to produce a success probability score for every startup on the platform.
            </div>
            <div style={{ marginTop: '1.2rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Stage factor', 'Team score', 'Funding fit', 'Profile quality'].map(l => (
                <span key={l} style={{
                  padding: '3px 10px', borderRadius: '999px', background: 'var(--bg-4)',
                  border: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)'
                }}>
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="lp-bento-cell mid accent">
            <div className="lp-bento-stat">{data.startups.length || '0'}</div>
            <div className="lp-bento-name">Startups</div>
            <div className="lp-bento-desc">Active startup profiles on the platform right now.</div>
          </div>

          <div className="lp-bento-cell third">
            <div className="lp-bento-icon">✨</div>
            <div className="lp-bento-name">Smart Recommendations</div>
            <div className="lp-bento-desc">Investors get a personalised top-5 ranked list based on sector, stage, budget and ML score.</div>
          </div>

          <div className="lp-bento-cell third accent2">
            <div className="lp-bento-icon">🔍</div>
            <div className="lp-bento-name">Search & Filter</div>
            <div className="lp-bento-desc">Filter by industry, startup stage, and max funding needed in real-time.</div>
          </div>

          <div className="lp-bento-cell third">
            <div className="lp-bento-icon">💬</div>
            <div className="lp-bento-name">Direct Outreach</div>
            <div className="lp-bento-desc">Investors can send personalised messages directly from a startup card.</div>
          </div>

          <div className="lp-bento-cell mid">
            <div className="lp-bento-stat">{data.investors.length || '0'}</div>
            <div className="lp-bento-name">Investors</div>
            <div className="lp-bento-desc">Verified investors actively looking for their next portfolio company.</div>
          </div>

          <div className="lp-bento-cell wide accent">
            <div className="lp-bento-icon">📊</div>
            <div className="lp-bento-name">Role Dashboards</div>
            <div className="lp-bento-desc">
              Startups see all incoming investor interest in a clean inbox.
              Investors see their ML-ranked recommendations front and centre.
              Both roles get purpose-built dashboards tailored to their workflow.
            </div>
          </div>
        </div>
      </section>

      <section className="lp-roles">
        <div className="lp-role-card startup-card-bg">
          <div className="lp-role-float-emoji" aria-hidden>🚀</div>
          <div className="lp-role-tag startup-tag">For Founders</div>
          <div className="lp-role-title">BUILD.<br />SCORE.<br />RAISE.</div>
          <div className="lp-role-desc">
            Create a compelling startup profile, get an instant ML success score, upload your pitch deck,
            and watch investor interest arrive in your inbox.
          </div>
          <div className="lp-role-perks">
            {['ML success probability score', 'Pitch deck upload support', 'Real-time investor inbox', 'Stage & industry tagging'].map(p => (
              <div className="lp-role-perk startup-perk" key={p}>
                <div className="lp-role-perk-dot" />
                {p}
              </div>
            ))}
          </div>
          <button className="btn-pill btn-pill-primary" onClick={() => onGetStarted('register')}>
            Join as Startup →
          </button>
        </div>

        <div className="lp-role-card investor-card-bg">
          <div className="lp-role-float-emoji" aria-hidden>💼</div>
          <div className="lp-role-tag investor-tag">For Investors</div>
          <div className="lp-role-title">FIND.<br />MATCH.<br />INVEST.</div>
          <div className="lp-role-desc">
            Set your sectors, budget, and preferred stage. Our engine ranks every startup by
            compatibility and surface your next great investment.
          </div>
          <div className="lp-role-perks">
            {['AI-ranked startup recommendations', 'Sector & budget filters', 'Direct in-platform messaging', 'Match score transparency'].map(p => (
              <div className="lp-role-perk investor-perk" key={p}>
                <div className="lp-role-perk-dot" />
                {p}
              </div>
            ))}
          </div>
          <button
            className="btn-pill btn-pill-outline"
            style={{ borderColor: 'rgba(0,229,184,0.4)', color: 'var(--teal)' }}
            onClick={() => onGetStarted('register')}
          >
            Join as Investor →
          </button>
        </div>
      </section>

      <div className="lp-cta-banner">
        <div className="lp-cta-banner-title">READY TO LAUNCH?</div>
        <div className="lp-cta-banner-sub">
          Join thousands of founders and investors already using StartuSphere to make the right connections.
        </div>
        <div className="lp-cta-banner-btns">
          <button className="btn-pill btn-pill-primary" onClick={() => onGetStarted('register')}>
            Create free account →
          </button>
          <button className="btn-pill btn-pill-outline" onClick={() => onGetStarted('login')}>
            Sign in
          </button>
        </div>
      </div>

      <div style={{ height: '3rem' }} />
    </div>
  )
}