import { Briefcase, DollarSign, Zap, Send, CheckCircle, Target, User } from 'lucide-react'
import type { InvestorProfile } from '../utils/api'
import { fmt } from '../utils/ml'

type InvestorCardProps = {
  i: InvestorProfile
  score: number
  owner: string
  msg: string
  onMsg: (v: string) => void
  onSend: () => void
  sent: boolean
}

export default function InvestorCard({ i, score, owner, msg, onMsg, onSend, sent }: InvestorCardProps) {
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
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(123,94,248,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(99,120,180,0.08)'
      }}
    >
      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7B5EF8, #4F7EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
             <User size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {i.name || 'Potential Investor'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>ID: {owner.slice(0, 8)}…</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'linear-gradient(135deg, rgba(123,94,248,0.10), rgba(79,126,247,0.10))',
          border: '1px solid rgba(123,94,248,0.18)',
          borderRadius: 100, padding: '5px 10px',
        }}>
          <Zap size={11} strokeWidth={2.5} color="#7B5EF8" />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7B5EF8' }}>{score}% Match</span>
        </div>
      </div>

      {/* sectors */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {i.investmentSectors.map(s => (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(123,94,248,0.08)', color: '#7B5EF8',
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            borderRadius: 100, padding: '4px 10px',
            border: '1px solid rgba(123,94,248,0.15)',
          }}>
            {s}
          </span>
        ))}
      </div>

      {/* meta info */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            <DollarSign size={10} strokeWidth={2.5} /> Ticket Size
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{fmt(i.investmentAmount)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            <Target size={10} strokeWidth={2.5} /> Focus Stage
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>{i.preferredStage}</div>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
        Active investor seeking opportunities in {i.investmentSectors.join(', ')}. Interested in {i.preferredStage} stage startups.
      </p>

      {/* contact area */}
      <div style={{
        borderTop: '1px solid #F1F5F9', paddingTop: '1rem',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <textarea
          rows={2}
          placeholder="Introduce your startup and pitch…"
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
          onFocus={e => { e.currentTarget.style.borderColor = '#7B5EF8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,94,248,0.10)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
        />
        <button
          onClick={onSend}
          disabled={!msg.trim()}
          style={{
            background: sent
              ? 'linear-gradient(135deg, #22C55E, #16A34A)'
              : 'linear-gradient(135deg, #7B5EF8, #4F7EF7)',
            color: '#fff', border: 'none', borderRadius: 100,
            padding: '10px 18px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.8rem', fontWeight: 700, cursor: !msg.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: !msg.trim() ? 0.5 : 1,
            boxShadow: sent ? '0 2px 12px rgba(34,197,94,0.3)' : '0 2px 12px rgba(123,94,248,0.3)',
            transition: 'opacity 0.15s, transform 0.12s',
          }}
          onMouseEnter={e => { if (msg.trim()) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
        >
          {sent
            ? <><CheckCircle size={13} strokeWidth={2.5} /> Request Sent!</>
            : <><Send size={13} strokeWidth={2.5} /> Pitch to Investor</>}
        </button>
      </div>
    </div>
  )
}
