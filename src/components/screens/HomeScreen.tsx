'use client'
import { useState, useEffect } from 'react'
import { fetchLeaderboard, type HofScore } from '@/lib/supabase'
import { avatarColor } from '@/lib/words'
import { IconChartBar, IconUser, IconSettings, IconUsers, IconSun, IconMoon, IconUserPlus, IconLogin, IconLogout, IconX, IconBolt, IconLock, IconHash, IconTrophy, IconDice5, IconStars, IconBuilding, IconMap, IconPaw, IconMovie, IconBuildingStore, IconSword, IconFlag, IconSparkles } from '@tabler/icons-react'
import GalaxyIcon from '@/components/ui/GalaxyIcon'
import type { User } from '@supabase/supabase-js'
import type { UserStats } from '@/lib/supabase'
import StatsModal from '@/components/ui/StatsModal'
import ProfileModal from '@/components/ui/ProfileModal'
import PlayerStatsModal from '@/components/ui/PlayerStatsModal'
import UpdatesModal from '@/components/ui/UpdatesModal'
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer'

const GAME_TYPES = [
  { id: 'default',  label: 'Random',  sub: 'Mixed vocabulary',       isRanked: false, Icon: IconDice5        },
  { id: 'expert',   label: 'Expert',  sub: 'Hard 12+ letters',        isRanked: false, Icon: IconStars        },
  { id: 'cities',   label: 'Cities',  sub: 'World cities',            isRanked: false, Icon: IconBuilding     },
  { id: 'places',   label: 'Places',  sub: 'World geography',         isRanked: false, Icon: IconMap          },
  { id: 'animals',  label: 'Animals', sub: 'Flora and fauna',         isRanked: false, Icon: IconPaw          },
  { id: 'movies',   label: 'Movies',  sub: 'Film titles & terms',     isRanked: false, Icon: IconMovie        },
  { id: 'brands',   label: 'Brands',  sub: 'Companies & logos',       isRanked: false, Icon: IconBuildingStore },
  { id: 'flags',    label: 'Flags',   sub: 'Name the country',         isRanked: false, Icon: IconFlag         },
  { id: 'ranked',   label: 'Ranked',  sub: 'Saves to leaderboard',    isRanked: true,  Icon: IconSword        },
]

interface Props {
  onCreateRoom: (name: string, category: string, isRanked: boolean) => void
  onJoinRoom: (name: string, code: string) => void
  onStartSolo: (name: string, category: string, isRanked: boolean, duration?: number) => void
  onStartQuickGame: (name: string) => void
  onOpenLeaderboard: () => void
  voiceSpeed: number
  onVoiceSpeedChange: (v: number) => void
  onTestVoice: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  authUser: User | null
  userStats: UserStats | null
  onOpenAuth: (mode: 'signin' | 'signup') => void
  onSignOut: () => void
  onStatsUpdated: (stats: UserStats) => void
}

