'use client'
import { IconGalaxy, IconUserPlus, IconLogin, IconUser } from '@tabler/icons-react'

interface Props {
  onOpenAuth: (mode: 'signin' | 'signup') => void
  onGuest: () => void
}

export default function WelcomeModal({ onOpenAuth, onGuest }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '36px 28px',
        width: '100%', maxWidth: '380px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <IconGalaxy size={36} stroke={1.5} color="#f59e0b" />
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Carbon Spelling
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text4)', marginBottom: '30px', lineHeight: 1.6 }}>
          Sign in to track stats, save your ranked scores, and compete on the leaderboard.
        </p>

        {/* Sign Up */}
        <button
          onClick={() => onOpenAuth('signup')}
          style={{
            width: '100%', padding: '13px', borderRadius: '11px',
            background: '#f59e0b', color: '#000',
            fontSize: '15px', fontWeight: 700, border: 'none',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '10px', transition: 'background .12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fbbf24')}
          onMouseLeave={e => (e.currentTarget.style.background = '#f59e0b')}
        >
          <IconUserPlus size={18} stroke={2} />
          Create Account
        </button>

        {/* Sign In */}
        <button
          onClick={() => onOpenAuth('signin')}
          style={{
            width: '100%', padding: '13px', borderRadius: '11px',
            background: 'var(--surface2)', color: 'var(--text)',
            fontSize: '15px', fontWeight: 600, border: '1.5px solid var(--border)',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '20px', transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <IconLogin size={18} stroke={1.5} />
          Sign In
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text5)', fontWeight: 600, letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Guest */}
        <button
          onClick={onGuest}
          style={{
            width: '100%', padding: '11px', borderRadius: '11px',
            background: 'transparent', color: 'var(--text4)',
            fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text4)' }}
        >
          <IconUser size={15} stroke={1.5} />
          Play as Guest
        </button>

        <p style={{ fontSize: '11px', color: 'var(--text6)', marginTop: '14px' }}>
          Guests can play but scores won&apos;t be saved.
        </p>
      </div>
    </div>
  )
}
