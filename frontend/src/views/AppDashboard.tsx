import { useEffect, useMemo, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import type { User, Stage } from '../types/types'
import type { StartupProfile, InvestorProfile, ChatMessage, ChatConversation } from '../utils/api'
import { api } from '../utils/api'
import { calcSuccess, recScore, stageFactor, clamp } from '../utils/ml'
import StartupCard from '../components/StartupCard'
import {
  User as UserIcon, LogOut, Building2, Briefcase, Cpu,
  Inbox, Search, Star, Upload, MessageCircle, Send,
  CheckCircle, ChevronRight, Sparkles, BarChart2, Target, Bookmark, Zap,
} from 'lucide-react'
import RecommendationFeed from '../components/RecommendationFeed'

type AppDashboardProps = {
  user: User
  onLogout: () => void
}

const STAGE_OPTIONS = ['idea', 'mvp', 'growth', 'scale'] as const

export default function AppDashboard({ user, onLogout }: AppDashboardProps) {
  const [tab, setTab] = useState('profile')
  const [startupProfile, setStartupProfile]   = useState<StartupProfile | null>(null)
  const [startupForm, setStartupForm]         = useState({ startupName: '', industry: '', description: '', fundingNeeded: '250000', teamSize: '5', stage: 'mvp' as Stage, pitchDeckName: '' })
  const [savingStartup, setSavingStartup]     = useState(false)
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null)
  const [investorForm, setInvestorForm]       = useState({ investmentSectors: '', investmentAmount: '500000', preferredStage: 'growth' as Stage })
  const [savingInvestor, setSavingInvestor]   = useState(false)
  const [allStartups, setAllStartups]         = useState<StartupProfile[]>([])
  const [bookmarkedStartups, setBookmarkedStartups] = useState<StartupProfile[]>([])
  const bookmarkedIds = useMemo(() => new Set(bookmarkedStartups.map(s => s.userId)), [bookmarkedStartups])
  const [conversations, setConversations]     = useState<ChatConversation[]>([])
  const [activeChatId, setActiveChatId]       = useState<string | null>(null)
  const [activeMessages, setActiveMessages]   = useState<ChatMessage[]>([])
  const [chatInput, setChatInput]             = useState('')
  const [searchIndustry, setSearchIndustry]   = useState('')
  const [searchStage, setSearchStage]         = useState('')
  const [searchFunding, setSearchFunding]     = useState('')
  const [msgMap, setMsgMap]   = useState<Record<string, string>>({})
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({})
  const [toast, setToast]     = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    if (user.role === 'startup') {
      api.getMyStartup().then(({ profile }) => {
        if (profile) { setStartupProfile(profile); setStartupForm({ startupName: profile.startupName, industry: profile.industry, description: profile.description, fundingNeeded: String(profile.fundingNeeded), teamSize: String(profile.teamSize), stage: profile.stage, pitchDeckName: profile.pitchDeckName }) }
      }).catch(console.error)
      api.getConversations().then(({ conversations }) => setConversations(conversations)).catch(console.error)
    }
    if (user.role === 'investor') {
      api.getMyInvestor().then(({ profile }) => {
        if (profile) { setInvestorProfile(profile); setInvestorForm({ investmentSectors: profile.investmentSectors.join(', '), investmentAmount: String(profile.investmentAmount), preferredStage: profile.preferredStage }) }
      }).catch(console.error)
      api.getStartups().then(({ startups }) => setAllStartups(startups)).catch(console.error)
      api.getBookmarks().then(({ startups }) => setBookmarkedStartups(startups)).catch(console.error)
      api.getConversations().then(({ conversations }) => setConversations(conversations)).catch(console.error)
    }
  }, [user])

  useEffect(() => {
    if (activeChatId) {
      api.getMessages(activeChatId).then(({ messages }) => setActiveMessages(messages)).catch(console.error)
      api.markAsRead(activeChatId).then(() => {
        setConversations(prev => prev.map(c => c.userId === activeChatId ? { ...c, unreadCount: 0 } : c))
      }).catch(console.error)
    }
  }, [activeChatId])

  async function handleSendChat(e: FormEvent) {
    e.preventDefault()
    if (!activeChatId || !chatInput.trim()) return
    try {
      const { message } = await api.sendMessage({ receiverId: activeChatId, text: chatInput })
      setActiveMessages(prev => [...prev, message])
      setChatInput('')
      const { conversations: convs } = await api.getConversations()
      setConversations(convs)
    } catch (err) { console.error(err) }
  }

  async function saveStartup(e: FormEvent) {
    e.preventDefault()
    if (!startupForm.startupName.trim() || !startupForm.industry.trim() || !startupForm.description.trim()) return
    setSavingStartup(true)
    try {
      const { profile } = await api.saveStartup({ startupName: startupForm.startupName.trim(), industry: startupForm.industry.trim(), description: startupForm.description.trim(), fundingNeeded: Number(startupForm.fundingNeeded), teamSize: Number(startupForm.teamSize), stage: startupForm.stage, pitchDeckName: startupForm.pitchDeckName })
      setStartupProfile(profile)
      showToast('Startup profile saved successfully!')
    } catch (err) { console.error(err) }
    finally { setSavingStartup(false) }
  }

  async function saveInvestor(e: FormEvent) {
    e.preventDefault()
    setSavingInvestor(true)
    try {
      const { profile } = await api.saveInvestor({ investmentSectors: investorForm.investmentSectors.split(',').map(x => x.trim()).filter(Boolean), investmentAmount: Number(investorForm.investmentAmount), preferredStage: investorForm.preferredStage })
      setInvestorProfile(profile)
      showToast('Investor profile saved successfully!')
    } catch (err) { console.error(err) }
    finally { setSavingInvestor(false) }
  }

  async function sendRequest(startupUserId: string) {
    const msg = (msgMap[startupUserId] ?? '').trim()
    if (!msg) return
    try {
      await api.sendMessage({ receiverId: startupUserId, text: msg })
      setMsgMap(c => ({ ...c, [startupUserId]: '' }))
      setSentMap(c => ({ ...c, [startupUserId]: true }))
      setTimeout(() => setSentMap(c => ({ ...c, [startupUserId]: false })), 2500)
      const { conversations: convs } = await api.getConversations()
      setConversations(convs)
    } catch (err) { console.error(err) }
  }

  async function toggleBookmark(startup: StartupProfile) {
    try {
      const { bookmarked } = await api.toggleBookmark({ startupUserId: startup.userId })
      if (bookmarked) {
        setBookmarkedStartups(prev => [...prev, startup])
      } else {
        setBookmarkedStartups(prev => prev.filter(s => s.userId !== startup.userId))
      }
    } catch (err) { console.error(err) }
  }

  const fetchStartups = useCallback(async () => {
    const { startups } = await api.getStartups({ industry: searchIndustry || undefined, stage: searchStage || undefined, maxFunding: searchFunding ? Number(searchFunding) : undefined })
    setAllStartups(startups)
  }, [searchIndustry, searchStage, searchFunding])

  useEffect(() => { if (user.role === 'investor') fetchStartups() }, [searchIndustry, searchStage, searchFunding, user.role])

  const visibleStartups  = useMemo(() => allStartups.map(s => ({ s, score: calcSuccess(s) })), [allStartups])
  
  const successScore = startupProfile ? calcSuccess(startupProfile) : 0
  const sectors      = investorProfile?.investmentSectors ?? []

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  const tabs = user.role === 'startup'
    ? [
        { key: 'profile',    label: 'My Profile',  Icon: Building2 },
        { key: 'prediction', label: 'ML Score',     Icon: Cpu },
        { key: 'matches',    label: 'Investor Matches', Icon: Zap },
        { key: 'messages',   label: `Messages${totalUnread ? ` (${totalUnread})` : ''}`, Icon: MessageCircle },
      ]
    : [
        { key: 'profile',     label: 'My Profile',    Icon: Briefcase },
        { key: 'search',      label: 'Search',         Icon: Search },
        { key: 'recommended', label: 'Recommended',    Icon: Star },
        { key: 'bookmarked',  label: 'Bookmarked',     Icon: Bookmark },
        { key: 'messages',    label: `Messages${totalUnread ? ` (${totalUnread})` : ''}`, Icon: MessageCircle },
      ]

  /* ── shared styles in a style tag ── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    .dash-field-input, .dash-field-select, .dash-field-textarea {
      width: 100%;
      background: #fff;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 11px 14px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.88rem;
      color: #0F172A;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .dash-field-input::placeholder, .dash-field-textarea::placeholder { color: #94A3B8; }
    .dash-field-input:focus, .dash-field-select:focus, .dash-field-textarea:focus {
      border-color: #4F7EF7;
      box-shadow: 0 0 0 3px rgba(79,126,247,0.11);
    }
    .dash-field-select { appearance: none; cursor: pointer; }
    .dash-field-textarea { resize: vertical; }

    .dash-save-btn {
      background: linear-gradient(135deg, #4F7EF7 0%, #7B5EF8 100%);
      color: #fff; border: none; border-radius: 100px;
      padding: 12px 28px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.84rem; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 7px;
      box-shadow: 0 4px 16px rgba(79,126,247,0.32);
      transition: opacity 0.15s, transform 0.12s;
    }
    .dash-save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .dash-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .dash-tab-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: transparent; border: none;
      padding: 10px 18px; border-radius: 100px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.82rem; font-weight: 600; color: #64748B;
      cursor: pointer; transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .dash-tab-btn:hover { background: rgba(79,126,247,0.07); color: #4F7EF7; }
    .dash-tab-btn.active {
      background: rgba(79,126,247,0.10); color: #4F7EF7;
      box-shadow: 0 0 0 1px rgba(79,126,247,0.18);
    }

    .dash-factor-bar-track { height: 6px; background: #EDF1F8; border-radius: 99px; overflow: hidden; flex: 1; }
    .dash-factor-bar-fill { height: 100%; background: linear-gradient(90deg, #4F7EF7, #7B5EF8); border-radius: 99px; transition: width 0.6s cubic-bezier(.4,0,.2,1); }

    .sector-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(79,126,247,0.08); color: #4F7EF7;
      border: 1px solid rgba(79,126,247,0.18); border-radius: 100px;
      padding: 4px 12px; font-size: 0.72rem; font-weight: 700;
    }

    .inbox-item {
      background: rgba(255,255,255,0.85);
      border: 1px solid rgba(255,255,255,0.95);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 12px rgba(99,120,180,0.07);
      transition: transform 0.18s;
    }
    .inbox-item:hover { transform: translateY(-2px); }

    .empty-box {
      text-align: center; padding: 5rem 2rem;
      color: #94A3B8;
    }
    .empty-box-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: #EDF1F8;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
    }

    .glass-panel {
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.95);
      border-radius: 20px;
      box-shadow: 0 2px 20px rgba(99,120,180,0.09);
      padding: 2rem;
    }

    .chat-bubble {
      max-width: 80%; padding: 10px 14px; border-radius: 14px;
      font-size: 0.88rem; line-height: 1.5; margin-bottom: 8px;
    }
    .chat-bubble.sent {
      background: #4F7EF7; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end;
    }
    .chat-bubble.received {
      background: #F1F5F9; color: #0F172A; border-bottom-left-radius: 4px; align-self: flex-start;
    }
    .conv-item {
      padding: 1rem; border-bottom: 1px solid #E2E8F0; cursor: pointer; transition: background 0.15s;
    }
    .conv-item:hover { background: #F8FAFF; }
    .conv-item.active { background: rgba(79,126,247,0.06); border-left: 3px solid #4F7EF7; }

    @keyframes dashFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dash-enter { animation: dashFadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
  `

  const fieldLabel = (text: string) => (
    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{text}</label>
  )

  const chatUI = (
    <div className="glass-panel dash-enter" style={{ padding: 0, overflow: 'hidden', display: 'flex', height: 600 }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.5)' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Messages</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!conversations.length ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8' }}>No active conversations</div>
          ) : (
            conversations.map(c => (
              <div key={c.userId} className={`conv-item ${activeChatId === c.userId ? 'active' : ''}`} onClick={() => setActiveChatId(c.userId)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{c.userName}</span>
                  {c.unreadCount > 0 && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4F7EF7', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: c.unreadCount > 0 ? '#0F172A' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: c.unreadCount > 0 ? 700 : 400 }}>
                  {c.lastMessage}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {!activeChatId ? (
          <div className="empty-box" style={{ margin: 'auto' }}>
            <div className="empty-box-icon"><MessageCircle size={24} strokeWidth={1.5} color="#94A3B8" /></div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Select a conversation to start chatting</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                {conversations.find(c => c.userId === activeChatId)?.userName?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{conversations.find(c => c.userId === activeChatId)?.userName}</span>
            </div>
            {/* Messages */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {activeMessages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.senderId === user.id ? 'sent' : 'received'}`}>
                  {m.text}
                </div>
              ))}
            </div>
            {/* Input */}
            <form onSubmit={handleSendChat} style={{ padding: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
              <input className="dash-field-input" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" disabled={!chatInput.trim()} style={{
                background: '#4F7EF7', color: '#fff', border: 'none', borderRadius: 12, padding: '0 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.15s'
              }}>
                <Send size={18} strokeWidth={2} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDF1F8',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingTop: 62,
      position: 'relative',
    }}>
      <style>{css}</style>

      {/* dashed grid bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(99,130,200,0.07) 0px, rgba(99,130,200,0.07) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(180deg, rgba(99,130,200,0.07) 0px, rgba(99,130,200,0.07) 1px, transparent 1px, transparent 64px)',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* ── USER BAR ── */}
        <div className="glass-panel dash-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F7EF7, #7B5EF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 2px 10px rgba(79,126,247,0.3)',
            }}>
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{user.name}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.7rem', fontWeight: 700,
                color: user.role === 'startup' ? '#4F7EF7' : '#7B5EF8',
                background: user.role === 'startup' ? 'rgba(79,126,247,0.08)' : 'rgba(123,94,248,0.08)',
                borderRadius: 100, padding: '3px 10px',
                marginTop: 2,
              }}>
                {user.role === 'startup' ? <Building2 size={10} strokeWidth={2.5} /> : <Briefcase size={10} strokeWidth={2.5} />}
                {user.role === 'startup' ? 'Startup' : 'Investor'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1.5px solid #E2E8F0',
              borderRadius: 100, padding: '8px 16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.78rem', fontWeight: 600, color: '#94A3B8', cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0' }}
          >
            <LogOut size={12} strokeWidth={2} />
            Sign out
          </button>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: 'flex', gap: 4, background: 'rgba(255,255,255,0.65)',
          border: '1px solid rgba(255,255,255,0.9)', borderRadius: 100,
          padding: 4, marginBottom: '1.5rem', backdropFilter: 'blur(8px)',
          width: 'fit-content', boxShadow: '0 2px 12px rgba(99,120,180,0.08)',
        }}>
          {tabs.map(t => (
            <button key={t.key} className={`dash-tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <t.Icon size={14} strokeWidth={2} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════ STARTUP VIEWS */}
        {user.role === 'startup' && (
          <>
            {/* PROFILE */}
            {tab === 'profile' && (
              <div className="glass-panel dash-enter">
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>Startup Profile</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Your public-facing profile shown to investors</p>
                </div>
                <form onSubmit={saveStartup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    {fieldLabel('Startup Name')}
                    <input className="dash-field-input" placeholder="Acme Corp" value={startupForm.startupName} onChange={e => setStartupForm(c => ({ ...c, startupName: e.target.value }))} />
                  </div>
                  <div>
                    {fieldLabel('Industry')}
                    <input className="dash-field-input" placeholder="FinTech" value={startupForm.industry} onChange={e => setStartupForm(c => ({ ...c, industry: e.target.value }))} />
                  </div>
                  <div>
                    {fieldLabel('Funding Needed (USD)')}
                    <input className="dash-field-input" type="number" min={0} value={startupForm.fundingNeeded} onChange={e => setStartupForm(c => ({ ...c, fundingNeeded: e.target.value }))} />
                  </div>
                  <div>
                    {fieldLabel('Team Size')}
                    <input className="dash-field-input" type="number" min={1} value={startupForm.teamSize} onChange={e => setStartupForm(c => ({ ...c, teamSize: e.target.value }))} />
                  </div>
                  <div>
                    {fieldLabel('Stage')}
                    <select className="dash-field-select" value={startupForm.stage} onChange={e => setStartupForm(c => ({ ...c, stage: e.target.value as Stage }))}>
                      {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    {fieldLabel('Pitch Deck')}
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 6, border: '2px dashed #CBD5E1', borderRadius: 12, padding: '1.25rem',
                      cursor: 'pointer', background: '#F8FAFF', transition: 'border-color 0.15s',
                    }}>
                      <input type="file" accept=".pdf,.ppt,.pptx" style={{ display: 'none' }}
                        onChange={e => setStartupForm(c => ({ ...c, pitchDeckName: e.target.files?.[0]?.name ?? '' }))} />
                      <Upload size={18} strokeWidth={2} color="#94A3B8" />
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                        {startupForm.pitchDeckName
                          ? <span style={{ color: '#22C55E', fontWeight: 700 }}>✓ {startupForm.pitchDeckName}</span>
                          : <><strong>Click to upload</strong> · PDF or PPT</>}
                      </span>
                    </label>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {fieldLabel('Description')}
                    <textarea className="dash-field-textarea" rows={4}
                      placeholder="Describe your startup, the problem you solve, and your traction…"
                      value={startupForm.description} onChange={e => setStartupForm(c => ({ ...c, description: e.target.value }))} />
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 5 }}>{startupForm.description.length} chars — aim for 200+</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="dash-save-btn" disabled={savingStartup}>
                      {savingStartup ? 'Saving…' : 'Save profile'}
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ML SCORE */}
            {tab === 'prediction' && (
              <div className="glass-panel dash-enter">
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>ML Success Prediction</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Algorithmic estimate based on profile quality, stage, team and funding</p>
                </div>
                {!startupProfile ? (
                  <div className="empty-box">
                    <div className="empty-box-icon"><Cpu size={24} strokeWidth={1.5} color="#94A3B8" /></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Complete your startup profile to receive your ML success score.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* big score */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(79,126,247,0.07), rgba(123,94,248,0.07))',
                      border: '1px solid rgba(79,126,247,0.15)',
                      borderRadius: 20, padding: '2.5rem',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    }}>
                      <div style={{ position: 'relative', width: 120, height: 120 }}>
                        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                          <circle cx="60" cy="60" r="50" fill="none"
                            stroke="url(#scoreGrad)" strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - successScore / 100)}`}
                            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
                          />
                          <defs>
                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4F7EF7" />
                              <stop offset="100%" stopColor="#7B5EF8" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>{successScore}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>%</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748B' }}>Predicted success probability</div>
                    </div>

                    {/* factor bars */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {[
                        { name: 'Stage',       val: Math.round(stageFactor[startupProfile.stage] * 100), Icon: Target },
                        { name: 'Team',        val: Math.round(clamp(startupProfile.teamSize / 30) * 100), Icon: UserIcon },
                        { name: 'Funding Fit', val: Math.round(clamp(1 - startupProfile.fundingNeeded / 2_000_000) * 100), Icon: BarChart2 },
                        { name: 'Profile',     val: Math.round(clamp(startupProfile.description.length / 600) * 100), Icon: Building2 },
                      ].map(f => (
                        <div key={f.name} style={{
                          background: '#fff', borderRadius: 14, padding: '1rem 1.25rem',
                          border: '1px solid #F1F5F9',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>
                              <f.Icon size={14} strokeWidth={2} color="#4F7EF7" />
                              {f.name}
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F7EF7' }}>{f.val}%</span>
                          </div>
                          <div className="dash-factor-bar-track">
                            <div className="dash-factor-bar-fill" style={{ width: `${f.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES */}
            {tab === 'messages' && chatUI}

            {/* MATCHES (ML RECOMMENDATIONS) */}
            {tab === 'matches' && (
              <div className="dash-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>Investor Matches</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Recommended investors based on your industry, stage, and funding needs</p>
                </div>
                {!startupProfile ? (
                  <div className="glass-panel empty-box">
                    <div className="empty-box-icon"><Briefcase size={24} strokeWidth={1.5} color="#94A3B8" /></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Complete your startup profile to see matches.</div>
                  </div>
                ) : (
                  <RecommendationFeed 
                    user={user} 
                    onSendMessage={(rid, txt) => api.sendMessage({ receiverId: rid, text: txt }).then(() => {})}
                    bookmarkedIds={new Set()}
                    onToggleBookmark={async () => {}}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════ INVESTOR VIEWS */}
        {user.role === 'investor' && (
          <>
            {tab === 'profile' && (
              <div className="glass-panel dash-enter">
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>Investor Profile</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Set your preferences to get personalised recommendations</p>
                </div>
                <form onSubmit={saveInvestor} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    {fieldLabel('Investment Sectors')}
                    <input className="dash-field-input" placeholder="FinTech, HealthTech, AI, SaaS …"
                      value={investorForm.investmentSectors} onChange={e => setInvestorForm(c => ({ ...c, investmentSectors: e.target.value }))} />
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 5 }}>Comma-separated list</div>
                    {sectors.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {sectors.map(s => <span key={s} className="sector-pill"><CheckCircle size={10} strokeWidth={2.5} />{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      {fieldLabel('Investment Amount (USD)')}
                      <input className="dash-field-input" type="number" min={0} value={investorForm.investmentAmount} onChange={e => setInvestorForm(c => ({ ...c, investmentAmount: e.target.value }))} />
                    </div>
                    <div>
                      {fieldLabel('Preferred Stage')}
                      <select className="dash-field-select" value={investorForm.preferredStage} onChange={e => setInvestorForm(c => ({ ...c, preferredStage: e.target.value as Stage }))}>
                        {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <button type="submit" className="dash-save-btn" disabled={savingInvestor}>
                      {savingInvestor ? 'Saving…' : 'Save profile'}
                      <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'search' && (
              <div className="dash-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>Search Startups</h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Browse all startups and send connection requests</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                      {fieldLabel('Industry')}
                      <input className="dash-field-input" placeholder="e.g. FinTech" value={searchIndustry} onChange={e => setSearchIndustry(e.target.value)} />
                    </div>
                    <div>
                      {fieldLabel('Stage')}
                      <select className="dash-field-select" value={searchStage} onChange={e => setSearchStage(e.target.value)}>
                        <option value="">Any stage</option>
                        {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      {fieldLabel('Max Funding (USD)')}
                      <input className="dash-field-input" type="number" min={0} placeholder="No limit" value={searchFunding} onChange={e => setSearchFunding(e.target.value)} />
                    </div>
                  </div>
                </div>
                {!visibleStartups.length ? (
                  <div className="glass-panel empty-box">
                    <div className="empty-box-icon"><Search size={24} strokeWidth={1.5} color="#94A3B8" /></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>No startups found for these filters.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {visibleStartups.map(({ s, score }) => (
                      <StartupCard key={s.userId} s={s} score={score} owner={s.userId}
                        msg={msgMap[s.userId] ?? ''} onMsg={v => setMsgMap(c => ({ ...c, [s.userId]: v }))}
                        onSend={() => sendRequest(s.userId)} sent={sentMap[s.userId] ?? false}
                        bookmarked={bookmarkedIds.has(s.userId)} onToggleBookmark={() => toggleBookmark(s)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'recommended' && (
              <div className="dash-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>Recommended for You</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Top startups ranked by compatibility with your investor profile and behavior</p>
                </div>
                {!investorProfile ? (
                  <div className="glass-panel empty-box">
                    <div className="empty-box-icon"><Star size={24} strokeWidth={1.5} color="#94A3B8" /></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Set up your investor profile first to see personalised recommendations.</div>
                  </div>
                ) : (
                  <RecommendationFeed 
                    user={user} 
                    onSendMessage={(rid, txt) => api.sendMessage({ receiverId: rid, text: txt }).then(() => {})}
                    bookmarkedIds={bookmarkedIds}
                    onToggleBookmark={toggleBookmark}
                  />
                )}
              </div>
            )}

            {tab === 'bookmarked' && (
              <div className="dash-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 0.3rem' }}>Bookmarked Startups</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Startups you've saved to keep an eye on</p>
                </div>
                {!bookmarkedStartups.length ? (
                  <div className="glass-panel empty-box">
                    <div className="empty-box-icon"><Bookmark size={24} strokeWidth={1.5} color="#94A3B8" /></div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>You haven't bookmarked any startups yet.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {bookmarkedStartups.map((s) => (
                      <StartupCard key={`book_${s.userId}`} s={s} score={calcSuccess(s)} owner={s.userId}
                        msg={msgMap[s.userId] ?? ''} onMsg={v => setMsgMap(c => ({ ...c, [s.userId]: v }))}
                        onSend={() => sendRequest(s.userId)} sent={sentMap[s.userId] ?? false}
                        bookmarked={true} onToggleBookmark={() => toggleBookmark(s)} />
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* MESSAGES */}
            {tab === 'messages' && chatUI}
          </>
        )}
      </div>

      {toast && (
        <div className="dash-enter" style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: '#10B981', color: '#fff', padding: '12px 24px',
          borderRadius: 100, fontSize: '0.85rem', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle size={16} strokeWidth={2.5} />
          {toast}
        </div>
      )}
    </div>
  )
}