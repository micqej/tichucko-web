import { supabaseAdmin } from '@/lib/supabase'

async function getStats() {
  const db = supabaseAdmin()
  const [stories, subscribers, topics, sends, allSubs, reactions, pending] = await Promise.all([
    db.from('stories').select('id', { count: 'exact', head: true }),
    db.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true),
    db.from('topics').select('id', { count: 'exact', head: true }).eq('used', false),
    db.from('daily_sends').select('*').order('sent_at', { ascending: false }).limit(5),
    db.from('subscribers').select('subscribed_at'),
    db.from('reactions').select('signal'),
    db.from('stories').select('id, title, theme').eq('status', 'pending_review').order('created_at', { ascending: false }),
  ])

  // cumulative subscriber growth, last 30 days
  const sorted = ((allSubs.data ?? []) as { subscribed_at: string }[]).filter(s => s.subscribed_at).map(s => s.subscribed_at.slice(0, 10)).sort()
  const growth: number[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const cutoff = d.toISOString().slice(0, 10)
    growth.push(sorted.filter(x => x <= cutoff).length)
  }

  const r = (reactions.data ?? []) as Array<{ signal: string }>
  return {
    stories: stories.count ?? 0,
    subscribers: subscribers.count ?? 0,
    unusedTopics: topics.count ?? 0,
    recentSends: sends.data ?? [],
    growth,
    reactions: {
      likes: r.filter(x => x.signal === 'like').length,
      dislikes: r.filter(x => x.signal === 'dislike').length,
      finished: r.filter(x => x.signal === 'finished').length,
    },
    pending: (pending.data ?? []) as Array<{ id: string; title: string; theme: string }>,
  }
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const w = 100, h = 32
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 56 }}>
      <polyline points={pts} fill="none" stroke="#9be59b" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
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

      {stats.pending.length > 0 && (
        <div style={{ background: 'rgba(255,212,122,.1)', border: '1px solid rgba(255,212,122,.3)', borderRadius: 16, padding: '20px 24px', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900, marginBottom: 10, color: '#ffd47a' }}>
            ⏳ Čaká na schválenie ({stats.pending.length})
          </h2>
          {stats.pending.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontSize: 14, color: '#f6f1e1' }}><strong>{p.title}</strong> <span style={{ color: '#7a7faa' }}>· {p.theme}</span></span>
              <a href={`/admin/stories?edit=${p.id}`} style={{ fontSize: 13, fontWeight: 700, color: '#ffd47a', textDecoration: 'none', flexShrink: 0, marginLeft: 12 }}>Skontrolovať →</a>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 16, marginBottom: 40 }}>
        <div style={{ background: '#1a1f48', borderRadius: 16, padding: '20px 22px', border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7a7faa', marginBottom: 8 }}>📈 Rast odberateľov (30 dní)</div>
          <Sparkline data={stats.growth} />
          <div style={{ fontSize: 13, color: '#9be59b', fontWeight: 700, marginTop: 4 }}>
            +{Math.max(0, stats.growth[stats.growth.length - 1] - stats.growth[0])} za posledných 30 dní
          </div>
        </div>
        <div style={{ background: '#1a1f48', borderRadius: 16, padding: '20px 22px', border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7a7faa', marginBottom: 14 }}>💛 Spätná väzba od rodičov</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { icon: '👍', label: 'Páčilo', value: stats.reactions.likes, color: '#9be59b' },
              { icon: '👎', label: 'Nie', value: stats.reactions.dislikes, color: '#ff9bbf' },
              { icon: '📖', label: 'Dočítané', value: stats.reactions.finished, color: '#7cc6ff' },
            ].map(x => (
              <div key={x.label}>
                <div style={{ fontSize: 22 }}>{x.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: x.color, fontFamily: 'var(--font-fraunces)' }}>{x.value}</div>
                <div style={{ fontSize: 12, color: '#7a7faa' }}>{x.label}</div>
              </div>
            ))}
          </div>
        </div>
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
