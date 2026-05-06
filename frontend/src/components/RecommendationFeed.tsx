import { useEffect, useState } from 'react'
import axios from 'axios'
import type { User, StartupProfile } from '../types/types'
import StartupCard from './StartupCard'
import InvestorCard from './InvestorCard'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

type RecommendationFeedProps = {
  user: User
  onSendMessage: (receiverId: string, text: string) => Promise<void>
  bookmarkedIds: Set<string>
  onToggleBookmark: (startup: StartupProfile) => Promise<void>
}

export default function RecommendationFeed({ user, onSendMessage, bookmarkedIds, onToggleBookmark }: RecommendationFeedProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msgMap, setMsgMap] = useState<Record<string, string>>({})
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({})

  const fetchRecommendations = async () => {
    setLoading(true)
    setError('')
    try {
      // Assuming ML service runs on localhost:8000
      const res = await axios.post('http://localhost:8000/recommend', {
        userId: user.id,
        role: user.role,
        count: 6
      })
      setRecommendations(res.data.recommendations)
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err)
      setError('Could not connect to the recommendation service. Make sure it is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [user.id, user.role])

  async function handleSend(userId: string) {
    const text = msgMap[userId] || ''
    if (!text.trim()) return
    try {
      await onSendMessage(userId, text)
      setMsgMap(prev => ({ ...prev, [userId]: '' }))
      setSentMap(prev => ({ ...prev, [userId]: true }))
      setTimeout(() => setSentMap(prev => ({ ...prev, [userId]: false })), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem', color: '#64748B' }}>
        <Loader2 className="animate-spin" size={32} strokeWidth={1.5} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Curating your personalized matches...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#991B1B' }}>
        <div style={{ background: '#FEE2E2', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <AlertCircle size={24} />
        </div>
        <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Service Offline</div>
        <div style={{ fontSize: '0.85rem' }}>{error}</div>
        <button 
          onClick={fetchRecommendations}
          style={{ marginTop: '1rem', background: '#991B1B', color: '#fff', border: 'none', borderRadius: 100, padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!recommendations.length) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
        <div style={{ background: '#F1F5F9', width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Sparkles size={24} color="#94A3B8" />
        </div>
        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No recommendations yet</div>
        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Try updating your profile or interacting with more content to see matches.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
      {recommendations.map((rec, idx) => {
        if (user.role === 'investor') {
          const s = rec.startup
          return (
            <StartupCard 
              key={`rec_${s.userId}_${idx}`} 
              s={s} 
              score={Math.round(rec.score * 100)} 
              matchScore={Math.round(rec.score * 100)}
              owner={s.userId}
              msg={msgMap[s.userId] || ''}
              onMsg={(v) => setMsgMap(prev => ({ ...prev, [s.userId]: v }))}
              onSend={() => handleSend(s.userId)}
              sent={sentMap[s.userId] || false}
              bookmarked={bookmarkedIds.has(s.userId)}
              onToggleBookmark={() => onToggleBookmark(s)}
            />
          )
        } else {
          const inv = rec.investor
          return (
            <InvestorCard 
              key={`rec_${inv.userId}_${idx}`}
              i={inv}
              score={Math.round(rec.score * 100)}
              owner={inv.userId}
              msg={msgMap[inv.userId] || ''}
              onMsg={(v) => setMsgMap(prev => ({ ...prev, [inv.userId]: v }))}
              onSend={() => handleSend(inv.userId)}
              sent={sentMap[inv.userId] || false}
            />
          )
        }
      })}
    </div>
  )
}
