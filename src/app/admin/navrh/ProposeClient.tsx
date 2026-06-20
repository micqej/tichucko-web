'use client'
import { useState } from 'react'
import type { AgeCategory, AgeId, Topic } from '@/lib/types'

interface Proposal { age_id: AgeId; theme: string; keywords: string; moral_lesson: string; keep: boolean }

export default function ProposeClient({ ages, autoApprove, queue: initialQueue }: { ages: AgeCategory[]; autoApprove: boolean; queue: Topic[] }) {
  const [queue, setQueue] = useState<Topic[]>(initialQueue)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [queueFilter, setQueueFilter] = useState<string>('all')

  async function delTopic(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/admin/topics?id=${id}`, { method: 'DELETE' })
    if (res.ok) setQueue(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  async function clearQueue() {
    if (!confirm(`Naozaj zmazať všetkých ${queue.length} tém vo fronte?`)) return
    setClearing(true)
    const ids = queue.map(t => t.id)
    for (const id of ids) { await fetch(`/api/admin/topics?id=${id}`, { method: 'DELETE' }) }
    setQueue([])
    setClearing(false)
  }

  const [selected, setSelected] = useState<Set<AgeId>>(new Set([ages[1].id]))
  const [count, setCount] = useState(5)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  // 3. krok — generovanie z čerstvo schválených tém
  const [savedTopics, setSavedTopics] = useState<Array<{ id: string; age_id: AgeId; theme: string; keywords: string; moral_lesson: string }>>([])
  const [gen, setGen] = useState<{ done: number; total: number; running: boolean; finished: boolean }>({ done: 0, total: 0, running: false, finished: false })

  const ageOf = (id: string) => ages.find(a => a.id === id)
  function toggleAge(id: AgeId) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function propose() {
    if (selected.size === 0) return
    setLoading(true); setError(''); setSavedMsg(''); setProposals([])
    try {
      const res = await fetch('/api/admin/propose-topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ages: [...selected], count }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Návrh zlyhal')
      setProposals((d.proposals as Omit<Proposal, 'keep'>[]).map(p => ({ ...p, keep: true })))
    } catch (e) { setError(e instanceof Error ? e.message : 'Chyba') }
    setLoading(false)
  }

  function update(i: number, patch: Partial<Proposal>) {
    setProposals(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  async function approve() {
    const kept = proposals.filter(p => p.keep)
    if (kept.length === 0) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: kept.map(({ keep, ...r }) => r) }), // eslint-disable-line @typescript-eslint/no-unused-vars
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Uloženie zlyhalo')
      setSavedMsg(`✓ Schválených ${d.count} tém — pridané do fronty.`)
      setSavedTopics(d.topics ?? [])
      setQueue(prev => [...((d.topics ?? []) as Topic[]), ...prev])
      setGen({ done: 0, total: 0, running: false, finished: false })
      setProposals([])
    } catch (e) { setError(e instanceof Error ? e.message : 'Chyba') }
    setSaving(false)
  }

  // 3. krok: vyrobí rozprávky zo schválených tém (ako koncepty na finálne schválenie)
  async function generateNow() {
    if (savedTopics.length === 0) return
    setError('')
    setGen({ done: 0, total: savedTopics.length, running: true, finished: false })
    let done = 0
    for (const t of savedTopics) {
      try {
        const g = await fetch('/api/admin/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ageId: t.age_id, theme: t.theme, keywords: t.keywords, moralLesson: t.moral_lesson, length: 'medium', topicId: t.id }),
        })
        const gd = await g.json()
        if (g.ok) {
          await fetch('/api/admin/stories', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...gd.story, status: 'pending_review' }),
          })
        }
      } catch { /* pokračuj ďalej */ }
      setQueue(prev => prev.filter(q => q.id !== t.id)) // téma sa minula
      done++
      setGen({ done, total: savedTopics.length, running: true, finished: false })
    }
    setGen({ done, total: savedTopics.length, running: false, finished: true })
  }

  const card: React.CSSProperties = { background: '#1a1f48', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,.07)' }
  const input: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const keptCount = proposals.filter(p => p.keep).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Ovládanie */}
      <div style={card}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7a7faa', marginBottom: 8 }}>Pre ktoré roky</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {ages.map(a => (
            <button key={a.id} onClick={() => toggleAge(a.id)} style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: selected.has(a.id) ? a.color : 'rgba(255,255,255,.08)',
              color: selected.has(a.id) ? '#fff' : '#cdc7e0',
            }}>{a.emoji} {a.range}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7a7faa', marginBottom: 8 }}>Počet tém na každý vek</label>
            <input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} style={{ ...input, width: 90 }} />
          </div>
          <button onClick={propose} disabled={loading || selected.size === 0} style={{
            padding: '11px 22px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: '#c89bff', color: '#1f2247', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
            opacity: selected.size === 0 ? 0.5 : 1,
          }}>{loading ? '⏳ Navrhujem…' : '✨ Navrhni témy'}</button>
        </div>
        {error && <p style={{ color: '#ffb3b3', fontSize: 13, marginTop: 14 }}>{error}</p>}
        {savedMsg && <p style={{ color: '#9be59b', fontSize: 13, marginTop: 14 }}>{savedMsg}</p>}
      </div>

      {/* Návrhy na schválenie */}
      {proposals.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900 }}>Návrhy ({keptCount}/{proposals.length} vybraných)</h2>
            <button onClick={approve} disabled={saving || keptCount === 0} style={{
              padding: '11px 22px', borderRadius: 10, border: 'none', cursor: saving ? 'wait' : 'pointer',
              background: '#9be59b', color: '#1f2247', fontWeight: 800, fontSize: 14, fontFamily: 'inherit', opacity: keptCount === 0 ? 0.5 : 1,
            }}>{saving ? 'Ukladám…' : `✅ Schváliť vybrané (${keptCount})`}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proposals.map((p, i) => {
              const a = ageOf(p.age_id)
              return (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 10,
                  background: p.keep ? 'rgba(155,229,155,.08)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${p.keep ? 'rgba(155,229,155,.25)' : 'rgba(255,255,255,.06)'}`,
                }}>
                  <input type="checkbox" checked={p.keep} onChange={e => update(i, { keep: e.target.checked })} style={{ accentColor: '#9be59b', width: 18, height: 18, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (a?.color ?? '#7cc6ff') + '22', color: a?.color ?? '#7cc6ff', flexShrink: 0 }}>{a?.emoji} {a?.range}</span>
                      <input value={p.theme} onChange={e => update(i, { theme: e.target.value })} style={{ ...input, fontWeight: 700 }} />
                    </div>
                    <input value={p.keywords} onChange={e => update(i, { keywords: e.target.value })} placeholder="hodnoty / kľúčové slová" style={{ ...input, fontSize: 12, color: '#cdc7e0' }} />
                    <input value={p.moral_lesson} onChange={e => update(i, { moral_lesson: e.target.value })} placeholder="ponaučenie" style={{ ...input, fontSize: 12, color: '#ffd47a' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. krok — generovať teraz zo schválených tém */}
      {savedTopics.length > 0 && (
        <div style={{ ...card, borderColor: 'rgba(155,229,155,.25)' }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900, marginBottom: 6 }}>3. Vygenerovať rozprávky</h2>
          <p style={{ color: '#7a7faa', fontSize: 13, marginBottom: 16 }}>
            {gen.finished
              ? <>Hotovo — <strong style={{ color: '#9be59b' }}>{gen.done}</strong> rozprávok je pripravených na finálne schválenie.</>
              : gen.running
                ? <>Generujem… <strong>{gen.done}/{gen.total}</strong> (každá ~10–20 s, vydrž)</>
                : <>Máš <strong>{savedTopics.length}</strong> schválených tém vo fronte. Vygeneruj z nich rozprávky hneď teraz, alebo to nechaj na ranný worker.</>}
          </p>
          {gen.finished ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/admin/calendar" style={{ padding: '11px 20px', borderRadius: 10, background: '#c89bff', color: '#1f2247', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>🗓️ Pozri v kalendári</a>
              <a href="/admin" style={{ padding: '11px 20px', borderRadius: 10, background: 'rgba(255,255,255,.08)', color: '#f6f1e1', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>✅ Schváliť na Dashboarde</a>
            </div>
          ) : (
            <button onClick={generateNow} disabled={gen.running} style={{
              padding: '12px 22px', borderRadius: 10, border: 'none', cursor: gen.running ? 'wait' : 'pointer',
              background: '#9be59b', color: '#1f2247', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
            }}>{gen.running ? `⏳ ${gen.done}/${gen.total}…` : `🪄 Vygenerovať ${savedTopics.length} rozprávok teraz`}</button>
          )}
        </div>
      )}

      {/* Vysvetlenie automatizácie */}
      <div style={{ ...card, background: 'rgba(124,198,255,.06)', borderColor: 'rgba(124,198,255,.2)' }}>
        <div style={{ fontSize: 13, color: '#cdc7e0', lineHeight: 1.6 }}>
          <strong style={{ color: '#7cc6ff' }}>Ako to ďalej beží automaticky:</strong><br />
          Schválené témy idú do fronty. Každé ráno z nich worker vyrobí rozprávku (hlbokú, sezónnu){autoApprove
            ? <> a keďže máš <strong>auto-schvaľovanie zapnuté</strong>, večer sa rovno odošle odberateľom.</>
            : <> a pošle ti ju na <strong>schválenie</strong>; po kliknutí sa večer odošle. (Ak chceš úplnú automatiku bez klikania, zapni <a href="/admin/settings" style={{ color: '#7cc6ff' }}>auto-schvaľovanie v Nastaveniach</a>.)</>}
          {' '}Keď tém ubúda, dopĺňajú sa samé. Schválené témy a kalendár vidíš nižšie.
        </div>
      </div>

      {/* Fronta tém — správa a mazanie */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900 }}>📋 Fronta tém ({queue.length})</h2>
          {queue.length > 0 && (
            <button onClick={clearQueue} disabled={clearing} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: clearing ? 'wait' : 'pointer', background: 'rgba(255,120,120,.15)', color: '#ff9b9b', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
              {clearing ? 'Mažem…' : '🗑️ Vyčistiť frontu'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['all', 'Všetky'] as [string, string], ...ages.map(a => [a.id, `${a.emoji} ${a.range}`] as [string, string])].map(([v, l]) => (
            <button key={v} onClick={() => setQueueFilter(v)} style={{
              padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: queueFilter === v ? '#c89bff' : 'rgba(255,255,255,.08)', color: queueFilter === v ? '#1f2247' : '#cdc7e0',
            }}>{l}</button>
          ))}
        </div>
        {queue.length === 0 ? (
          <p style={{ color: '#7a7faa', fontSize: 13 }}>Fronta je prázdna — navrhni nové témy vyššie.</p>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(queueFilter === 'all' ? queue : queue.filter(t => t.age_id === queueFilter)).map(t => {
              const a = ageOf(t.age_id)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (a?.color ?? '#7cc6ff') + '22', color: a?.color ?? '#7cc6ff', flexShrink: 0 }}>{a?.emoji} {a?.range}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f6f1e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.theme}</div>
                    {t.keywords && <div style={{ fontSize: 11, color: '#7a7faa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.keywords}</div>}
                  </div>
                  <button onClick={() => delTopic(t.id)} disabled={deleting === t.id} style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,120,120,.12)', color: '#ff9b9b', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>{deleting === t.id ? '…' : '🗑️'}</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
