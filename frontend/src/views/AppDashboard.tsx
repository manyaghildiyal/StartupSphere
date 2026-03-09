import { useEffect, useMemo, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import type { User, Stage } from '../types/types'
import type { StartupProfile, InvestorProfile, ContactRequest } from '../utils/api'
import { api } from '../utils/api'
import { calcSuccess, recScore, stageFactor, clamp } from '../utils/ml'
import StartupCard from '../components/StartupCard'

type AppDashboardProps = {
  user: User
  onLogout: () => void
}

export default function AppDashboard({ user, onLogout }: AppDashboardProps) {
  const [tab, setTab] = useState('profile')
  const [startupProfile, setStartupProfile] = useState<StartupProfile | null>(null)
  const [startupForm, setStartupForm] = useState({
    startupName: '', industry: '', description: '',
    fundingNeeded: '250000', teamSize: '5', stage: 'mvp' as Stage, pitchDeckName: '',
  })
  const [savingStartup, setSavingStartup] = useState(false)
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null)
  const [investorForm, setInvestorForm] = useState({
    investmentSectors: '', investmentAmount: '500000', preferredStage: 'growth' as Stage,
  })
  const [savingInvestor, setSavingInvestor] = useState(false)
  const [allStartups, setAllStartups]     = useState<StartupProfile[]>([])
  const [inbox, setInbox]                 = useState<ContactRequest[]>([])
  const [searchIndustry, setSearchIndustry] = useState('')
  const [searchStage, setSearchStage]       = useState('')
  const [searchFunding, setSearchFunding]   = useState('')
  const [msgMap, setMsgMap]   = useState<Record<string, string>>({})
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user.role === 'startup') {
      api.getMyStartup().then(({ profile }) => {
        if (profile) {
          setStartupProfile(profile)
          setStartupForm({
            startupName: profile.startupName, industry: profile.industry,
            description: profile.description, fundingNeeded: String(profile.fundingNeeded),
            teamSize: String(profile.teamSize), stage: profile.stage,
            pitchDeckName: profile.pitchDeckName,
          })
        }
      }).catch(console.error)
      api.getInbox().then(({ requests }) => setInbox(requests)).catch(console.error)
    }
    if (user.role === 'investor') {
      api.getMyInvestor().then(({ profile }) => {
        if (profile) {
          setInvestorProfile(profile)
          setInvestorForm({
            investmentSectors: profile.investmentSectors.join(', '),
            investmentAmount: String(profile.investmentAmount),
            preferredStage: profile.preferredStage,
          })
        }
      }).catch(console.error)
      api.getStartups().then(({ startups }) => setAllStartups(startups)).catch(console.error)
    }
  }, [user])

  async function saveStartup(e: FormEvent) {
    e.preventDefault()
    if (!startupForm.startupName.trim() || !startupForm.industry.trim() || !startupForm.description.trim()) return
    setSavingStartup(true)
    try {
      const { profile } = await api.saveStartup({
        startupName: startupForm.startupName.trim(),
        industry: startupForm.industry.trim(),
        description: startupForm.description.trim(),
        fundingNeeded: Number(startupForm.fundingNeeded),
        teamSize: Number(startupForm.teamSize),
        stage: startupForm.stage,
        pitchDeckName: startupForm.pitchDeckName,
      })
      setStartupProfile(profile)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingStartup(false)
    }
  }

  async function saveInvestor(e: FormEvent) {
    e.preventDefault()
    setSavingInvestor(true)
    try {
      const { profile } = await api.saveInvestor({
        investmentSectors: investorForm.investmentSectors.split(',').map(x => x.trim()).filter(Boolean),
        investmentAmount: Number(investorForm.investmentAmount),
        preferredStage: investorForm.preferredStage,
      })
      setInvestorProfile(profile)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingInvestor(false)
    }
  }

  async function sendRequest(startupUserId: string) {
    const msg = (msgMap[startupUserId] ?? '').trim()
    if (!msg) return
    try {
      await api.sendRequest({ startupUserId, message: msg })
      setMsgMap(c => ({ ...c, [startupUserId]: '' }))
      setSentMap(c => ({ ...c, [startupUserId]: true }))
      setTimeout(() => setSentMap(c => ({ ...c, [startupUserId]: false })), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchStartups = useCallback(async () => {
    const { startups } = await api.getStartups({
      industry: searchIndustry || undefined,
      stage: searchStage || undefined,
      maxFunding: searchFunding ? Number(searchFunding) : undefined,
    })
    setAllStartups(startups)
  }, [searchIndustry, searchStage, searchFunding])

  useEffect(() => {
    if (user.role === 'investor') fetchStartups()
  }, [searchIndustry, searchStage, searchFunding, user.role])

  const visibleStartups = useMemo(() =>
    allStartups.map(s => ({ s, score: calcSuccess(s) })),
  [allStartups])

  const recommendations = useMemo(() => {
    if (!investorProfile) return []
    return allStartups
      .map(s => ({ s, match: Math.round(recScore(s, investorProfile) * 100), score: calcSuccess(s) }))
      .sort((a, b) => b.match - a.match).slice(0, 6)
  }, [allStartups, investorProfile])

  const successScore = startupProfile ? calcSuccess(startupProfile) : 0
  const sectors = investorProfile?.investmentSectors ?? []

  const tabs = user.role === 'startup'
    ? [
        { key: 'profile',    label: 'My Profile' },
        { key: 'prediction', label: 'ML Score' },
        { key: 'inbox',      label: `Inbox${inbox.length ? ` (${inbox.length})` : ''}` },
      ]
    : [
        { key: 'profile',     label: 'My Profile' },
        { key: 'search',      label: 'Search' },
        { key: 'recommended', label: 'Recommended' },
      ]

  return (
    <div className="app-shell page-enter">
      <div className="app-content">
        <div className="user-bar">
          <div className="user-bar-left">
            <div className="user-avatar">{user.name[0].toUpperCase()}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <span className={`user-role-badge ${user.role}`}>
                {user.role === 'startup' ? '🚀 Startup' : '💼 Investor'}
              </span>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>Sign out</button>
        </div>

        <div className="section-tabs">
          {tabs.map(t => (
            <button key={t.key} className={`stab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {user.role === 'startup' && (
          <>
            {tab === 'profile' && (
              <div className="panel page-enter">
                <div className="panel-header">
                  <div className="panel-title">Startup Profile</div>
                  <div className="panel-sub">Your public-facing profile shown to investors</div>
                </div>
                <form className="form-grid" onSubmit={saveStartup}>
                  <div className="field">
                    <label className="field-label">Startup Name</label>
                    <input className="field-input" placeholder="Acme Corp"
                      value={startupForm.startupName}
                      onChange={e => setStartupForm(c => ({ ...c, startupName: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Industry</label>
                    <input className="field-input" placeholder="FinTech"
                      value={startupForm.industry}
                      onChange={e => setStartupForm(c => ({ ...c, industry: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Funding Needed (USD)</label>
                    <input className="field-input" type="number" min={0} placeholder="250000"
                      value={startupForm.fundingNeeded}
                      onChange={e => setStartupForm(c => ({ ...c, fundingNeeded: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Team Size</label>
                    <input className="field-input" type="number" min={1} placeholder="5"
                      value={startupForm.teamSize}
                      onChange={e => setStartupForm(c => ({ ...c, teamSize: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">Stage</label>
                    <select className="field-select" value={startupForm.stage}
                      onChange={e => setStartupForm(c => ({ ...c, stage: e.target.value as Stage }))}>
                      <option value="idea">Idea</option>
                      <option value="mvp">MVP</option>
                      <option value="growth">Growth</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Pitch Deck</label>
                    <div className="upload-zone">
                      <input type="file" accept=".pdf,.ppt,.pptx"
                        onChange={e => setStartupForm(c => ({ ...c, pitchDeckName: e.target.files?.[0]?.name ?? '' }))} />
                      <div className="upload-icon">📎</div>
                      <div className="upload-text"><strong>Click to upload</strong> · PDF or PPT</div>
                      {startupForm.pitchDeckName && (
                        <div className="upload-selected">✓ {startupForm.pitchDeckName}</div>
                      )}
                    </div>
                  </div>
                  <div className="field span-2">
                    <label className="field-label">Description</label>
                    <textarea className="field-textarea" rows={4}
                      placeholder="Describe your startup, the problem you solve, and your traction…"
                      value={startupForm.description}
                      onChange={e => setStartupForm(c => ({ ...c, description: e.target.value }))} />
                    <span className="field-hint">{startupForm.description.length} chars — aim for 200+</span>
                  </div>
                  <div className="span-2">
                    <button type="submit" className="btn btn-primary" disabled={savingStartup}>
                      {savingStartup ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'prediction' && (
              <div className="panel page-enter">
                <div className="panel-header">
                  <div className="panel-title">ML Success Prediction</div>
                  <div className="panel-sub">Algorithmic estimate based on profile quality, stage, team and funding</div>
                </div>
                {!startupProfile ? (
                  <div className="empty-state">
                    <div className="empty-icon">🤖</div>
                    <div className="empty-text">Complete your startup profile to receive your ML success score.</div>
                  </div>
                ) : (
                  <div className="success-meter">
                    <div className="success-score">
                      <span className="success-num">{successScore}</span>
                      <span className="success-pct">%</span>
                    </div>
                    <div className="success-label">Predicted success probability</div>
                    <div className="success-bar-track">
                      <div className="success-bar-fill" style={{ width: `${successScore}%` }} />
                    </div>
                    <div className="score-factors">
                      {[
                        { name: 'Stage',       val: Math.round(stageFactor[startupProfile.stage] * 100) },
                        { name: 'Team',        val: Math.round(clamp(startupProfile.teamSize / 30) * 100) },
                        { name: 'Funding Fit', val: Math.round(clamp(1 - startupProfile.fundingNeeded / 2_000_000) * 100) },
                        { name: 'Profile',     val: Math.round(clamp(startupProfile.description.length / 600) * 100) },
                      ].map(f => (
                        <div className="factor-chip" key={f.name}>
                          <div className="factor-name">{f.name}</div>
                          <div className="factor-bar-track">
                            <div className="factor-bar-fill" style={{ width: `${f.val}%` }} />
                          </div>
                          <div className="factor-val">{f.val}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'inbox' && (
              <div className="panel page-enter">
                <div className="panel-header">
                  <div className="panel-title">Investor Inbox</div>
                  <div className="panel-sub">Messages and connection requests from investors</div>
                </div>
                {!inbox.length ? (
                  <div className="empty-state">
                    <div className="empty-icon">📬</div>
                    <div className="empty-text">No investor messages yet.<br />Keep your profile complete to attract interest.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {inbox.map(r => (
                      <div className="inbox-card" key={r.id}>
                        <div className="inbox-sender">{r.investorName}</div>
                        <div className="inbox-msg">{r.message}</div>
                        <div className="inbox-time">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── INVESTOR VIEWS ── */}
        {user.role === 'investor' && (
          <>
            {tab === 'profile' && (
              <div className="panel page-enter">
                <div className="panel-header">
                  <div className="panel-title">Investor Profile</div>
                  <div className="panel-sub">Set your preferences to get personalised recommendations</div>
                </div>
                <form onSubmit={saveInvestor}>
                  <div className="field">
                    <label className="field-label">Investment Sectors</label>
                    <input className="field-input" placeholder="FinTech, HealthTech, AI, SaaS …"
                      value={investorForm.investmentSectors}
                      onChange={e => setInvestorForm(c => ({ ...c, investmentSectors: e.target.value }))} />
                    <span className="field-hint">Comma-separated list of sectors</span>
                    {sectors.length > 0 && (
                      <div className="sector-tags">
                        {sectors.map(s => <span className="sector-tag" key={s}>✓ {s}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="form-grid" style={{ marginTop: '0.2rem' }}>
                    <div className="field">
                      <label className="field-label">Investment Amount (USD)</label>
                      <input className="field-input" type="number" min={0}
                        value={investorForm.investmentAmount}
                        onChange={e => setInvestorForm(c => ({ ...c, investmentAmount: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Preferred Stage</label>
                      <select className="field-select" value={investorForm.preferredStage}
                        onChange={e => setInvestorForm(c => ({ ...c, preferredStage: e.target.value as Stage }))}>
                        <option value="idea">Idea</option>
                        <option value="mvp">MVP</option>
                        <option value="growth">Growth</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={savingInvestor}>
                    {savingInvestor ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'search' && (
              <div className="panel page-enter">
                <div className="panel-header">
                  <div className="panel-title">Search Startups</div>
                  <div className="panel-sub">Browse all startups and send connection requests</div>
                </div>
                <div className="filter-bar">
                  <div className="field">
                    <label className="field-label">Industry</label>
                    <input className="field-input" placeholder="e.g. FinTech"
                      value={searchIndustry} onChange={e => setSearchIndustry(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Stage</label>
                    <select className="field-select" value={searchStage} onChange={e => setSearchStage(e.target.value)}>
                      <option value="">Any stage</option>
                      <option value="idea">Idea</option>
                      <option value="mvp">MVP</option>
                      <option value="growth">Growth</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Max Funding (USD)</label>
                    <input className="field-input" type="number" min={0} placeholder="No limit"
                      value={searchFunding} onChange={e => setSearchFunding(e.target.value)} />
                  </div>
                </div>
                {!visibleStartups.length ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-text">No startups found for these filters.</div>
                  </div>
                ) : (
                  <div className="card-grid">
                    {visibleStartups.map(({ s, score }) => (
                      <StartupCard key={s.userId} s={s} score={score}
                        owner={s.userId}
                        msg={msgMap[s.userId] ?? ''}
                        onMsg={v => setMsgMap(c => ({ ...c, [s.userId]: v }))}
                        onSend={() => sendRequest(s.userId)}
                        sent={sentMap[s.userId] ?? false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'recommended' && (
              <div className="panel page-enter">
                <div className="panel-header">
                  <div className="panel-title">Recommended for You</div>
                  <div className="panel-sub">Top startups ranked by compatibility with your investor profile</div>
                </div>
                {!investorProfile ? (
                  <div className="empty-state">
                    <div className="empty-icon">✨</div>
                    <div className="empty-text">Set up your investor profile first to see personalised recommendations.</div>
                  </div>
                ) : !recommendations.length ? (
                  <div className="empty-state">
                    <div className="empty-icon">🚀</div>
                    <div className="empty-text">No startups on the platform yet. Check back soon.</div>
                  </div>
                ) : (
                  <div className="card-grid">
                    {recommendations.map(({ s, match, score }) => (
                      <StartupCard key={`rec_${s.userId}`} s={s} score={score}
                        matchScore={match}
                        owner={s.userId}
                        msg={msgMap[s.userId] ?? ''}
                        onMsg={v => setMsgMap(c => ({ ...c, [s.userId]: v }))}
                        onSend={() => sendRequest(s.userId)}
                        sent={sentMap[s.userId] ?? false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}