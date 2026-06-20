import { supabaseAdmin } from '@/lib/supabase'
import { AGE_CATEGORIES } from '@/lib/data'

export const dynamic = 'force-dynamic'

type Story = {
  id: string; title: string; age_id: string; emoji: string
  status: string; created_at: string; published_at?: string
}

const MONTHS = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December']
const DOW = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne']

function ageColor(id: string) { return AGE_CATEGORIES.find(a => a.id === id)?.color ?? '#7cc6ff' }

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams
  const now = new Date()
  const [y, mo] = (m && /^\d{4}-\d{2}$/.test(m)) ? m.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1]

  const { data } = await supabaseAdmin().from('stories').select('id, title, age_id, emoji, status, created_at, published_at')
  const stories = (data ?? []) as Story[]

  // zoskup podľa dňa (published → published_at, inak created_at), bez zahodených
  const byDay = new Map<string, Story[]>()
  for (const s of stories) {
    if (s.status === 'discarded') continue
    const day = (s.status === 'published' ? (s.published_at || s.created_at) : s.created_at).slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(s)
  }

  // mriežka mesiaca (pondelok prvý)
  const first = new Date(Date.UTC(y, mo - 1, 1))
  const startDow = (first.getUTCDay() + 6) % 7 // 0 = pondelok
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`)

  const prev = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
  const todayKey = now.toISOString().slice(0, 10)

  const navBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,.08)', color: '#f6f1e1', textDecoration: 'none', fontWeight: 700, fontSize: 14 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>🗓️ Obsahový kalendár</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href={`/admin/calendar?m=${prev}`} style={navBtn}>←</a>
          <span style={{ fontWeight: 800, fontSize: 16, minWidth: 150, textAlign: 'center' }}>{MONTHS[mo - 1]} {y}</span>
          <a href={`/admin/calendar?m=${next}`} style={navBtn}>→</a>
        </div>
      </div>
      <p style={{ color: '#7a7faa', marginBottom: 24, fontSize: 14 }}>
        Plné = publikované, prerušované = čaká na schválenie, sivé = draft. Farba podľa veku.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
        {DOW.map(d => <div key={d} style={{ fontSize: 12, fontWeight: 800, color: '#7a7faa', textAlign: 'center', padding: '4px 0' }}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const items = byDay.get(day) ?? []
          const isToday = day === todayKey
          return (
            <div key={day} style={{
              minHeight: 96, borderRadius: 12, padding: 8,
              background: isToday ? 'rgba(200,155,255,.12)' : '#1a1f48',
              border: `1px solid ${isToday ? 'rgba(200,155,255,.45)' : 'rgba(255,255,255,.07)'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#c89bff' : '#7a7faa', marginBottom: 6 }}>{Number(day.slice(8, 10))}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.slice(0, 4).map(s => {
                  const c = ageColor(s.age_id)
                  const pending = s.status === 'pending_review'
                  const draft = s.status === 'draft'
                  return (
                    <a key={s.id} href={`/admin/stories?edit=${s.id}`} title={`${s.title} (${s.status})`} style={{
                      display: 'block', fontSize: 11, fontWeight: 700, padding: '3px 6px', borderRadius: 6,
                      background: draft ? 'rgba(255,255,255,.06)' : c + '22',
                      color: draft ? '#9aa0c0' : c,
                      border: pending ? `1px dashed ${c}` : '1px solid transparent',
                      textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{s.emoji} {s.title}</a>
                  )
                })}
                {items.length > 4 && <span style={{ fontSize: 10, color: '#7a7faa' }}>+{items.length - 4} ďalšie</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/admin/generate" style={{ ...navBtn, background: '#c89bff', color: '#1f2247' }}>✨ Nárazovo vygenerovať</a>
        <a href="/admin/topics" style={navBtn}>🗂️ Témy</a>
      </div>
    </div>
  )
}
