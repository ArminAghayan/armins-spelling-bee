'use client'
import { useState } from 'react'
import { IconX, IconMail, IconLock, IconUser } from '@tabler/icons-react'
import { authSignIn, authSignUp } from '@/lib/supabase'

interface Props {
  initialMode: 'signin' | 'signup'
  onClose: () => void
}

export default function AuthModal({ initialMode, onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setErr('')
    setSuccess('')
    if (!email.trim() || !password.trim()) { setErr('Please fill in all fields'); return }
    if (mode === 'signup' && !displayName.trim()) { setErr('Enter a display name'); return }
    if (password.length < 6) { setErr('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      if (mode === 'signup') {
        await authSignUp(email.trim(), password, displayName.trim())
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
        setPassword('')
      } else {
        await authSignIn(email.trim(), password)
        onClose()
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email rate')) {
        setErr('Too many sign-up attempts. Please wait a few minutes and try again, or sign in if you already have an account.')
      } else {
        setErr(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    padding: '11px 12px 11px 36px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px 24px', width: '100%', maxWidth: '380px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </span>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .12s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
            <IconX size={18} stroke={2} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '4px', marginBottom: '22px' }}>
          {(['signin', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(''); setSuccess('') }}
              style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: mode === m ? 'var(--surface)' : 'transparent', color: mode === m ? 'var(--text)' : 'var(--text4)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .12s', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.2)' : 'none' }}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Success */}
        {success && (
          <div style={{ background: '#052e16', border: '1px solid #16a34a', borderRadius: '8px', padding: '10px 12px', color: '#4ade80', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
            {success}
          </div>
        )}

        {/* Display name (signup only) */}
        {mode === 'signup' && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Display Name</div>
            <div style={{ position: 'relative' }}>
              <IconUser size={15} stroke={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text5)', pointerEvents: 'none' }} />
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Your in-game name" maxLength={16} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Email</div>
          <div style={{ position: 'relative' }}>
            <IconMail size={15} stroke={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text5)', pointerEvents: 'none' }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Password</div>
          <div style={{ position: 'relative' }}>
            <IconLock size={15} stroke={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text5)', pointerEvents: 'none' }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
        </div>

        {/* Error */}
        {err && (
          <div style={{ background: '#2d0a0a', border: '1px solid #f87171', borderRadius: '8px', padding: '10px 12px', color: '#f87171', fontSize: '12px', marginBottom: '16px' }}>
            {err}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '13px', borderRadius: '11px', background: '#f59e0b', color: '#000', fontSize: '15px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.7 : 1, transition: 'all .12s' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#fbbf24' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f59e0b' }}>
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
