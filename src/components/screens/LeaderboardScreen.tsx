'use client'
import { useState } from 'react'
import { avatarColor } from '@/lib/words'
import type { HofScore } from '@/lib/supabase'
import PlayerStatsModal from '@/components/ui/PlayerStatsModal'

interface Props {
  data: HofScore[]
  myName: string
  onBack: () => void
}

export default function LeaderboardScreen({ data, myName, onBack }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string; userId?: string } | null>(null)

  const best: Record<string, HofScore> = {}
  data.forEach(e => { if (!best[e.name] || e.score > best[e.name].score) best[e.name] = e })
  const ranked = Object.values(best).sort((a, b) => b.score - a.score).slice(0, 50)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9990, padding: '20px', overflowY: 'auto' }}
      onClick={onBack}
    >
      <div
        style={{ width: '100%', maxWidth: '480px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px 20px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Leaderboard</h2>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px', transition: 'color .12s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ranked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>
              No scores yet — play a game!
            </div>
          ) : ranked.map((e, i) => {
            const bg = avatarColor(e.name)
            const isMe = e.name === myName
            const rankColor = i === 0 ? '#f59e0b' : i === 1 ? 'var(--text2)' : i === 2 ? '#cd7f32' : 'var(--text5)'
            const date = e.created_at ? new Date(e.created_at) : null
            const ago = date ? formatAgo(date) : ''
            return (
              <div key={e.name}
                onClick={() => setSelectedPlayer({ name: e.name, userId: e.user_id })}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderBottom: i < ranked.length - 1 ? '1px solid var(--surface2)' : 'none', cursor: 'pointer', borderRadius: '8px', transition: 'background .1s' }}
                onMouseEnter={e2 => (e2.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e2 => (e2.currentTarget.style.background = 'transparent')}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: rankColor, minWidth: '28px', textAlign: 'center' }}>
                  {i < 3 ? ['1','2','3'][i] : `#${i+1}`}
                </span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {e.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: isMe ? 700 : 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMe ? '★ ' : ''}{e.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace', marginTop: '2px', display: 'flex', gap: '8px' }}>
                    <span>{e.words || 0} words</span>
                    {ago && <span>{ago}</span>}
                  </div>
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>
                  {e.score}
                </div>
              </div>
            )
          })}
        </div>

       
      </div>

      {selectedPlayer && (
        <PlayerStatsModal
          name={selectedPlayer.name}
          userId={selectedPlayer.userId}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

function formatAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
