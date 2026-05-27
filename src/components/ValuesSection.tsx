import { VALUES_HIGHLIGHT, AGE_CATEGORIES } from '@/lib/data'

export default function ValuesSection() {
  return (
    <section id="hodnoty" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 'clamp(28px,3.4vw,42px)', fontWeight: 900, color: 'var(--ink)' }}>
            Čo deti v Tichučku objavujú
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8, maxWidth: 520 }}>
            Každá rozprávka má svoju hlavu a pätu — a niečo, čo si dieťa odnesie do sŕdca.
          </p>
        </div>

        {/* Highlight cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16, marginBottom: 48 }}>
          {VALUES_HIGHLIGHT.map(v => (
            <div key={v.title} style={{
              background: 'var(--paper)', border: '1px solid var(--paper-edge)', borderRadius: 20,
              padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0,
                background: v.bg,
              }}>{v.icon}</div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>{v.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Per-age value tables */}
        <h3 style={{ fontSize: 'clamp(22px,2.8vw,32px)', fontWeight: 900, color: 'var(--ink)', marginBottom: 24 }}>
          Hodnoty podľa veku
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
          {AGE_CATEGORIES.map(age => (
            <div key={age.id} style={{
              background: 'var(--paper)', border: `1.5px solid ${age.color}33`,
              borderRadius: 20, padding: '20px 18px', overflow: 'hidden', position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: age.color, borderRadius: '20px 20px 0 0' }} />
              <div style={{ fontSize: 28, marginBottom: 8 }}>{age.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: age.color, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 4 }}>{age.range}</div>
              <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', marginBottom: 14 }}>{age.label}</h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {age.values.map(v => (
                  <li key={v} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-soft)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: age.color, flexShrink: 0 }} />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
