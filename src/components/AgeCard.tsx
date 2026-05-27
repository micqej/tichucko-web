import type { AgeCategory } from '@/lib/types'

interface Props {
  age: AgeCategory
  count: number
  onClick?: () => void
  active?: boolean
}

export default function AgeCard({ age, count, onClick, active }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: 24, padding: '22px 18px 24px',
        background: active ? age.color + '22' : 'var(--paper)',
        border: `1.5px solid ${active ? age.color : 'var(--paper-edge)'}`,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden', cursor: 'pointer',
        textAlign: 'left', transition: 'transform .2s ease, box-shadow .2s ease',
        width: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = '0 24px 50px -18px rgba(31,34,71,.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}
    >
      {/* bg blob */}
      <span style={{
        position: 'absolute', right: '-30%', bottom: '-50%',
        width: '140%', aspectRatio: '1', borderRadius: '50%',
        background: age.color, opacity: 0.14, pointerEvents: 'none',
      }} />

      <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', background: 'rgba(31,34,71,.06)', padding: '4px 10px', borderRadius: 999 }}>
        {count} {count === 1 ? 'rozprávka' : 'rozprávky'}
      </span>

      <div style={{ fontSize: 42, lineHeight: 1 }}>{age.emoji}</div>
      <div style={{ fontWeight: 800, color: age.color, fontSize: 14, marginTop: 14 }}>{age.range}</div>
      <h3 style={{ fontSize: 22, fontWeight: 900, marginTop: 4, color: 'var(--ink)' }}>{age.label}</h3>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.5, position: 'relative' }}>{age.blurb}</p>

      {/* values pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, position: 'relative' }}>
        {age.values.slice(0, 5).map(v => (
          <span key={v} style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
            background: age.color + '1a', color: age.color, letterSpacing: '.02em',
          }}>{v}</span>
        ))}
        {age.values.length > 5 && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(31,34,71,.06)', color: 'var(--ink-soft)' }}>
            +{age.values.length - 5}
          </span>
        )}
      </div>
    </button>
  )
}
