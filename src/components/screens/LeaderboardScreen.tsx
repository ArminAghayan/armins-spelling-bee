'use client'
import { avatarColor } from '@/lib/words'
import type { HofScore } from '@/lib/supabase'

interface Props {
  data: HofScore[]
  myName: string
  onBack: () => void
}

export default function LeaderboardScreen({ data, myName, onBack }: Props) {
  const best: Record<string, HofScore> = {}
  data.forEach(e => { if (!best[e.name] || e.score > best[e.name].score) best[e.name] = e })
  const ranked = Object.values(best).sort((a, b) => b.score - a.score).slice(0, 50)

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', padding: 0 }}>←</button>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Leaderboard</h2>
        </div>

        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '16px' }}>
          {ranked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#555', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>
              No scores yet — play a game!
            </div>
          ) : ranked.map((e, i) => {
            const bg = avatarColor(e.name)
            const isMe = e.name === myName
            const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#444'
            const date = e.created_at ? new Date(e.created_at) : null
            const ago = date ? formatAgo(date) : ''
            return (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < ranked.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: rankColor, minWidth: '28px', textAlign: 'center' }}>
                  {i < 3 ? ['1','2','3'][i] : `#${i+1}`}
                </span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {e.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: isMe ? 700 : 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMe ? '★ ' : ''}{e.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#444', fontFamily: 'Space Mono, monospace', marginTop: '2px', display: 'flex', gap: '8px' }}>
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

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#333', fontFamily: 'Space Mono, monospace' }}>
          Ranked scores only · stored in Supabase
        </div>
      </div>
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
