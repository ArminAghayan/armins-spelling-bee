'use client'
import { avatarColor } from '@/lib/words'
import type { Player } from '@/lib/types'
import { IconEye, IconTrophy } from '@tabler/icons-react'

interface Props {
  scores: Record<string, { name: string; score: number; correct: number }>
  myId: string
  myName: string
  isRanked: boolean
  myStreak: number
  myLongestWord: string
  myAttempts: number
  onPlayAgain: () => void
  onLeave: () => void
  onOpenLeaderboard: () => void
}

export default function ResultsScreen({ scores, myId, isRanked, myStreak, myLongestWord, myAttempts, onPlayAgain, onLeave, onOpenLeaderboard }: Props) {
  const all = Object.entries(scores).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.score - a.score)
  const myFinal = scores[myId] || { score: 0, correct: 0 }
  const myRank = all.findIndex(p => p.id === myId) + 1

  const top3 = all.slice(0, 3)
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [null, top3[0]]
  const podiumMedal = ['🥈', '🥇', '🥉']
  const podiumHeight = [52, 76, 36]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: '860px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Game Over</h1>
          <div style={{ display: 'inline-block', fontSize: '11px', padding: '3px 12px', borderRadius: '20px', border: '1px solid var(--border)', color: 'var(--text5)' }}>
            {isRanked ? 'Ranked — saved to leaderboard' : 'Casual'}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── LEFT: Leaderboard ── */}
          <div>
            {/* Podium */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 16px 0', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '16px' }}>Podium</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px' }}>
                {podiumOrder.map((p, i) => {
                  if (!p) return null
                  const bg = avatarColor(p.name)
                  const isGold = i === 1
                  return (
                    <div key={p.id} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 6px', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                        {p.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {p.id === myId ? 'You' : p.name}
                      </div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: 'var(--text5)', marginBottom: '6px' }}>
                        {p.score} pts
                      </div>
                      <div style={{ height: `${podiumHeight[i]}px`, borderRadius: '8px 8px 0 0', background: isGold ? 'var(--accent-pale)' : 'var(--surface2)', border: `1px solid ${isGold ? '#78350f' : 'var(--border)'}`, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        {podiumMedal[i]}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* This Game scores */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>This Game</div>
                <button onClick={onOpenLeaderboard}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text5)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 9px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.borderColor = '#f59e0b' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text5)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                  <IconEye size={11} stroke={1.5} />
                   Global Leaderboard
                </button>
              </div>
              {all.map((p, i) => {
                const bg = avatarColor(p.name)
                const isMe = p.id === myId
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: i < all.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: 'var(--text6)', width: '16px', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                      {p.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: isMe ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isMe ? `You (${p.name})` : p.name}
                    </span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>{p.score}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT: Stats + Actions ── */}
          <div>
            {/* Stats */}
            {(() => {
              const accuracy = myAttempts > 0 ? Math.round((myFinal.correct / myAttempts) * 100) : 0
              const stats: [string | number, string][] = [
                [myFinal.score,                          'Points'],
                [myFinal.correct,                        'Correct'],
                [`#${myRank || '?'}`,                    'Rank'],
                [`${accuracy}%`,                         'Accuracy'],
                [myStreak,                               'Best Streak'],
                [myLongestWord || '—',                   'Longest Word'],
              ]
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {stats.map(([val, lbl]) => (
                    <div key={lbl} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '11px', padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: lbl === 'Longest Word' ? '13px' : '19px', fontWeight: 700, color: '#f59e0b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text5)', marginTop: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Actions */}
            <button onClick={onPlayAgain}
              style={{ width: '100%', padding: '14px', marginBottom: '10px', borderRadius: '12px', background: '#f59e0b', color: '#000', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}>
              Play Again
            </button>

            <button onClick={onLeave}
              style={{ width: '100%', padding: '12px', borderRadius: '11px', background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text4)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text4)' }}>
              Leave Room
            </button>
          </div>

        </div>

        <style>{`
          @media (max-width: 600px) {
            .results-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

      </div>
    </div>
  )
}
