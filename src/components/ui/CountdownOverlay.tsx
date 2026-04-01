'use client'

import { useEffect } from 'react'

interface Props { num: number }

function playBeep(isGo: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (isGo) {
      osc.frequency.value = 1047 // C6 — bright "go!" tone
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.55)
    } else {
      osc.frequency.value = 660 // E5 — short tick
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.18)
    }

    osc.onended = () => ctx.close()
  } catch {
    // Audio not supported — silently ignore
  }
}

export default function CountdownOverlay({ num }: Props) {
  useEffect(() => {
    playBeep(num === 0)
  }, [num])

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