export default function HomeScreen({
  onCreateRoom, onJoinRoom, onStartSolo, onStartQuickGame, onOpenLeaderboard,
  voiceSpeed, onVoiceSpeedChange, onTestVoice, theme, onToggleTheme,
  authUser, userStats, onOpenAuth, onSignOut, onStatsUpdated,
}: Props) {
  const [mode, setMode] = useState<'home' | 'gametype_private' | 'gametype_solo' | 'join'>('home')
  const [selectedType, setSelectedType] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpdates, setShowUpdates] = useState(false)
  const [soloDuration, setSoloDuration] = useState(60)
  const [sidebarData, setSidebarData] = useState<{ key: string; userId?: string; name: string; score: number }[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string; userId?: string } | null>(null)

  useEffect(() => {
    fetchLeaderboard().then((rows: HofScore[]) => {
      const best: Record<string, HofScore> = {}
      for (const r of rows) {
        if (!best[r.name] || r.score > best[r.name].score) best[r.name] = r
      }
      const userIdByName: Record<string, string> = {}
      for (const r of rows) {
        if (r.user_id && !userIdByName[r.name]) userIdByName[r.name] = r.user_id
      }
      const deduped = Object.values(best)
        .sort((a, b) => b.score - a.score)
        .map(r => ({ key: userIdByName[r.name] || r.name, userId: userIdByName[r.name], name: r.name, score: r.score }))
      setSidebarData(deduped)
    })
    const params = new URLSearchParams(window.location.search)
    const urlCode = params.get('code')
    if (urlCode) { setCode(urlCode.toUpperCase()); setMode('join') }
  }, [])

  // Pre-fill name from auth profile
  useEffect(() => {
    if (userStats?.display_name && !name.trim()) setName(userStats.display_name)
  }, [userStats?.display_name])

  const effectiveName = authUser ? (userStats?.display_name || 'Player') : name.trim()

  const fmtDuration = (s: number) => {
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60), r = s % 60
    return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')}`
  }

  const handleLaunch = () => {
    if (!effectiveName) { setErr('Enter your name first'); return }
    if (!selectedType) { setErr('Pick a game type first'); return }
    setErr('')
    const gt = GAME_TYPES.find(g => g.id === selectedType) || GAME_TYPES[0]
    if (mode === 'gametype_solo') {
      onStartSolo(effectiveName, gt.id, gt.isRanked, soloDuration)
    } else {
      onCreateRoom(effectiveName, gt.id, gt.isRanked)
    }
  }

  const handleQuickGame = () => {
    if (!effectiveName) { setErr('Enter your name first'); return }
    setErr('')
    onStartQuickGame(effectiveName)
  }

  const handleJoin = () => {
    if (!effectiveName) { setErr('Enter your name first'); return }
    if (code.trim().length < 3) { setErr('Enter a valid room code'); return }
    setErr('')
    onJoinRoom(effectiveName, code.trim())
  }

  const ranked = sidebarData.slice(0, 10)

  return (
    <>
      {/* Mobile Bottom Drawer */}
      <MobileBottomDrawer
        authUser={authUser}
        userStats={userStats}
        onOpenAuth={onOpenAuth}
        onSignOut={onSignOut}
        onStatsUpdated={onStatsUpdated}
        onOpenLeaderboard={onOpenLeaderboard}
        currentScreen="home"
      />
      
      <div className="setup-wrap" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '24px', background: 'var(--bg-page)' }}>

      {/* Full-width title bar */}
      <div style={{ width: '100%', maxWidth: '984px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="home-title-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-1px', whiteSpace: 'nowrap' }}>
          <GalaxyIcon size={52} stroke={1.5} style={{ width: '52px', height: '52px', flexShrink: 0 }} />
          <span className="home-title-text">Carbon Spelling</span>
        </div>
        
      </div>

      {/* Columns row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '984px', flexWrap: 'wrap' }}>

      {/* Left column: Leaderboard (desktop only) */}
      <div className="home-sidebar-col" style={{ width: '240px', flexShrink: 0, flexDirection: 'column', gap: '12px', position: 'sticky', top: '40px' }}>

        {/* Leaderboard */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '14px' }}>Leaderboard</div>
        {ranked.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: '12px', fontFamily: 'Space Mono, monospace', textAlign: 'center', padding: '20px 0' }}>No scores yet</div>
        ) : ranked.map((e, i) => {
          const bg = avatarColor(e.name)
          return (
            <div key={e.key}
              onClick={() => setSelectedPlayer({ name: e.name, userId: e.userId })}
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
        </div>{/* end leaderboard box */}
      </div>{/* end left column */}

      {/* Main card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '36px 32px', width: '100%', maxWidth: '440px', flexShrink: 0 }}>

        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Welcome, {authUser ? (userStats?.display_name || 'Player') : (name.trim() || 'Guest')}
          </h1>
        </div>

        {/* Name input — hidden when signed in */}
        {!authUser && (
          <>
            <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Your Name</div>
            <input
              value={name} onChange={e => { setName(e.target.value); setErr('') }}
              onKeyDown={e => { if (e.key === 'Enter' && mode === 'join') handleJoin() }}
              placeholder="Enter your name..." maxLength={16}
              style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '12px 14px', color: 'var(--text)', fontSize: '15px', outline: 'none', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </>
        )}

        {err && <div style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>{err}</div>}

        {/* ── HOME: 4 game mode cards ── */}
        {mode === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Casual ── */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text5)', marginBottom: '8px' }}>Casual</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Quick Game — full width */}
                <button onClick={handleQuickGame}
                  style={{ padding: '18px 16px', borderRadius: '14px', border: '1.5px solid #f59e0b', background: '#f59e0b', color: '#000', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', display: 'flex', alignItems: 'center', gap: '12px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}>
                  <IconBolt size={26} stroke={2} />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: '15px', fontWeight: 800 }}>Quick Game</strong>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>30s · multiplayer · Online</span>
                  </div>
                </button>
                {/* Solo + Private Casual side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => { if (!effectiveName) { setErr('Enter your name first'); return }; setErr(''); setMode('gametype_solo') }}
                    style={{ padding: '16px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', textAlign: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'var(--accent-pale)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}><IconUser size={24} stroke={1.5} /></div>
                    <strong style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Solo</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text5)' }}>Play Solo</span>
                  </button>
                  <button onClick={() => { if (!effectiveName) { setErr('Enter your name first'); return }; setErr(''); onCreateRoom(effectiveName, 'default', false) }}
                    style={{ padding: '16px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', textAlign: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'var(--accent-pale)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}><IconLock size={24} stroke={1.5} /></div>
                    <strong style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Private Casual</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text5)' }}>Create a room</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Ranked ── */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text5)', marginBottom: '8px' }}>Ranked</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Public Ranked — big, red, locked */}
                <div style={{ padding: '18px 16px', borderRadius: '14px', border: '1.5px solid #dc262655', background: '#dc262618', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #dc262608 8px, #dc262608 16px)' }} />
                  <IconTrophy size={26} stroke={2} style={{ color: '#dc2626', flexShrink: 0, position: 'relative' }} />
                  <div style={{ textAlign: 'left', position: 'relative' }}>
                    <strong style={{ display: 'block', fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>Public Ranked</strong>
                    <span style={{ fontSize: '11px', color: '#dc262699' }}>Global matchmaking</span>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', background: '#dc262622', border: '1px solid #dc262644', borderRadius: '20px', padding: '3px 9px', color: '#dc2626', flexShrink: 0, position: 'relative' }}>
                    Coming soon
                  </span>
                </div>

                {/* Solo Ranked + Private Ranked side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => { if (!effectiveName) { setErr('Enter your name first'); return }; setErr(''); onStartSolo(effectiveName, 'ranked', true) }}
                    style={{ padding: '16px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', textAlign: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#dc262612' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}><IconUser size={24} stroke={1.5} /></div>
                    <strong style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Solo Ranked</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text5)' }}>Play Solo</span>
                  </button>
                  <button onClick={() => { if (!effectiveName) { setErr('Enter your name first'); return }; setErr(''); onCreateRoom(effectiveName, 'ranked', true) }}
                    style={{ padding: '16px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', textAlign: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#dc262612' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}><IconLock size={24} stroke={1.5} /></div>
                    <strong style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>Private Ranked</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text5)' }}>Create a room</span>
                  </button>
                </div>

              </div>
            </div>

            {/* ── Join a Lobby ── */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text5)', marginBottom: '8px' }}>Join a Lobby</div>
            <button onClick={() => { if (!effectiveName) { setErr('Enter your name first'); return }; setErr(''); setMode('join') }}
              style={{ padding: '14px 16px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text4)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'var(--accent-pale)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text4)'; e.currentTarget.style.background = 'var(--surface2)' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Join a Lobby</span>
            </button>

          </div>
        )}

        {/* ── GAME TYPE (Private or Solo) ── */}
        {(mode === 'gametype_private' || mode === 'gametype_solo') && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => { setMode('home'); setSelectedType(''); setErr('') }} style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', fontSize: '18px', padding: 0 }}>←</button>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
                {mode === 'gametype_solo' ? <IconUser size={13} stroke={1.5} /> : <IconLock size={13} stroke={1.5} />}
                {mode === 'gametype_solo' ? 'Solo' : 'Private Casual'}
              </span>
            </div>

            <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>Game Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
              {GAME_TYPES.filter(gt => gt.id !== 'ranked').map(gt => {
                const isSelected = selectedType === gt.id
                return (
                  <button key={gt.id} onClick={() => setSelectedType(gt.id)}
                    style={{ padding: '14px 10px', borderRadius: '12px', border: `1.5px solid ${isSelected ? '#f59e0b' : 'var(--border)'}`, background: isSelected ? 'var(--accent-pale)' : 'var(--surface2)', color: isSelected ? '#f59e0b' : 'var(--text3)', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'var(--accent-pale)' } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)' } }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: isSelected ? '#f59e0b22' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                      <gt.Icon size={18} stroke={1.5} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>{gt.label}</strong>
                      <span style={{ fontSize: '10px', color: isSelected ? '#d97706' : 'var(--text5)', lineHeight: 1.3 }}>{gt.sub}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Duration slider — solo only */}
            {mode === 'gametype_solo' && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Game Duration</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{fmtDuration(soloDuration)}</span>
                </div>
                <input type="range" min={15} max={120} step={15} value={soloDuration}
                  onChange={e => setSoloDuration(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text6)' }}>15s</span>
                  <span style={{ fontSize: '10px', color: 'var(--text6)' }}>2 min</span>
                </div>
              </div>
            )}

            <button onClick={handleLaunch}
              style={{ width: '100%', padding: '13px', borderRadius: '11px', background: '#f59e0b', color: '#000', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}>
              {mode === 'gametype_solo' ? `Play Solo · ${fmtDuration(soloDuration)}` : 'Create Room'}
            </button>
          </>
        )}

        {/* ── JOIN GAME ── */}
        {mode === 'join' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', fontSize: '18px', padding: 0 }}>←</button>
              <span style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Join a Lobby</span>
            </div>

            <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>Room Code</div>
            <input id="join-code-input"
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin() }}
              placeholder="e.g. BEE7" maxLength={6}
              style={{ width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '14px', color: 'var(--text)', fontSize: '24px', fontFamily: 'Space Mono, monospace', letterSpacing: '6px', textAlign: 'center', outline: 'none', marginBottom: '12px', textTransform: 'uppercase' }}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />

            <button onClick={handleJoin} style={{ width: '100%', padding: '13px', borderRadius: '11px', background: '#f59e0b', color: '#000', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Join Lobby
            </button>
          </>
        )}

      </div>

      {/* Right: Account box (desktop only) */}
      <div className="home-account" style={{ width: '240px', flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 16px', position: 'sticky', top: '40px' }}>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '16px' }}>
          {(() => {
            const displayName = authUser ? (userStats?.display_name || authUser.email || 'Player') : (name.trim() || 'Guest')
            const subtitle = authUser ? authUser.email : (name.trim() ? 'Player' : 'Not signed in')
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
            { label: 'View Stats',   Icon: IconChartBar,   action: () => setShowStats(true) },
            { label: 'View Profile', Icon: IconUser,       action: () => setShowProfile(true) },
            { label: 'Settings',     Icon: IconSettings,   action: () => setShowSettings(true) },
            { label: 'Updates',      Icon: IconSparkles,   action: () => setShowUpdates(true) },
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
      </div>{/* end columns row */}
      </div>{/* end columns wrapper */}

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

            {/* Theme Toggle */}
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
