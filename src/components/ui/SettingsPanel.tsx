'use client'

interface Props {
  speed: number
  onChange: (v: number) => void
  onTest: () => void
  onClose: () => void
}

const speedLabel = (n: number) => {
  if (n <= -30) return 'Very slow'
  if (n <= -20) return 'Slow'
  if (n <= -10) return 'Normal'
  if (n <= 0) return 'Fast'
  return 'Very fast'
}

export default function SettingsPanel({ speed, onChange, onTest, onClose }: Props) {
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Voice Speed</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: '#555', minWidth: '32px' }}>Slow</span>
        <input type="range" min={-40} max={20} step={5} value={speed}
          onChange={e => onChange(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: '#f59e0b' }} />
        <span style={{ fontSize: '11px', color: '#555', minWidth: '32px' }}>Fast</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#f59e0b' }}>{speedLabel(speed)}</span>
        <button onClick={onTest} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#555', fontSize: '11px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Test
        </button>
      </div>
    </div>
  )
}
