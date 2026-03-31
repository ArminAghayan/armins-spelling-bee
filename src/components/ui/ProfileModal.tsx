'use client'
import { useState } from 'react'
import { IconX, IconPencil, IconCheck, IconMail, IconUser } from '@tabler/icons-react'
import { avatarColor } from '@/lib/words'
import { upsertUserStats, updateLeaderboardName, type UserStats } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Props {
  authUser: User
  userStats: UserStats | null
  onClose: () => void
  onUpdated: (stats: UserStats) => void
}

export default function ProfileModal({ authUser, userStats, onClose, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(userStats?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  const displayName = userStats?.display_name || authUser.email?.split('@')[0] || 'Player'
  const bg = avatarColor(editing ? (newName.trim() || displayName) : displayName)

  const handleSave = async () => {
    const trimmed = newName.trim()
    if (!trimmed) { setErr('Name cannot be empty'); return }
    if (trimmed.length > 16) { setErr('Max 16 characters'); return }
    setErr('')
    setSaving(true)
    try {
      await upsertUserStats({
        id: authUser.id,
        display_name: trimmed,
      })
      if (userStats?.display_name !== trimmed) {
        await updateLeaderboardName(authUser.id, trimmed)
      }
      const updated: UserStats = {
        ...(userStats ?? {
          id: authUser.id,
          ranked_high_score: 0,
          highest_streak: 0,
          total_words_attempted: 0,
          total_words_correct: 0,
          longest_word: '',
          total_wins: 0,
          total_losses: 0,
          wins_by_mode: {},
        }),
        display_name: trimmed,
      }
      onUpdated(updated)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px 24px', width: '100%', maxWidth: '360px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px', transition: 'color .12s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
          <IconX size={18} stroke={2} />
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: bg + '25', color: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, border: `3px solid ${bg}50`, marginBottom: '12px', transition: 'all .2s' }}>
            {(editing ? (newName.trim() || displayName) : displayName)[0].toUpperCase()}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text5)' }}>Your Profile</div>
        </div>

        {/* Display Name */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconUser size={11} stroke={2} />
            Display Name
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={newName}
                onChange={e => { setNewName(e.target.value); setErr('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setNewName(userStats?.display_name || '') } }}
                maxLength={16}
                autoFocus
                style={{ flex: 1, background: 'var(--surface2)', border: '1.5px solid #f59e0b', borderRadius: '10px', padding: '10px 12px', color: 'var(--text)', fontSize: '14px', fontWeight: 600, outline: 'none', fontFamily: 'Inter, sans-serif' }}
              />
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px 14px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1, transition: 'all .12s' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#fbbf24' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f59e0b' }}>
                <IconCheck size={16} stroke={2.5} />
              </button>
              <button onClick={() => { setEditing(false); setNewName(userStats?.display_name || ''); setErr('') }}
                style={{ padding: '10px 12px', background: 'var(--surface2)', color: 'var(--text4)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
                <IconX size={14} stroke={2} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                {saved ? (
                  <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconCheck size={14} stroke={2.5} />
                    Saved!
                  </span>
                ) : displayName}
              </span>
              <button onClick={() => setEditing(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text5)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f59e0b')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
                <IconPencil size={14} stroke={1.5} />
              </button>
            </div>
          )}

          {err && <div style={{ color: 'var(--red)', fontSize: '11px', marginTop: '5px' }}>{err}</div>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text5)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconMail size={11} stroke={2} />
            Email
          </div>
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}>{authUser.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
