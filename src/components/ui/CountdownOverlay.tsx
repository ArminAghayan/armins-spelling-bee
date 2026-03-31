'use client'

interface Props { num: number }

export default function CountdownOverlay({ num }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '96px', fontWeight: 700, color: '#f59e0b', animation: 'zin .4s ease', lineHeight: 1 }}>
        {num === 0 ? 'GO!' : num}
      </div>
      <div style={{ fontSize: '16px', color: '#555', marginTop: '12px', letterSpacing: '0.5px' }}>
        Get ready to spell!
      </div>
    </div>
  )
}
