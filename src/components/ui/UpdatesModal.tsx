'use client'
import { useState, useEffect } from 'react'
import { IconX, IconGitCommit, IconRefresh } from '@tabler/icons-react'

interface Commit {
  sha: string
  message: string
  author: string
  date: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  return `${months}mo ago`
}

function parseCommitMessage(message: string): { title: string; body: string | null } {
  const lines = message.trim().split('\n')
  const title = lines[0].trim()
  const body = lines.slice(1).join('\n').trim() || null
  return { title, body }
}

interface Props {
  onClose: () => void
}

export default function UpdatesModal({ onClose }: Props) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/updates')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCommits(data)
    } catch {
      setError('Could not load updates. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Game Updates</div>
            <div style={{ fontSize: '11px', color: 'var(--text5)', marginTop: '2px' }}>Latest changes from GitHub</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={load} disabled={loading}
              style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: loading ? 'not-allowed' : 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .12s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text5)' }}>
              <IconRefresh size={16} stroke={1.5} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text5)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text5)')}>
              <IconX size={18} stroke={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '13px', color: 'var(--text5)' }}>Loading updates...</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '12px' }}>{error}</div>
              <button onClick={load}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text4)', fontSize: '12px', padding: '7px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && commits.map((c, i) => {
            const { title, body } = parseCommitMessage(c.message)
            const isFirst = i === 0
            return (
              <div key={c.sha} style={{ display: 'flex', gap: '12px', padding: '12px 20px', borderBottom: i < commits.length - 1 ? '1px solid var(--surface2)' : 'none' }}>
                {/* Timeline dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: isFirst ? '#f59e0b22' : 'var(--surface2)', border: `1.5px solid ${isFirst ? '#f59e0b' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconGitCommit size={12} stroke={2} style={{ color: isFirst ? '#f59e0b' : 'var(--text5)' }} />
                  </div>
                  {i < commits.length - 1 && (
                    <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '4px', minHeight: '16px' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: body ? '4px' : '0' }}>
                    <span style={{ fontSize: '13px', fontWeight: isFirst ? 700 : 600, color: isFirst ? 'var(--text)' : 'var(--text2)', lineHeight: 1.4, flex: 1 }}>{title}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text5)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>{timeAgo(c.date)}</span>
                  </div>
                  {body && (
                    <div style={{ fontSize: '11px', color: 'var(--text5)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{body}</div>
                  )}
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', color: 'var(--text6)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: '4px' }}>{c.sha}</code>
                  </div>
                </div>
              </div>
            )
          })}

          {!loading && !error && commits.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text5)', fontSize: '13px' }}>No updates found.</div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
