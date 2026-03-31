'use client'
import { useState, useEffect } from 'react'
import { avatarColor } from '@/lib/words'
import { fetchLeaderboard, type HofScore } from '@/lib/supabase'
import type { Player } from '@/lib/types'
import { IconChartBar, IconUser, IconSettings, IconMoon, IconSun, IconUserPlus, IconLogin, IconLogout, IconX } from '@tabler/icons-react'
import GalaxyIcon from '@/components/ui/GalaxyIcon'
import type { User } from '@supabase/supabase-js'
import type { UserStats } from '@/lib/supabase'
import StatsModal from '@/components/ui/StatsModal'
import ProfileModal from '@/components/ui/ProfileModal'

const CATEGORIES = ['default','expert','cities','places','animals','movies','brands','ranked']
const CAT_LABEL: Record<string, string> = { default:'Random',expert:'Expert',cities:'Cities',places:'Places',animals:'Animals',movies:'Movies',brands:'Brands',ranked:'Ranked' }

interface Props {
  players: Record<string, Player>
  myId: string
  hostId: string
  roomCode: string
  amHost: boolean
  wordCategory: string
  isRanked: boolean
  onStart: () => void
  onLeave: () => void
  onCategoryChange: (c: string) => void
  myName: string
  onOpenLeaderboard: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  voiceSpeed: number
  onVoiceSpeedChange: (v: number) => void
  onTestVoice: () => void
  authUser: User | null
  userStats: UserStats | null
  onOpenAuth: (mode: 'signin' | 'signup') => void
  onSignOut: () => void
  onStatsUpdated: (stats: UserStats) => void
}

