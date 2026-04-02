'use client'
import { useState, useEffect } from 'react'
import { avatarColor } from '@/lib/words'
import { fetchLeaderboard, fetchLeaderboardByPeriod, type HofScore } from '@/lib/supabase'
import PlayerStatsModal from '@/components/ui/PlayerStatsModal'
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer'

type Tab = 'all' | 'month' | 'week' | 'day'

interface DisplayEntry {
  key: string
  userId?: string
  name: string
  score: number
  words: number
  ago: string
}

interface Props {
  myName: string
  onBack: () => void
  // Mobile-specific props
  authUser?: any
  userStats?: any
  onOpenAuth?: (mode: 'signin' | 'signup') => void
  onSignOut?: () => void
  onStatsUpdated?: (stats: any) => void
  onGoHome?: () => void
  // Display mode
  isModal?: boolean
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',   label: 'All Time' },
  { id: 'month', label: 'Month' },
  { id: 'week',  label: 'Week' },
  { id: 'day',   label: 'Today' },
]

function sinceDate(tab: Tab): Date {
  const d = new Date()
  if (tab === 'day')   d.setHours(0, 0, 0, 0)
  if (tab === 'week')  d.setDate(d.getDate() - 7)
  if (tab === 'month') d.setDate(d.getDate() - 30)
  return d
}

function dedupeHofScores(rows: HofScore[]): DisplayEntry[] {
  // Dedupe by name so players with a mix of anonymous + authenticated rows aren't doubled
  const best: Record<string, HofScore> = {}
  for (const r of rows) {
    if (!best[r.name] || r.score > best[r.name].score) best[r.name] = r
  }
  // Prefer any user_id found for a given name (for profile links)
  const userIdByName: Record<string, string> = {}
  for (const r of rows) {
    if (r.user_id && !userIdByName[r.name]) userIdByName[r.name] = r.user_id
  }
  return Object.values(best)
    .sort((a, b) => b.score - a.score)
    .map(r => ({
      key: userIdByName[r.name] || r.name,
      userId: userIdByName[r.name],
      name: r.name,
      score: r.score,
      words: r.words,
      ago: r.created_at ? formatAgo(new Date(r.created_at)) : '',
    }))
}

export default function LeaderboardScreen({ 
  myName, onBack, authUser, userStats, onOpenAuth, onSignOut, onStatsUpdated, onGoHome, isModal = false
}: Props) {
  const [tab, setTab] = useState<Tab>('all')
  const [entries, setEntries] = useState<DisplayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string; userId?: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const rows = tab === 'all' 
          ? await fetchLeaderboard()
          : await fetchLeaderboardByPeriod(sinceDate(tab))
        setEntries(dedupeHofScores(rows))
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
        setEntries([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tab])

  // Render as modal (desktop)
  if (isModal) {
    return (
      <>
        <div
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.82)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9990, 
            padding: '20px', 
            overflowY: 'auto' 
          }}
          onClick={onBack}
        >
          <div
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '20px', 
              padding: '24px 20px', 
              position: 'relative' 
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Leaderboard</h2>
              <button 
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600,
                    background: tab === t.id ? 'var(--surface)' : 'transparent',
                    color: tab === t.id ? 'var(--text)' : 'var(--text5)',
                    boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all .15s',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', animation: 'leaderboard-spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace' }}>Loading scores...</span>
                  <style>{`@keyframes leaderboard-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>
                  No scores yet — play a ranked game!
                </div>
              ) : entries.slice(0, 50).map((e, i) => {
                const bg = avatarColor(e.name)
                const isMe = e.name === myName
                const rankColor = i === 0 ? '#f59e0b' : i === 1 ? 'var(--text2)' : i === 2 ? '#cd7f32' : 'var(--text5)'
                return (
                  <div key={e.key}
                    onClick={() => e.userId && setSelectedPlayer({ name: e.name, userId: e.userId })}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderBottom: i < entries.length - 1 ? '1px solid var(--surface2)' : 'none', cursor: e.userId ? 'pointer' : 'default', borderRadius: '8px', transition: 'background .1s' }}
                    onMouseEnter={e2 => e.userId && (e2.currentTarget.style.background = 'var(--surface2)')}
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
                        <span>{e.words} words</span>
                        {e.ago && <span>{e.ago}</span>}
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
        </div>

        {/* Player Stats Modal */}
        {selectedPlayer && (
          <PlayerStatsModal
            name={selectedPlayer.name}
            userId={selectedPlayer.userId}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </>
    )
  }

  // Full page mode (mobile)
  return (
    <>
      {/* Mobile Bottom Drawer */}
      <MobileBottomDrawer
        authUser={authUser}
        userStats={userStats}
        onOpenAuth={onOpenAuth || (() => {})}
        onSignOut={onSignOut || (() => {})}
        onStatsUpdated={onStatsUpdated || (() => {})}
        onGoHome={onGoHome}
        currentScreen="leaderboard"
      />

      {/* Mobile Full Page */}
      <div
        style={{ 
          minHeight: '100vh',
          background: 'var(--bg-page)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px',
          paddingBottom: '90px',
          gap: '24px'
        }}
      >
  

        <div
          style={{ 
            width: '100%', 
            maxWidth: '480px', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '20px', 
            padding: '24px 20px', 
            position: 'relative' 
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Leaderboard</h2>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600,
                  background: tab === t.id ? 'var(--surface)' : 'transparent',
                  color: tab === t.id ? 'var(--text)' : 'var(--text5)',
                  boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all .15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', animation: 'leaderboard-spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '12px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace' }}>Loading scores...</span>
                <style>{`@keyframes leaderboard-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text5)', fontFamily: 'Space Mono, monospace', fontSize: '12px' }}>
                No scores yet — play a ranked game!
              </div>
            ) : entries.slice(0, 50).map((e, i) => {
              const bg = avatarColor(e.name)
              const isMe = e.name === myName
              const rankColor = i === 0 ? '#f59e0b' : i === 1 ? 'var(--text2)' : i === 2 ? '#cd7f32' : 'var(--text5)'
              return (
                <div key={e.key}
                  onClick={() => e.userId && setSelectedPlayer({ name: e.name, userId: e.userId })}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderBottom: i < entries.length - 1 ? '1px solid var(--surface2)' : 'none', cursor: e.userId ? 'pointer' : 'default', borderRadius: '8px', transition: 'background .1s' }}
                  onMouseEnter={e2 => e.userId && (e2.currentTarget.style.background = 'var(--surface2)')}
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
                      <span>{e.words} words</span>
                      {e.ago && <span>{e.ago}</span>}
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
      </div>

      {/* Player Stats Modal */}
      {selectedPlayer && (
        <PlayerStatsModal
          name={selectedPlayer.name}
          userId={selectedPlayer.userId}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  )
}

function formatAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}