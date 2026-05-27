'use client'

export default function HeroButtons() {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
      <a
        href="#vekove"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 22px', borderRadius: 999, fontWeight: 700, fontSize: 15,
          background: 'var(--ink)', color: 'var(--bg)',
          boxShadow: 'var(--shadow)', transition: 'transform .15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >Vyberte si vek dieťatka →</a>

      <a
        href="#odoberat"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 22px', borderRadius: 999, fontWeight: 700, fontSize: 15,
          background: 'rgba(31,34,71,.06)', color: 'var(--ink)',
          transition: 'transform .15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >🌙 Odoberať zadarmo</a>
    </div>
  )
}
