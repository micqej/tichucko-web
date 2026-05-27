'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const SPARKLES = [
  { char: '✦', x: -28, y: -8,  size: 9,  delay: '0s'    },
  { char: '✧', x: -14, y: 18,  size: 7,  delay: '-1.2s' },
  { char: '✦', x:  54, y: -10, size: 6,  delay: '-0.6s' },
  { char: '✧', x:  68, y: 14,  size: 8,  delay: '-1.8s' },
]

export default function Nav() {
  const [night, setNight] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('tichucko-night') === 'true'
    setNight(stored)
    document.documentElement.classList.toggle('night', stored)
  }, [])

  function toggleNight() {
    const next = !night
    setNight(next)
    document.documentElement.classList.toggle('night', next)
    localStorage.setItem('tichucko-night', String(next))
  }

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        backdropFilter: 'blur(14px)',
        background: 'linear-gradient(180deg, rgba(253,246,238,.88), rgba(253,246,238,.50))',
        borderBottom: '1px solid rgba(31,34,71,.08)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 24 }}>

        {/* Logo with floating sparkles */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: 26, color: 'var(--ink)', position: 'relative' }}>
          <span style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'conic-gradient(from 210deg, #ff6b9d, #ffb347, #7cc6ff, #c89bff, #ff6b9d)',
            display: 'grid', placeItems: 'center', color: '#fff', fontSize: 22,
            boxShadow: '0 4px 18px rgba(200,155,255,.45), var(--shadow)',
            flexShrink: 0,
          }}>🌙</span>

          <span style={{ position: 'relative' }}>
            tichučko
            {/* floating sparkles around logo text */}
            {SPARKLES.map((sp, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: sp.x,
                  top: sp.y,
                  fontSize: sp.size,
                  color: i % 2 === 0 ? '#c89bff' : '#ffb347',
                  animation: `twinkle 2.6s ease-in-out infinite`,
                  animationDelay: sp.delay,
                  pointerEvents: 'none',
                  textShadow: '0 0 6px currentColor',
                }}
              >{sp.char}</span>
            ))}
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          {[
            ['#vekove',    'Vekové kategórie'],
            ['#rozpravky', 'Rozprávky'],
            ['#hodnoty',   'Hodnoty'],
            ['#odoberat',  'Odoberať'],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{
              padding: '9px 15px', borderRadius: 999, fontWeight: 600, fontSize: 14,
              color: 'var(--ink)', transition: '.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,155,255,.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{label}</a>
          ))}
        </nav>

        {/* Night toggle */}
        <button
          onClick={toggleNight}
          title={night ? 'Denný režim' : 'Nočný režim'}
          style={{
            width: 44, height: 44, borderRadius: 14,
            display: 'grid', placeItems: 'center',
            background: night ? 'rgba(200,155,255,.15)' : 'rgba(31,34,71,.06)',
            border: night ? '1px solid rgba(200,155,255,.3)' : '1px solid transparent',
            transition: '.2s',
            color: 'var(--ink)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(-12deg) scale(1.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = '' }}
        >
          {night ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>
    </header>
  )
}
