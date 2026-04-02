'use client'
import { useState, useEffect } from 'react'
import { IconHome, IconTrophy, IconUser, IconX, IconChartBar, IconSettings, IconUserPlus, IconLogin, IconLogout } from '@tabler/icons-react'
import { avatarColor } from '@/lib/words'
import { type UserStats } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import StatsModal from './StatsModal'
import ProfileModal from './ProfileModal'

interface Props {
  // Auth & User
  authUser: User | null
  userStats: UserStats | null
  onOpenAuth: (mode: 'signin' | 'signup') => void
  onSignOut: () => void
  onStatsUpdated: (stats: UserStats) => void
  
  // Navigation
  onGoHome?: () => void
  onOpenLeaderboard?: () => void
  
  // Current screen context
  currentScreen?: 'home' | 'game' | 'waiting' | 'results' | 'leaderboard'
}

export default function MobileBottomDrawer({
  authUser, userStats, onOpenAuth, onSignOut, onStatsUpdated,
  onGoHome, onOpenLeaderboard, currentScreen = 'home'
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Close drawer when clicking outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const drawer = document.getElementById('mobile-bottom-drawer')
      const trigger = document.getElementById('mobile-drawer-trigger')
      if (drawer && !drawer.contains(e.target as Node) && !trigger?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    // Prevent body scroll when drawer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const displayName = authUser ? (userStats?.display_name || authUser.email || 'Player') : 'Guest'
  const bg = avatarColor(displayName)


  const handleTabClick = (tab: 'home' | 'leaderboard' | 'profile') => {
    if (tab === 'home' && onGoHome) {
      onGoHome()
      return
    }
    
    if (tab === 'leaderboard' && onOpenLeaderboard) {
      onOpenLeaderboard()
      return
    }
    
    if (tab === 'profile') {
      setIsOpen(true)
    }
  }

  return (
    <>
      {/* Bottom Navigation Bar - only show on mobile */}
      <div
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 1000,
          padding: '0 20px'
        }}
      >
        {/* Home */}
        <button
          onClick={() => handleTabClick('home')}
          style={{
            background: 'none',
            border: 'none',
            color: currentScreen === 'home' ? '#f59e0b' : 'var(--text5)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            minWidth: '60px'
          }}
        >
          <IconHome size={22} stroke={1.5} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Home</span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => handleTabClick('leaderboard')}
          style={{
            background: 'none',
            border: 'none',
            color: currentScreen === 'leaderboard' ? '#f59e0b' : 'var(--text5)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            minWidth: '60px'
          }}
        >
          <IconTrophy size={22} stroke={1.5} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Leaderboard</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => handleTabClick('profile')}
          style={{
            background: 'none',
            border: 'none',
            color: isOpen ? '#f59e0b' : 'var(--text5)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            minWidth: '60px'
          }}
        >
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: bg + '25',
            color: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            border: `1px solid ${bg}40`
          }}>
            {displayName[0].toUpperCase()}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Profile</span>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9998,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      {/* Bottom Drawer */}
      <div
        id="mobile-bottom-drawer"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60vh',
          maxHeight: '500px',
          background: 'var(--surface)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          zIndex: 9999,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {/* Handle */}
        <div style={{
          width: '40px',
          height: '4px',
          background: 'var(--border-strong)',
          borderRadius: '2px',
          margin: '12px auto 0',
          flexShrink: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.5px'
          }}>
            Profile
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text5)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.12s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}
          >
            <IconX size={20} stroke={2} />
          </button>
        </div>

        {/* Content - Only Profile Tab */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '20px' }}>
            {/* Profile Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '20px',
              background: 'var(--surface2)',
              borderRadius: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: bg + '25',
                color: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                flexShrink: 0,
                border: `2px solid ${bg}40`
              }}>
                {displayName[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {displayName}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text5)',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {authUser ? authUser.email : 'Not signed in'}
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(authUser ? [
                { label: 'View Stats', Icon: IconChartBar, action: () => setShowStats(true) },
                { label: 'Edit Profile', Icon: IconUser, action: () => setShowProfile(true) },
                { label: 'Settings', Icon: IconSettings, action: () => {} },
                { label: 'Sign Out', Icon: IconLogout, action: onSignOut }
              ] : [
                { label: 'Sign Up', Icon: IconUserPlus, action: () => onOpenAuth('signup') },
                { label: 'Sign In', Icon: IconLogin, action: () => onOpenAuth('signin') }
              ]).map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action()
                    if (item.label !== 'View Stats' && item.label !== 'Edit Profile') {
                      setIsOpen(false)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: item.label === 'Sign Out' ? 'var(--red)' : 'var(--text4)',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'left',
                    transition: 'all 0.12s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--surface2)'
                    e.currentTarget.style.color = item.label === 'Sign Out' ? 'var(--red)' : 'var(--text)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = item.label === 'Sign Out' ? 'var(--red)' : 'var(--text4)'
                  }}
                >
                  <item.Icon size={18} stroke={1.5} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && (
        <StatsModal
          stats={userStats}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Profile Modal */}
      {showProfile && authUser && (
        <ProfileModal
          authUser={authUser}
          userStats={userStats}
          onClose={() => setShowProfile(false)}
          onUpdated={(stats) => {
            onStatsUpdated(stats)
            setShowProfile(false)
          }}
        />
      )}
    </>
  )
}