export default function WaitingScreen({
  players, myId, hostId, roomCode, amHost, wordCategory, isRanked,
  onStart, onLeave, onCategoryChange,
  myName, onOpenLeaderboard,
  theme, onToggleTheme, voiceSpeed, onVoiceSpeedChange, onTestVoice,
  authUser, userStats, onOpenAuth, onSignOut, onStatsUpdated,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarData, setSidebarData] = useState<HofScore[]>([])

  useEffect(() => { fetchLeaderboard().then(setSidebarData) }, [])

  const copyCode = () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${roomCode}`
    navigator.clipboard?.writeText(url).catch(() => {})
  }

  const best: Record<string, HofScore> = {}
  sidebarData.forEach(e => { if (!best[e.name] || e.score > best[e.name].score) best[e.name] = e })
  const ranked = Object.values(best).sort((a, b) => b.score - a.score).slice(0, 15)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '0' }}>

      {/* Full-width title bar (desktop only) */}
      <div className="home-title-bar" style={{ width: '100%', maxWidth: '984px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px', whiteSpace: 'nowrap', marginBottom: '24px' }}>
          <GalaxyIcon size={52} stroke={1.5} style={{ width: '52px', height: '52px', flexShrink: 0 }} />
          Carbon Spelling
        </div>
      </div>

      {/* Columns row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '984px', flexWrap: 'wrap' }}>

        {/* Left: Leaderboard (desktop only) */}
        <div className="home-sidebar-col" style={{ width: '240px', flexShrink: 0, flexDirection: 'column', gap: '12px', position: 'sticky', top: '40px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '14px' }}>Leaderboard</div>
            {ranked.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: '12px', fontFamily: 'Space Mono, monospace', textAlign: 'center', padding: '20px 0' }}>No scores yet</div>
            ) : ranked.map((e, i) => {
              const bg = avatarColor(e.name)
              return (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid var(--surface2)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, minWidth: '18px', color: i === 0 ? '#f59e0b' : i === 1 ? 'var(--text2)' : i === 2 ? '#cd7f32' : 'var(--text5)' }}>{i + 1}</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{e.name?.[0]?.toUpperCase() ?? '?'}</div>
                  <span style={{ flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{e.name}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{e.score}</span>
                </div>
              )
            })}
            <button onClick={onOpenLeaderboard}
              style={{ marginTop: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text5)', fontSize: '11px', padding: '7px', cursor: 'pointer', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text5)' }}>
              Full leaderboard →
            </button>
          </div>
        </div>

        {/* Main waiting room card */}
        <div style={{ flex: '1 1 auto', minWidth: '280px', maxWidth: '456px' }}>

          {/* Back */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <button onClick={onLeave} style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', fontSize: '18px', padding: 0 }}>←</button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Waiting Room</h2>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', fontWeight: 600, background: 'var(--accent-pale)', color: '#f59e0b', border: '1px solid #78350f' }}>{CAT_LABEL[wordCategory] || 'Default'}{isRanked && wordCategory !== 'ranked' ? ' · Ranked' : ''}</span>
          </div>

          {/* Room code */}
          <div onClick={copyCode} style={{ textAlign: 'center', background: 'var(--surface)', border: '1.5px dashed var(--border-strong)', borderRadius: '12px', padding: '20px', marginBottom: '16px', cursor: 'pointer' }}>
            <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Share this code</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b', letterSpacing: '12px', fontFamily: 'Space Mono, monospace' }}>{roomCode}</div>
            <div style={{ fontSize: '10px', color: 'var(--text6)', marginTop: '6px' }}>tap to copy link</div>
          </div>

          {/* Players */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Players <span style={{ color: 'var(--text5)', fontSize: '13px' }}>({Object.keys(players).length})</span></span>
            </div>
            {Object.values(players).map(p => {
              const bg = avatarColor(p.name)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--surface2)', borderRadius: '9px', marginBottom: '7px', border: `1px solid ${p.id === myId ? '#f59e0b' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{p.name[0].toUpperCase()}</div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{p.name}{p.id === myId && <span style={{ fontSize: '10px', color: 'var(--text5)', marginLeft: '4px' }}>(you)</span>}</span>
                  </div>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '20px', fontFamily: 'Space Mono, monospace', fontWeight: 700, background: p.id === hostId ? '#f59e0b' : '#f59e0b22', color: p.id === hostId ? '#000' : '#f59e0b' }}>
                    {p.id === hostId ? 'HOST' : 'READY'}
                  </span>
                </div>
              )
            })}
            {!amHost && <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text5)', fontSize: '12px' }}>Waiting for host to start...</div>}
          </div>

          {/* Category picker + start for host */}
          {amHost && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '10px' }}>Game Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => onCategoryChange(c)}
                    style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${wordCategory === c ? '#f59e0b' : 'var(--border)'}`, background: wordCategory === c ? 'var(--accent-pale)' : 'var(--surface2)', color: wordCategory === c ? '#f59e0b' : 'var(--text3)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {CAT_LABEL[c]}
                  </button>
                ))}
              </div>
              <button onClick={onStart}
                style={{ width: '100%', padding: '13px', borderRadius: '11px', background: '#f59e0b', color: '#000', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}>
                Start Game
              </button>
            </div>
          )}
        </div>

        {/* Right: Account box (desktop only) */}
        <div className="home-account" style={{ width: '240px', flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 16px', position: 'sticky', top: '40px' }}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '16px' }}>
            {(() => {
              const displayName = authUser ? (userStats?.display_name || authUser.email || 'Player') : (myName.trim() || 'Guest')
              const subtitle = authUser ? authUser.email : (myName.trim() ? 'Player' : 'Not signed in')
              const bg = avatarColor(displayName)
              return (
                <>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: bg + '25', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700, flexShrink: 0, border: `1.5px solid ${bg}40` }}>
                    {displayName[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text5)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {subtitle}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--surface2)', marginBottom: '8px' }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {(authUser ? [
              { label: 'View Stats',   Icon: IconChartBar, action: () => setShowStats(true) },
              { label: 'View Profile', Icon: IconUser,     action: () => setShowProfile(true) },
              { label: 'Settings',     Icon: IconSettings, action: () => setShowSettings(true) },
            ] : [
              { label: 'Sign Up',  Icon: IconUserPlus, action: () => onOpenAuth('signup') },
              { label: 'Sign In',  Icon: IconLogin,    action: () => onOpenAuth('signin') },
              { label: 'Settings', Icon: IconSettings, action: () => setShowSettings(true) },
            ]).map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', background: 'transparent', border: 'none', borderRadius: '8px', padding: '8px 10px', color: item.label === 'Sign Out' ? 'var(--red)' : 'var(--text4)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left', transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = item.label === 'Sign Out' ? 'var(--red)' : 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.label === 'Sign Out' ? 'var(--red)' : 'var(--text4)' }}>
                <item.Icon size={16} stroke={1.5} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
          onClick={() => setShowSettings(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '360px' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Settings</span>
              <button onClick={() => setShowSettings(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
                <IconX size={18} stroke={2} />
              </button>
            </div>

            {/* Appearance */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>Appearance</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { if (theme !== 'dark') onToggleTheme() }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px', borderRadius: '10px', border: `1.5px solid ${theme === 'dark' ? '#f59e0b' : 'var(--border)'}`, background: theme === 'dark' ? 'var(--accent-pale)' : 'var(--surface2)', color: theme === 'dark' ? '#f59e0b' : 'var(--text4)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}>
                  <IconMoon size={16} stroke={1.5} />
                  Dark
                </button>
                <button onClick={() => { if (theme !== 'light') onToggleTheme() }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px', borderRadius: '10px', border: `1.5px solid ${theme === 'light' ? '#f59e0b' : 'var(--border)'}`, background: theme === 'light' ? 'var(--accent-pale)' : 'var(--surface2)', color: theme === 'light' ? '#f59e0b' : 'var(--text4)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}>
                  <IconSun size={16} stroke={1.5} />
                  Light
                </button>
              </div>
            </div>

            {/* Voice Speed */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>Voice Speed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text5)', minWidth: '28px' }}>Slow</span>
                <input type="range" min={-40} max={20} step={5} value={voiceSpeed}
                  onChange={e => onVoiceSpeedChange(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#f59e0b' }} />
                <span style={{ fontSize: '11px', color: 'var(--text5)', minWidth: '28px' }}>Fast</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#f59e0b' }}>
                  {voiceSpeed <= -30 ? 'Very slow' : voiceSpeed <= -20 ? 'Slow' : voiceSpeed <= -10 ? 'Normal' : voiceSpeed <= 0 ? 'Fast' : 'Very fast'}
                </span>
                <button onClick={onTestVoice}
                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text5)', fontSize: '11px', padding: '4px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text5)' }}>
                  Test
                </button>
              </div>
            </div>

            {/* Sign Out (only when logged in) */}
            {authUser && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setShowSettings(false); onSignOut() }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', border: '1.5px solid var(--red)', background: 'var(--red-pale)', color: 'var(--red)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-pale-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--red-pale)')}>
                  <IconLogout size={15} stroke={2} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <StatsModal stats={userStats} onClose={() => setShowStats(false)} />
      )}

      {/* Profile Modal */}
      {showProfile && authUser && (
        <ProfileModal
          authUser={authUser}
          userStats={userStats}
          onClose={() => setShowProfile(false)}
          onUpdated={(stats) => { onStatsUpdated(stats); setShowProfile(false) }}
        />
      )}
    </div>
  )
}
