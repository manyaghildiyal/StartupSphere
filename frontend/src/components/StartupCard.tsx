import { Users, DollarSign, Zap, Send, CheckCircle, TrendingUp, Bookmark } from 'lucide-react'
import type { StartupProfile } from '../types/types'
import StageChip from './StageChip'
import { fmt } from '../utils/ml'

type StartupCardProps = {
  s: StartupProfile
  score: number
  matchScore?: number
  owner: string
  msg: string
  onMsg: (v: string) => void
  onSend: () => void
  sent: boolean
  bookmarked?: boolean
  onToggleBookmark?: () => void
}

const STAGE_COLORS: Record<string, string> = {
  idea: '#F59E0B', mvp: '#4F7EF7', growth: '#22C55E', scale: '#A855F7',
}

export default function StartupCard({ s, score, matchScore, owner, msg, onMsg, onSend, sent, bookmarked, onToggleBookmark }: StartupCardProps) {
  const stageColor = STAGE_COLORS[s.stage] ?? '#4F7EF7'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 20,
      padding: '1.5rem',
      boxShadow: '0 2px 16px rgba(99,120,180,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(79,126,247,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(99,120,180,0.08)'
      }}
    >
      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {s.startupName}
          </div>
          <span style={{
            display: 'inline-block',
            background: 'rgba(79,126,247,0.09)',
            color: '#4F7EF7',
            fontSize: '0.68rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            borderRadius: 100, padding: '3px 10px',
            border: '1px solid rgba(79,126,247,0.15)',
          }}>{s.industry}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {matchScore !== undefined && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(135deg, rgba(79,126,247,0.10), rgba(123,94,248,0.10))',
              border: '1px solid rgba(79,126,247,0.18)',
              borderRadius: 100, padding: '5px 10px', flexShrink: 0,
            }}>
              <Zap size={11} strokeWidth={2.5} color="#4F7EF7" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F7EF7' }}>{matchScore}%</span>
            </div>
          )}
          {onToggleBookmark && (
            <button
              onClick={onToggleBookmark}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: bookmarked ? '#4F7EF7' : '#CBD5E1',
                transition: 'color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              <Bookmark size={20} fill={bookmarked ? '#4F7EF7' : 'none'} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* meta pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: stageColor + '14', color: stageColor,
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          borderRadius: 100, padding: '4px 10px',
          border: `1px solid ${stageColor}28`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: stageColor }} />
          {s.stage}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: '#F8FAFF', color: '#64748B',
          fontSize: '0.7rem', fontWeight: 600,
          borderRadius: 100, padding: '4px 10px',
          border: '1px solid #E2E8F0',
        }}>
          <Users size={10} strokeWidth={2.5} />
          {s.teamSize} members
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: '#F8FAFF', color: '#64748B',
          fontSize: '0.7rem', fontWeight: 600,
          borderRadius: 100, padding: '4px 10px',
          border: '1px solid #E2E8F0',
        }}>
          <DollarSign size={10} strokeWidth={2.5} />
          {fmt(s.fundingNeeded)}
        </span>
      </div>

      {/* description */}
      {s.description && (
        <p style={{
          fontSize: '0.82rem', color: '#64748B', lineHeight: 1.7,
          margin: 0,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{s.description}</p>
      )}

      {/* ML score bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 700, color: '#374151' }}>
            <TrendingUp size={12} strokeWidth={2.5} color="#4F7EF7" />
            ML Score
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4F7EF7' }}>{score}%</span>
        </div>
        <div style={{ height: 6, background: '#EDF1F8', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${score}%`,
            background: 'linear-gradient(90deg, #4F7EF7, #7B5EF8)',
            borderRadius: 99,
            transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>

      {/* founder */}
      <div style={{ fontSize: '0.68rem', color: '#94A3B8', letterSpacing: '0.04em' }}>
        Founder ID: <span style={{ fontWeight: 600, color: '#CBD5E1' }}>{owner.slice(0, 8)}…</span>
      </div>

      {/* contact area */}
      <div style={{
        borderTop: '1px solid #F1F5F9', paddingTop: '1rem',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <textarea
          rows={2}
          placeholder={`Message ${s.startupName}…`}
          value={msg}
          onChange={e => onMsg(e.target.value)}
          style={{
            width: '100%', background: '#F8FAFF',
            border: '1.5px solid #E2E8F0', borderRadius: 12,
            padding: '10px 12px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.82rem', color: '#0F172A',
            resize: 'none', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#4F7EF7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,126,247,0.10)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
        />
        <button
          onClick={onSend}
          disabled={!msg.trim()}
          style={{
            background: sent
              ? 'linear-gradient(135deg, #22C55E, #16A34A)'
              : 'linear-gradient(135deg, #4F7EF7, #7B5EF8)',
            color: '#fff', border: 'none', borderRadius: 100,
            padding: '10px 18px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.8rem', fontWeight: 700, cursor: !msg.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: !msg.trim() ? 0.5 : 1,
            boxShadow: sent ? '0 2px 12px rgba(34,197,94,0.3)' : '0 2px 12px rgba(79,126,247,0.3)',
            transition: 'opacity 0.15s, transform 0.12s',
          }}
          onMouseEnter={e => { if (msg.trim()) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
        >
          {sent
            ? <><CheckCircle size={13} strokeWidth={2.5} /> Sent!</>
            : <><Send size={13} strokeWidth={2.5} /> Send request</>}
        </button>
      </div>
    </div>
  )
}