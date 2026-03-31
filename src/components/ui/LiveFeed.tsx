'use client'

interface Props {
  items: { id: number; msg: string; type: 'ok' | 'no' }[]
}

export default function LiveFeed({ items }: Props) {
  return (
    <div style={{ position: 'fixed', top: '14px', right: '14px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 100, pointerEvents: 'none' }}>
      {items.map(f => (
        <div key={f.id} style={{ background: '#111', border: `1px solid ${f.type === 'ok' ? '#78350f' : '#7f1d1d'}`, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontFamily: 'Space Mono, monospace', color: f.type === 'ok' ? '#f59e0b' : '#f87171', animation: 'feedIn .3s ease', maxWidth: '180px' }}>
          {f.msg}
        </div>
      ))}
    </div>
  )
}
