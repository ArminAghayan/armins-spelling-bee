'use client'
import { avatarColor } from '@/lib/words'
import type { Player } from '@/lib/types'

const CAT_LABEL: Record<string, string> = { default:'Default',expert:'Expert',cities:'Cities & Places',animals:'Animals & Nature',movies:'Movies',brands:'Brands' }
const CATEGORIES = ['default','expert','cities','animals','movies','brands']

interface Props {
  scores: Record<string, { name: string; score: number; correct: number }>
  myId: string
  myName: string
  players: Record<string, Player>
  hostId: string
  amHost: boolean
  isRanked: boolean
  wordCategory: string
  onHostStart: () => void
  onLeave: () => void
  onOpenLeaderboard: () => void
  onCategoryChange: (c: string) => void
  onRematchReady: () => void
}

export default function ResultsScreen({ scores, myId, myName, players, hostId, amHost, isRanked, wordCategory, onHostStart, onLeave, onOpenLeaderboard, onCategoryChange, onRematchReady }: Props) {
  const all = Object.entries(scores).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.score - a.score)
  const myFinal = scores[myId] || { score: 0, correct: 0 }
  const myRank = all.findIndex(p => p.id === myId) + 1

  const top3 = all.slice(0, 3)
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]]
  const podiumClass = ['p2', 'p1', 'p3']
  const podiumMedal = ['2', '1', '3']
  const podiumHeight = [52, 76, 36]

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Game Over</h1>
          <div style={{ display: 'inline-block', fontSize: '11px', padding: '3px 12px', borderRadius: '20px', border: '1px solid #2a2a2a', color: '#555' }}>
            {isRanked ? 'Ranked — saved to leaderboard' : 'Casual — not saved'}
          </div>
        </div>

        {/* Podium */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          {podiumOrder.map((p, i) => {
            if (!p) return null
            const bg = avatarColor(p.name)
            const isMe = p.id === myId
            const blockBg = i === 1 ? '#1c1000' : i === 0 ? '#111' : '#1c0d00'
            const blockBorder = i === 1 ? '#78350f' : i === 0 ? '#2a2a2a' : '#7c2d12'
            return (
              <div key={p.id} style={{ flex: 1, maxWidth: '130px', textAlign: 'center' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', margin: '0 auto 7px', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>{p.name[0]}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{isMe ? 'You' : p.name}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#555', marginBottom: '6px' }}>{p.score} pts</div>
                <div style={{ height: `${podiumHeight[i]}px`, borderRadius: '9px 9px 0 0', background: blockBg, border: `1px solid ${blockBorder}`, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontFamily: 'Space Mono, monospace', fontWeight: 700, color: i === 1 ? '#f59e0b' : '#555' }}>
                  {podiumMedal[i]}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[['Points', myFinal.score], ['Correct', myFinal.correct], [`#${myRank || '?'}`, 'Rank']].map(([val, lbl]) => (
            <div key={String(lbl)} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '11px', padding: '13px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{val}</div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* This game leaderboard */}
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '10px' }}>This Game</div>
          {all.map((p, i) => {
            const bg = avatarColor(p.name)
            const isMe = p.id === myId
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 0', borderBottom: i < all.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#444', width: '18px' }}>{i + 1}</span>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{p.name[0]}</div>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: isMe ? 700 : 400, color: '#fff' }}>{isMe ? `You (${p.name})` : p.name}</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>{p.score}</span>
              </div>
            )
          })}
        </div>

        {/* Rematch */}
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Play Again?</div>

          {amHost && (
            <>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Word Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => onCategoryChange(c)}
                    style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${wordCategory === c ? '#f59e0b' : '#2a2a2a'}`, background: wordCategory === c ? '#1c1000' : '#1a1a1a', color: wordCategory === c ? '#f59e0b' : '#666', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {CAT_LABEL[c]?.split(' ')[0]}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Ready list */}
          {Object.values(players).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#1a1a1a', borderRadius: '8px', marginBottom: '6px', border: `1px solid ${p.id === myId ? '#f59e0b' : '#2a2a2a'}` }}>
              <span style={{ fontSize: '13px', color: '#ccc' }}>{p.name}{p.id === myId && <span style={{ color: '#555', fontSize: '11px' }}> (you)</span>}</span>
              <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '20px', fontFamily: 'Space Mono, monospace', fontWeight: 700, background: p.id === hostId ? '#f59e0b' : p.rematchReady ? '#f59e0b22' : '#1a1a1a', color: p.id === hostId ? '#000' : p.rematchReady ? '#f59e0b' : '#444', border: p.id !== hostId ? '1px solid #2a2a2a' : 'none' }}>
                {p.id === hostId ? 'HOST' : p.rematchReady ? 'READY' : '...'}
              </span>
            </div>
          ))}

          {amHost ? (
            <button onClick={onHostStart} style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '11px', background: '#f59e0b', color: '#000', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Start New Game
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px', color: '#555', fontSize: '12px' }}>Waiting for host to start...</div>
          )}
        </div>

        <button onClick={onLeave} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '11px', background: 'transparent', border: '1.5px solid #2a2a2a', color: '#888', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Leave Room
        </button>
        <button onClick={onOpenLeaderboard} style={{ width: '100%', padding: '12px', borderRadius: '11px', background: 'transparent', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Leaderboard
        </button>
      </div>
    </div>
  )
}
