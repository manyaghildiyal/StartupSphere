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
}

export default function StartupCard({ s, score, matchScore, owner, msg, onMsg, onSend, sent }: StartupCardProps) {
  return (
    <div className="startup-card">
      <div className="card-top">
        <div className="card-name">{s.startupName}</div>
        <div className="card-industry-badge">{s.industry}</div>
      </div>
      <div className="card-meta">
        <StageChip stage={s.stage} />
        <span className="meta-pill">👥 {s.teamSize}</span>
        <span className="meta-pill">💰 {fmt(s.fundingNeeded)}</span>
        {matchScore !== undefined && (
          <span className="match-score-badge">⚡ {matchScore}% match</span>
        )}
      </div>
      {s.description && <div className="card-desc">{s.description}</div>}
      <div className="card-success-row">
        <span className="card-success-label">ML Score</span>
        <div className="card-success-bar">
          <div className="card-success-fill" style={{ width: `${score}%` }} />
        </div>
        <span className="card-success-pct">{score}%</span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Founder: {owner}</div>
      <div className="card-contact-area">
        <textarea
          className="field-textarea"
          rows={2}
          placeholder={`Message to ${s.startupName}…`}
          value={msg}
          onChange={e => onMsg(e.target.value)}
          style={{ fontSize: '0.82rem', minHeight: 60 }}
        />
        <button
          className={`btn ${sent ? 'btn-teal' : 'btn-primary'} btn-sm`}
          onClick={onSend}
          disabled={!msg.trim()}
        >
          {sent ? '✓ Sent!' : 'Send request →'}
        </button>
      </div>
    </div>
  )
}