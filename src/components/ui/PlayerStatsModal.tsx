'use client'
import { useState, useEffect } from 'react'
import { IconX, IconTrophy, IconFlame, IconTarget, IconLetterCase, IconThumbUp, IconThumbDown, IconChartPie, IconSword, IconClock } from '@tabler/icons-react'
import { getUserStats, getUserStatsByName, fetchRecentScores } from '@/lib/supabase'
import { avatarColor } from '@/lib/words'
import type { UserStats, HofScore } from '@/lib/supabase'

interface Props {
  name: string
  userId?: string
  onClose: () => void
}

const MODE_LABELS: Record<string, string> = {
  default: 'Random', expert: 'Expert', cities: 'Cities', places: 'Places',
  animals: 'Animals', movies: 'Movies', brands: 'Brands', ranked: 'Ranked',
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${accent ? '#f59e0b40' : 'var(--border)'}`,
      borderRadius: '12px',
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: accent ? '#f59e0b' : 'var(--text4)' }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: accent ? '#f59e0b' : 'var(--text)', fontFamily: 'Space Mono, monospace', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text5)' }}>{sub}</div>}
    </div>
  )
}

export default function PlayerStatsModal({ name, userId, onClose }: Props) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentGames, setRecentGames] = useState<HofScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let data: UserStats | null = null
      if (userId) {
        data = await getUserStats(userId)
      }
      if (!data) {
        data = await getUserStatsByName(name)
      }
      setStats(data)
      if (data?.id) {
        const recent = await fetchRecentScores(data.id)
        setRecentGames(recent)
      }
      setLoading(false)
    }
    load()
  }, [name, userId])

  const bg = avatarColor(name)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '420px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px', transition: 'color .12s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
          <IconX size={18} stroke={2} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: bg + '25', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, flexShrink: 0, border: `2px solid ${bg}50` }}>
            {name[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>{name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text5)', marginTop: '2px' }}>Player Stats</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text5)', fontSize: '13px' }}>
            Loading stats...
          </div>
        ) : !stats ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '6px' }}>No stats available</div>
            <div style={{ fontSize: '11px', color: 'var(--text5)' }}>This player hasn&apos;t created an account yet.</div>
          </div>
        ) : (() => {
          const s = stats
          const attempted = s.total_words_attempted || 0
          const correct = s.total_words_correct || 0
          const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
          const wins = s.total_wins || 0
          const losses = s.total_losses || 0
          const totalGames = wins + losses
          const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
          const winsByMode = s.wins_by_mode || {}
          const modeEntries = Object.entries(winsByMode).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])

          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <StatCard icon={<IconTrophy size={13} stroke={2} />} label="Ranked Best" value={s.ranked_high_score || 0} sub="Highest ranked score" accent />
                <StatCard icon={<IconFlame size={13} stroke={2} />} label="Best Streak" value={s.highest_streak || 0} sub="All-time highest" accent />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <StatCard icon={<IconTarget size={13} stroke={2} />} label="Accuracy" value={`${accuracy}%`} sub={`${correct} / ${attempted} words`} />
                <StatCard icon={<IconLetterCase size={13} stroke={2} />} label="Longest Word" value={s.longest_word ? s.longest_word.length : 0} sub={s.longest_word ? `"${s.longest_word}"` : 'No word yet'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                <StatCard icon={<IconThumbUp size={13} stroke={2} />} label="Wins" value={wins} />
                <StatCard icon={<IconThumbDown size={13} stroke={2} />} label="Losses" value={losses} />
                <StatCard icon={<IconChartPie size={13} stroke={2} />} label="Win Rate" value={`${winRate}%`} sub={totalGames > 0 ? `${totalGames} games` : 'No games yet'} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text5)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconSword size={12} stroke={2} />
                  Wins by Game Mode
                </div>
                {modeEntries.length === 0 ? (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center', color: 'var(--text5)', fontSize: '12px' }}>
                    No multiplayer wins yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {modeEntries.map(([mode, count]) => {
                      const pct = wins > 0 ? Math.round((count / wins) * 100) : 0
                      return (
                        <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ minWidth: '56px', fontSize: '12px', fontWeight: 600, color: 'var(--text3)' }}>{MODE_LABELS[mode] || mode}</div>
                          <div style={{ flex: 1, height: '6px', background: 'var(--surface2)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '99px', transition: 'width .4s ease' }} />
                          </div>
                          <div style={{ minWidth: '24px', fontSize: '12px', fontWeight: 700, color: '#f59e0b', fontFamily: 'Space Mono, monospace', textAlign: 'right' }}>{count}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent games */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text5)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconClock size={12} stroke={2} />
                  Last 5 Ranked Games
                </div>
                {recentGames.length === 0 ? (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center', color: 'var(--text5)', fontSize: '12px' }}>
                    No ranked games yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {recentGames.map((g, i) => {
                      const date = g.created_at ? new Date(g.created_at) : null
                      const ago = date ? formatAgo(date) : ''
                      return (
                        <div key={g.id ?? i} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '17px', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                            {g.score}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text3)', textTransform: 'capitalize' }}>
                            {MODE_LABELS[g.difficulty] || g.difficulty}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace' }}>
                            {g.words}w
                          </div>
                          {ago && <div style={{ fontSize: '9px', color: 'var(--text5)' }}>{ago}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )
        })()}
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
