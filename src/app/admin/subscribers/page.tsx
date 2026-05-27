import { supabaseAdmin } from '@/lib/supabase'
import type { Subscriber } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'

export default async function AdminSubscribersPage() {
  const db = supabaseAdmin()
  const { data, count } = await db
    .from('subscribers')
    .select('*', { count: 'exact' })
    .order('subscribed_at', { ascending: false })
  const subs: Subscriber[] = data ?? []
  const active = subs.filter(s => s.active).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>Odberatelia</h1>
          <p style={{ color: '#7a7faa', marginTop: 4 }}>{active} aktívnych · {(count ?? 0) - active} neaktívnych</p>
        </div>
        <a
          href="/api/admin/subscribers?export=csv"
          style={{ padding: '11px 18px', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#cdc7e0', fontWeight: 700, fontSize: 13 }}
        >⬇ Export CSV</a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
        {AGE_CATEGORIES.map(age => {
          const cnt = subs.filter(s => s.age_preference === age.id && s.active).length
          return (
            <div key={age.id} style={{ background: '#1a1f48', borderRadius: 12, padding: '14px 16px', border: `1px solid ${age.color}30` }}>
              <div style={{ fontSize: 22 }}>{age.emoji}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: age.color, fontFamily: 'var(--font-fraunces)', margin: '4px 0 2px' }}>{cnt}</div>
              <div style={{ fontSize: 11, color: '#7a7faa', fontWeight: 700 }}>{age.range}</div>
            </div>
          )
        })}
        <div style={{ background: '#1a1f48', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ fontSize: 22 }}>🌍</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#f6f1e1', fontFamily: 'var(--font-fraunces)', margin: '4px 0 2px' }}>
            {subs.filter(s => s.age_preference === 'all' && s.active).length}
          </div>
          <div style={{ fontSize: 11, color: '#7a7faa', fontWeight: 700 }}>Všetky vekové</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1a1f48', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              {['Email', 'Vek', 'Stav', 'Prihlásenie'].map((h, i) => (
                <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#7a7faa', letterSpacing: '.07em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map(s => {
              const age = AGE_CATEGORIES.find(a => a.id === s.age_preference)
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 600, color: '#f6f1e1' }}>{s.email}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (age?.color ?? '#7cc6ff') + '22', color: age?.color ?? '#7cc6ff' }}>
                      {age ? `${age.emoji} ${age.range}` : 'Všetky'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 999, background: s.active ? '#9be59b22' : '#ff6b6b22', color: s.active ? '#9be59b' : '#ff6b6b' }}>
                      {s.active ? '● Aktívny' : '○ Odhlásený'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#7a7faa' }}>
                    {new Date(s.subscribed_at).toLocaleDateString('sk-SK')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {subs.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#7a7faa' }}>Zatiaľ žiadni odberatelia.</div>}
      </div>
    </div>
  )
}
