'use client'

interface Props {
  items: { id: number; msg: string; type: 'ok' | 'no' }[]
}

export default function LiveFeed({ items }: Props) {
  return (
    <div style={{ position: 'fixed', top: '14px', right: '14px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 100, pointerEvents: 'none' }}>
      {items.map(f => (
        <div key={f.id} style={{ background: 'var(--surface)', border: `1px solid ${f.type === 'ok' ? '#f59e0b' : 'var(--red)'}`, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontFamily: 'Space Mono, monospace', color: f.type === 'ok' ? '#f59e0b' : 'var(--red)', animation: 'feedIn .3s ease', maxWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {f.msg}
        </div>
      ))}
    </div>
  )
}
