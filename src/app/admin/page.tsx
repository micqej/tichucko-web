import { supabaseAdmin } from '@/lib/supabase'

async function getStats() {
  const db = supabaseAdmin()
  const [stories, subscribers, topics, sends] = await Promise.all([
    db.from('stories').select('id', { count: 'exact', head: true }),
    db.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true),
    db.from('topics').select('id', { count: 'exact', head: true }).eq('used', false),
    db.from('daily_sends').select('*').order('sent_at', { ascending: false }).limit(5),
  ])
  return {
    stories: stories.count ?? 0,
    subscribers: subscribers.count ?? 0,
    unusedTopics: topics.count ?? 0,
    recentSends: sends.data ?? [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Rozprávky', value: stats.stories, icon: '📖', color: '#7cc6ff' },
    { label: 'Aktívni odberatelia', value: stats.subscribers, icon: '📬', color: '#9be59b' },
    { label: 'Nepouž. témy', value: stats.unusedTopics, icon: '🗂️', color: '#ffb347' },
    { label: 'Odoslané dnes', value: stats.recentSends.length > 0 ? stats.recentSends[0].recipient_count : 0, icon: '✉️', color: '#c89bff' },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#7a7faa', marginBottom: 32 }}>Vitaj späť! Tu je prehľad stavu Tichučka.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 16, marginBottom: 40 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: '#1a1f48', borderRadius: 16, padding: '22px 20px',
            border: `1px solid ${c.color}30`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: c.color, fontFamily: 'var(--font-fraunces)' }}>{c.value}</div>
            <div style={{ fontSize: 13, color: '#7a7faa', marginTop: 4, fontWeight: 600 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 900, marginBottom: 16 }}>Posledné odoslania</h2>
      {stats.recentSends.length === 0 ? (
        <p style={{ color: '#7a7faa' }}>Zatiaľ žiadne odoslania.</p>
      ) : (
        <div style={{ background: '#1a1f48', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                {['Dátum', 'Príjemcov'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#7a7faa', letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentSends.map((s: { id: string; sent_at: string; recipient_count: number }) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#cdc7e0' }}>
                    {new Date(s.sent_at).toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#9be59b' }}>{s.recipient_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { href: '/admin/generate', label: '✨ Generovať rozprávku', bg: '#c89bff', color: '#1f2247' },
          { href: '/admin/topics', label: '🗂️ Pridať témy', bg: 'rgba(255,255,255,.08)', color: '#f6f1e1' },
        ].map(btn => (
          <a key={btn.href} href={btn.href} style={{
            padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
            background: btn.bg, color: btn.color, textDecoration: 'none',
            transition: '.15s',
          }}>{btn.label}</a>
        ))}
      </div>
    </div>
  )
}
