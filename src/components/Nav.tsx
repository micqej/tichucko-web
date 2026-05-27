'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

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
        background: 'linear-gradient(180deg, rgba(253,246,238,.85), rgba(253,246,238,.45))',
        borderBottom: '1px solid rgba(31,34,71,.08)',
      }}
      className="night:![background:linear-gradient(180deg,rgba(14,18,48,.85),rgba(14,18,48,.45))]"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: 26, color: 'var(--ink)' }}>
          <span style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'conic-gradient(from 210deg, #ff6b9d, #ffb347, #7cc6ff, #c89bff, #ff6b9d)',
            display: 'grid', placeItems: 'center', color: '#fff', fontSize: 22,
            boxShadow: 'var(--shadow)',
          }}>🌙</span>
          tichučko
        </Link>

        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {[['#vekove', 'Vekové kategórie'], ['#rozpravky', 'Rozprávky'], ['#hodnoty', 'Hodnoty'], ['#odoberat', 'Odoberať']].map(([href, label]) => (
            <a key={href} href={href} style={{
              padding: '10px 16px', borderRadius: 999, fontWeight: 600, fontSize: 15,
              color: 'var(--ink)', transition: '.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(31,34,71,.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{label}</a>
          ))}
        </nav>

        <button
          onClick={toggleNight}
          title={night ? 'Denný režim' : 'Nočný režim'}
          style={{
            width: 44, height: 44, borderRadius: 14,
            display: 'grid', placeItems: 'center',
            background: 'rgba(31,34,71,.06)', transition: '.2s',
            color: 'var(--ink)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(-12deg) scale(1.06)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = '' }}
        >
          {night ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>
    </header>
  )
}
