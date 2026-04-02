'use client'
import { useState, useEffect } from 'react'
import { avatarColor } from '@/lib/words'
import { fetchLeaderboard, type HofScore } from '@/lib/supabase'
import type { Player } from '@/lib/types'
import { IconChartBar, IconUser, IconSettings, IconMoon, IconSun, IconUserPlus, IconLogin, IconLogout, IconX, IconDice5, IconStars, IconBuilding, IconMap, IconPaw, IconMovie, IconBuildingStore, IconFlag, IconSword, IconCheck, IconSparkles } from '@tabler/icons-react'
import GalaxyIcon from '@/components/ui/GalaxyIcon'
import type { User } from '@supabase/supabase-js'
import type { UserStats } from '@/lib/supabase'
import StatsModal from '@/components/ui/StatsModal'
import ProfileModal from '@/components/ui/ProfileModal'
import PlayerStatsModal from '@/components/ui/PlayerStatsModal'
import UpdatesModal from '@/components/ui/UpdatesModal'
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer'

const GAME_TYPES = [
  { id: 'default',  label: 'Random',  sub: 'Mixed vocabulary',      Icon: IconDice5         },
  { id: 'expert',   label: 'Expert',  sub: 'Hard 12+ letters',       Icon: IconStars         },
  { id: 'cities',   label: 'Cities',  sub: 'World cities',           Icon: IconBuilding      },
  { id: 'places',   label: 'Places',  sub: 'World geography',        Icon: IconMap           },
  { id: 'animals',  label: 'Animals', sub: 'Flora and fauna',        Icon: IconPaw           },
  { id: 'movies',   label: 'Movies',  sub: 'Film titles & terms',    Icon: IconMovie         },
  { id: 'brands',   label: 'Brands',  sub: 'Companies & logos',      Icon: IconBuildingStore },
  { id: 'flags',    label: 'Flags',   sub: 'Name the country',        Icon: IconFlag          },
  { id: 'ranked',   label: 'Ranked',  sub: 'Saves to leaderboard',   Icon: IconSword         },
]

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
  onLobbyReady: (ready: boolean) => void
  gameDuration: number
  onGameDurationChange: (d: number) => void
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
  onStart, onLeave, onCategoryChange, onLobbyReady,
  gameDuration, onGameDurationChange,
  myName, onOpenLeaderboard,
  theme, onToggleTheme, voiceSpeed, onVoiceSpeedChange, onTestVoice,
  authUser, userStats, onOpenAuth, onSignOut, onStatsUpdated,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpdates, setShowUpdates] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sidebarData, setSidebarData] = useState<HofScore[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string; userId?: string } | null>(null)

  useEffect(() => { fetchLeaderboard().then(setSidebarData) }, [])

  const copyCode = () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${roomCode}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const best: Record<string, HofScore> = {}
  sidebarData.forEach(e => { if (!best[e.name] || e.score > best[e.name].score) best[e.name] = e })
  const ranked = Object.values(best).sort((a, b) => b.score - a.score).slice(0, 10)

  return (
    <>
      {/* Mobile Bottom Drawer */}
      <MobileBottomDrawer
        authUser={authUser}
        userStats={userStats}
        onOpenAuth={onOpenAuth}
        onSignOut={onSignOut}
        onStatsUpdated={onStatsUpdated}
        onGoHome={onLeave}
        onOpenLeaderboard={onOpenLeaderboard}
        currentScreen="waiting"
      />
      
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
                <div key={e.name}
                  onClick={() => setSelectedPlayer({ name: e.name, userId: e.user_id })}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderBottom: '1px solid var(--surface2)', cursor: 'pointer', borderRadius: '6px', transition: 'background .1s' }}
                  onMouseEnter={e2 => (e2.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e2 => (e2.currentTarget.style.background = 'transparent')}>
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
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', fontWeight: 600, background: 'var(--accent-pale)', color: '#f59e0b', border: '1px solid #78350f' }}>{GAME_TYPES.find(g => g.id === wordCategory)?.label ?? 'Default'}{isRanked && wordCategory !== 'ranked' ? ' · Ranked' : ''}</span>
          </div>

          {/* Room code */}
          <div onClick={copyCode} style={{ textAlign: 'center', background: copied ? '#f59e0b0f' : 'var(--surface)', border: `1.5px dashed ${copied ? '#f59e0b' : 'var(--border-strong)'}`, borderRadius: '12px', padding: '20px', marginBottom: '16px', cursor: 'pointer', transition: 'all .2s' }}>
            <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Share this code</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b', letterSpacing: '12px', fontFamily: 'Space Mono, monospace' }}>{roomCode}</div>
            <div style={{ fontSize: '10px', color: copied ? '#f59e0b' : 'var(--text6)', marginTop: '6px', fontWeight: copied ? 600 : 400, transition: 'all .2s' }}>
              {copied ? '✓ Link copied!' : 'tap to copy link'}
            </div>
          </div>

          {/* Players */}
          {(() => {
            const playerList = Object.values(players)
            const nonHostPlayers = playerList.filter(p => !p.isHost)
            const allReady = nonHostPlayers.length === 0 || nonHostPlayers.every(p => p.lobbyReady)
            const readyCount = nonHostPlayers.filter(p => p.lobbyReady).length
            const myPlayer = players[myId]
            const myLobbyReady = myPlayer?.lobbyReady ?? false

            return (
              <>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Players <span style={{ color: 'var(--text5)', fontSize: '13px' }}>({playerList.length})</span></span>
                    {nonHostPlayers.length > 0 && (
                      <span style={{ fontSize: '11px', color: allReady ? '#4ade80' : 'var(--text5)', fontWeight: 600 }}>
                        {readyCount}/{nonHostPlayers.length} ready
                      </span>
                    )}
                  </div>
                  {playerList.map(p => {
                    const bg = avatarColor(p.name)
                    const isHost = p.id === hostId
                    const isReady = isHost || p.lobbyReady
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--surface2)', borderRadius: '9px', marginBottom: '7px', border: `1px solid ${p.id === myId ? '#f59e0b' : isReady ? '#16a34a44' : 'var(--border)'}`, transition: 'border-color .2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: bg + '20', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{p.name?.[0]?.toUpperCase() ?? '?'}</div>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{p.name}{p.id === myId && <span style={{ fontSize: '10px', color: 'var(--text5)', marginLeft: '4px' }}>(you)</span>}</span>
                        </div>
                        <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '20px', fontFamily: 'Space Mono, monospace', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: isHost ? '#f59e0b' : isReady ? '#16a34a22' : 'var(--surface)', color: isHost ? '#000' : isReady ? '#4ade80' : 'var(--text5)', border: isHost ? 'none' : isReady ? '1px solid #16a34a44' : '1px solid var(--border)' }}>
                          {isHost ? 'HOST' : isReady ? <><IconCheck size={10} stroke={3} />READY</> : 'NOT READY'}
                        </span>
                      </div>
                    )
                  })}

                  {/* Ready button for non-host players */}
                  {!amHost && (
                    <button
                      onClick={() => onLobbyReady(!myLobbyReady)}
                      style={{ width: '100%', marginTop: '8px', padding: '12px', borderRadius: '10px', border: `1.5px solid ${myLobbyReady ? '#16a34a' : '#f59e0b'}`, background: myLobbyReady ? '#16a34a22' : '#f59e0b', color: myLobbyReady ? '#4ade80' : '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >
                      {myLobbyReady ? <><IconCheck size={16} stroke={2.5} /> Ready!</> : 'Ready up!'}
                    </button>
                  )}

                  {!amHost && myLobbyReady && (
                    <div style={{ textAlign: 'center', marginTop: '10px', color: 'var(--text5)', fontSize: '12px' }}>
                      Waiting for host to start...
                    </div>
                  )}
                </div>
              </>
            )
          })()}

          {/* Category picker + start for host */}
          {amHost && (() => {
            const nonHostPlayers = Object.values(players).filter(p => !p.isHost)
            const allReady = nonHostPlayers.length === 0 || nonHostPlayers.every(p => p.lobbyReady)
            const notReadyCount = nonHostPlayers.filter(p => !p.lobbyReady).length
            const fmtDur = (s: number) => {
              if (s < 60) return `${s}s`
              const m = Math.floor(s / 60), r = s % 60
              return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')}`
            }
            return (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
                {!isRanked && (
                  <>
                    <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '10px' }}>Game Type</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                      {GAME_TYPES.filter(gt => gt.id !== 'ranked').map(gt => {
                        const isSelected = wordCategory === gt.id
                        return (
                          <button key={gt.id} onClick={() => onCategoryChange(gt.id)}
                            style={{ padding: '11px 10px', borderRadius: '10px', border: `1.5px solid ${isSelected ? '#f59e0b' : 'var(--border)'}`, background: isSelected ? 'var(--accent-pale)' : 'var(--surface2)', color: isSelected ? '#f59e0b' : 'var(--text3)', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'var(--accent-pale)' } }}
                            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)' } }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isSelected ? '#f59e0b22' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <gt.Icon size={15} stroke={1.5} />
                            </div>
                            <div>
                              <strong style={{ display: 'block', fontSize: '12px', fontWeight: 700, lineHeight: 1.2 }}>{gt.label}</strong>
                              <span style={{ fontSize: '10px', color: isSelected ? '#d97706' : 'var(--text5)', lineHeight: 1.3 }}>{gt.sub}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Duration slider */}
                    <div style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{fmtDur(gameDuration)}</span>
                      </div>
                      <input type="range" min={15} max={120} step={15} value={gameDuration}
                        onChange={e => onGameDurationChange(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#f59e0b' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text6)' }}>15s</span>
                        <span style={{ fontSize: '10px', color: 'var(--text6)' }}>2 min</span>
                      </div>
                    </div>
                  </>
                )}

                <button onClick={allReady ? onStart : undefined} disabled={!allReady}
                  style={{ width: '100%', padding: '13px', borderRadius: '11px', background: allReady ? '#f59e0b' : 'var(--surface2)', color: allReady ? '#000' : 'var(--text5)', fontSize: '15px', fontWeight: 700, border: `1.5px solid ${allReady ? '#f59e0b' : 'var(--border)'}`, cursor: allReady ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}
                  onMouseEnter={e => { if (allReady) e.currentTarget.style.background = '#fbbf24' }}
                  onMouseLeave={e => { if (allReady) e.currentTarget.style.background = '#f59e0b' }}>
                  {allReady
                    ? `Start Game · ${isRanked ? '1 min' : fmtDur(gameDuration)}`
                    : `Waiting for ${notReadyCount} player${notReadyCount !== 1 ? 's' : ''}...`}
                </button>
              </div>
            )
          })()}
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
              { label: 'View Stats',   Icon: IconChartBar,  action: () => setShowStats(true) },
              { label: 'View Profile', Icon: IconUser,      action: () => setShowProfile(true) },
              { label: 'Settings',     Icon: IconSettings,  action: () => setShowSettings(true) },
              { label: 'Updates',      Icon: IconSparkles,  action: () => setShowUpdates(true) },
            ] : [
              { label: 'Sign Up',  Icon: IconUserPlus,  action: () => onOpenAuth('signup') },
              { label: 'Sign In',  Icon: IconLogin,     action: () => onOpenAuth('signin') },
              { label: 'Settings', Icon: IconSettings,  action: () => setShowSettings(true) },
              { label: 'Updates',  Icon: IconSparkles,  action: () => setShowUpdates(true) },
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

      {/* Player Stats Modal */}
      {selectedPlayer && (
        <PlayerStatsModal
          name={selectedPlayer.name}
          userId={selectedPlayer.userId}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Updates Modal */}
      {showUpdates && <UpdatesModal onClose={() => setShowUpdates(false)} />}
    </div>
    </>
  )
}
