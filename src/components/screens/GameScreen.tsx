'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { avatarColor, type Word } from '@/lib/words'
import type { Player } from '@/lib/types'

interface Props {
  players: Record<string, Player>
  myId: string
  currentWord: Word | undefined
  timeLeft: number
  myScore: number
  myStreak: number
  recentWords: { word: string; ok: boolean }[]
  isRanked: boolean
  wordCategory: string
  feedItems: { id: number; msg: string; type: 'ok' | 'no' }[]
  onSubmit: (answer: string) => boolean
  onSkip: () => void
  onSpeak: () => void
  onLeave: () => void
}

export default function GameScreen({ players, myId, currentWord, timeLeft, myScore, myStreak, recentWords, isRanked, wordCategory, feedItems, onSubmit, onSkip, onSpeak, onLeave }: Props) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [answer, setAnswer] = useState('')
  const [inputState, setInputState] = useState<'idle' | 'ok' | 'no'>('idle')
  const [ptsParticles, setPtsParticles] = useState<{ id: number; pts: number; x: number; y: number }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const prevRanks = useRef<Record<string, number>>({})
  const [rowAnimations, setRowAnimations] = useState<Record<string, string>>({})
  const particleCounter = useRef(0)

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')
  const danger = timeLeft <= 10

  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score)

  // Detect rank changes for animation
  useEffect(() => {
    const newAnims: Record<string, string> = {}
    sortedPlayers.forEach((p, i) => {
      const prev = prevRanks.current[p.id]
      if (prev !== undefined && prev !== i) {
        newAnims[p.id] = prev > i ? 'rank-up' : 'rank-down'
        setTimeout(() => setRowAnimations(a => { const n = { ...a }; delete n[p.id]; return n }), 600)
      }
      prevRanks.current[p.id] = i
    })
    if (Object.keys(newAnims).length) setRowAnimations(a => ({ ...a, ...newAnims }))
  }, [sortedPlayers.map(p => p.id + p.score).join()])

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) return
    const inputEl = inputRef.current
    const rect = inputEl?.getBoundingClientRect()
    const correct = onSubmit(answer)
    setAnswer('')

    if (correct) {
      setInputState('ok')
      if (rect && currentWord) {
        const id = ++particleCounter.current
        setPtsParticles(p => [...p, { id, pts: currentWord.p, x: rect.left + rect.width / 2, y: rect.top }])
        setTimeout(() => setPtsParticles(p => p.filter(x => x.id !== id)), 1000)
      }
    } else {
      setInputState('no')
    }
    setTimeout(() => { setInputState('idle'); inputRef.current?.focus() }, 400)
  }, [answer, onSubmit, currentWord])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
      if (e.key === 'Tab') { e.preventDefault(); setAnswer(''); onSkip() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSubmit, onSkip])

  const borderColor = inputState === 'ok' ? 'var(--green)' : inputState === 'no' ? 'var(--red)' : 'var(--border)'
  const bgColor = inputState === 'ok' ? '#052e16' : inputState === 'no' ? 'var(--red-pale)' : 'var(--surface2)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ── Desktop Live Leaderboard Sidebar ── */}
      <div style={{
        width: '220px', flexShrink: 0, background: 'var(--bg-darker)', borderRight: '1px solid var(--surface2)',
        padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        flexDirection: 'column', gap: 0,
        display: 'none',
      }} ref={el => { if (el) el.style.display = typeof window !== 'undefined' && window.innerWidth >= 960 ? 'flex' : 'none' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text6)' }}>Live</span>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', animation: 'livePulse 1.5s ease-in-out infinite' }} />
        </div>

        {isRanked && <div style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>Ranked</div>}

        {/* Player rows */}
        {sortedPlayers.map((p, i) => {
          const bg = avatarColor(p.name)
          const isMe = p.id === myId
          const anim = rowAnimations[p.id]
          return (
            <div key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 10px', borderRadius: '10px', marginBottom: '5px',
                background: 'var(--surface)', border: `1px solid ${isMe ? '#f59e0b' : 'var(--surface2)'}`,
                transition: 'background .3s',
                position: 'relative', overflow: 'hidden',
                animation: anim === 'rank-up' ? 'rankUp .5s ease forwards' : anim === 'rank-down' ? 'rankDown .4s ease' : undefined,
              }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text6)', minWidth: '16px', textAlign: 'center' }}>
                {i === 0 ? '▲' : i + 1}
              </span>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                {p.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isMe ? 'var(--text)' : 'var(--text2)' }}>
                {isMe ? 'You' : p.name}
              </span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                {p.score}
              </span>
            </div>
          )
        })}

        {/* Activity feed */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--surface2)' }}>
          {feedItems.slice(0, 4).map(f => (
            <div key={f.id} style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', padding: '3px 0', color: f.type === 'ok' ? '#f59e0b' : 'var(--red)', animation: 'feedIn .25s ease' }}>
              {f.msg}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main game area ── */}
      <div style={{ flex: 1, maxWidth: '640px', margin: '0 auto', padding: '24px 20px' }}>

        {isRanked && (
          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '11px', color: '#f59e0b', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase' }}>
            Ranked Game
          </div>
        )}

        {/* Header: timer + chips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '14px 16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: '24px', fontWeight: 700,
              color: danger ? 'var(--red)' : 'var(--text)', minWidth: '65px',
              animation: danger ? 'livePulse .6s infinite' : undefined,
            }}>
              {mins}:{secs}
            </div>
            <button onClick={() => setShowLeaveConfirm(true)}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text5)', fontSize: '11px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text5)' }}>
              leave
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {sortedPlayers.slice(0, 4).map(p => {
              const bg = avatarColor(p.name)
              const isLeader = p.id === sortedPlayers[0]?.id
              return (
                <div key={p.id} style={{ background: isLeader ? 'var(--accent-pale)' : 'var(--surface2)', border: `1px solid ${isLeader ? '#f59e0b' : 'var(--border)'}`, borderRadius: '7px', padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: bg + '20', color: bg, fontSize: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.name?.[0]?.toUpperCase() ?? '?'}</div>
                  <span style={{ color: 'var(--text5)' }}>{p.id === myId ? 'You' : p.name.split(' ')[0]}</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b', fontFamily: 'Space Mono, monospace' }}>{p.score}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Streak bar */}
        {(() => {
          const nextBonus = Math.max(0, myStreak - 1)
          const hasBonus = myStreak >= 2
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: hasBonus ? 'var(--accent-pale)' : 'var(--surface)', borderRadius: '9px', marginBottom: '14px', border: `1px solid ${hasBonus ? '#78350f' : 'var(--surface2)'}`, transition: 'all .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{myStreak >= 3 ? '🔥' : '💡'}</span>
                <span style={{ color: hasBonus ? '#f59e0b' : 'var(--text5)', fontSize: '12px', fontWeight: 600 }}>
                  {myStreak === 0 ? 'No streak' : `${myStreak} in a row`}
                </span>
              </div>
              {hasBonus ? (
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: '#78350f44', borderRadius: '6px', padding: '2px 8px' }}>
                  +{nextBonus} bonus next
                </span>
              ) : (
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: 'var(--text5)' }}>
                  3 in a row for bonus
                </span>
              )}
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: 'var(--text5)' }}>{myScore} pts</span>
            </div>
          )
        })()}

        {/* Word card */}
        <div style={{ textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--surface2)', borderRadius: '16px', padding: '24px 20px', marginBottom: '14px', position: 'relative' }}>
          {wordCategory === 'flags' ? (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 600 }}>Name this country</div>
              {currentWord && (
                <img
                  src={`/flags/${currentWord.h}.svg`}
                  alt="flag"
                  style={{ width: '160px', height: 'auto', borderRadius: '6px', border: '1px solid var(--border)', display: 'block', margin: '0 auto', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                />
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>Listen &amp; Spell</div>
              <button onClick={onSpeak} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--accent-pale)', border: '1.5px solid #f59e0b', borderRadius: '50px', padding: '14px 32px', margin: '0 auto 14px', color: '#f59e0b', fontSize: '15px', fontWeight: 600, cursor: 'pointer', width: '100%', maxWidth: '260px', fontFamily: 'Inter, sans-serif', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Hear the word
              </button>
              {currentWord && <div style={{ fontSize: '13px', color: 'var(--text5)', fontStyle: 'italic' }}>{currentWord.h}</div>}
            </>
          )}
          {currentWord && <div style={{ position: 'absolute', top: '12px', right: '14px', fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>+{currentWord.p}</div>}
        </div>

        {/* Answer input */}
        <div style={{ display: 'flex', gap: '9px', marginBottom: '13px' }}>
          <input ref={inputRef} value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder={wordCategory === 'flags' ? 'type the country name...' : 'type what you heard...'}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            style={{ flex: 1, background: bgColor, border: `1.5px solid ${borderColor}`, borderRadius: '11px', padding: '13px 16px', color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '18px', outline: 'none', letterSpacing: '3px', textTransform: 'lowercase', transition: 'all .15s' }}
          />
          <button onClick={handleSubmit} style={{ padding: '13px 18px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'background .12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}>
            →
          </button>
        </div>

        {/* Recent words + skip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
            {recentWords.map((r, i) => (
              <span key={i} style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontFamily: 'Space Mono, monospace', animation: 'pop .2s ease', background: r.ok ? 'var(--accent-pale)' : 'var(--red-pale)', color: r.ok ? '#f59e0b' : 'var(--red)', border: `1px solid ${r.ok ? '#78350f' : 'var(--red)'}`, textDecoration: r.ok ? 'none' : 'line-through' }}>
                {r.word}
              </span>
            ))}
          </div>
          <button onClick={() => { setAnswer(''); onSkip() }}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text5)', fontSize: '12px', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text5)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            skip
            <kbd style={{ fontSize: '9px', fontFamily: 'Inter, sans-serif', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', lineHeight: '14px', letterSpacing: '0', color: 'inherit' }}>Tab</kbd>
          </button>
        </div>
      </div>

      {/* Pts particles */}
      {ptsParticles.map(p => (
        <div key={p.id} style={{ position: 'fixed', left: p.x, top: p.y, pointerEvents: 'none', zIndex: 9000, fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: 700, color: '#f59e0b', animation: 'ptsFloat .9s ease forwards', transform: 'translateX(-50%)' }}>
          +{p.pts}
        </div>
      ))}

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px 24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>🚪</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Leave Game?</div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '22px' }}>Your score won&apos;t be saved{isRanked ? " and won't count toward the leaderboard" : ''}.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text4)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text4)' }}>
                Keep Playing
              </button>
              <button onClick={onLeave}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid var(--red)', background: 'var(--red-pale)', color: 'var(--red)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
