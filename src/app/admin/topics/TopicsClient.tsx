'use client'
import { useState, useRef } from 'react'
import type { Topic, AgeCategory } from '@/lib/types'

interface Props {
  topics: Topic[]
  ages: AgeCategory[]
}

interface EditState {
  theme: string
  keywords: string
  moral_lesson: string
}

export default function TopicsClient({ topics: initial, ages }: Props) {
  const [topics, setTopics]           = useState(initial)
  const [filter, setFilter]           = useState<string>('all')
  const [importStatus, setImportStatus] = useState<string>('')
  const [aiStatus, setAiStatus]       = useState<string>('')
  const [aiAge, setAiAge]             = useState<string>(ages[2].id)
  const [aiCount, setAiCount]         = useState(10)
  const [newTopic, setNewTopic]       = useState<{ age_id: string; theme: string; keywords: string; moral_lesson: string }>({ age_id: ages[0].id, theme: '', keywords: '', moral_lesson: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  // Multi-select
  const [selected, setSelected]       = useState<Set<string>>(new Set())

  // Inline edit
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editState, setEditState]     = useState<EditState>({ theme: '', keywords: '', moral_lesson: '' })
  const [savingId, setSavingId]       = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const filtered = (() => {
    if (filter === 'all')    return topics
    if (filter === 'unused') return topics.filter(t => !t.used)
    return topics.filter(t => t.age_id === filter)
  })()

  const unusedFiltered = filtered.filter(t => !t.used)

  // ── Multi-select helpers ──────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelected(new Set(unusedFiltered.map(t => t.id)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  // ── Inline edit ───────────────────────────────────────────────
  function startEdit(t: Topic) {
    setEditingId(t.id)
    setEditState({ theme: t.theme, keywords: t.keywords ?? '', moral_lesson: t.moral_lesson ?? '' })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    setSavingId(id)
    const res = await fetch('/api/admin/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editState }),
    })
    const data = await res.json()
    if (res.ok) {
      setTopics(ts => ts.map(t => t.id === id ? { ...t, ...editState } : t))
    } else {
      alert(data.error ?? 'Uloženie zlyhalo')
    }
    setSavingId(null)
    setEditingId(null)
  }

  async function deleteTopic(id: string) {
    if (!confirm('Vymazať tému?')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/topics?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTopics(ts => ts.filter(t => t.id !== id))
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
    }
    setDeletingId(null)
  }

  // ── Import / AI generate / manual add ────────────────────────
  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setImportStatus('Importujem…')
    const res = await fetch('/api/admin/import-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: text }),
    })
    const data = await res.json()
    if (res.ok) {
      setImportStatus(`✅ Importovaných ${data.count} tém`)
      setTopics(t => [...data.topics, ...t])
    } else {
      setImportStatus(`❌ ${data.error}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function generateAiTopics() {
    setAiStatus('Generujem témy…')
    const res = await fetch('/api/admin/generate-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age_id: aiAge, count: aiCount }),
    })
    const data = await res.json()
    if (res.ok) {
      setAiStatus(`✅ Vygenerovaných ${data.count} tém`)
      setTopics(t => [...data.topics, ...t])
    } else {
      setAiStatus(`❌ ${data.error}`)
    }
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault()
    if (!newTopic.theme) return
    const res = await fetch('/api/admin/import-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual: [newTopic] }),
    })
    const data = await res.json()
    if (res.ok) {
      setTopics(t => [...data.topics, ...t])
      setNewTopic(n => ({ ...n, theme: '', keywords: '', moral_lesson: '' }))
    }
  }

  // ── Bulk generate link ────────────────────────────────────────
  const bulkGenerateHref = `/admin/generate?topicIds=${[...selected].join(',')}`

  // ── Styles ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
    color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
  const inlineInputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 7,
    background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#7a7faa', marginBottom: 6 }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
      {/* Left: topic list */}
      <div>
        {/* Filter + selection bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'Všetky'], ['unused', 'Nepoužité'], ...ages.map(a => [a.id, `${a.emoji} ${a.range}`])].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: filter === v ? '#c89bff' : 'rgba(255,255,255,.08)',
                color: filter === v ? '#1f2247' : '#cdc7e0',
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selected.size > 0 && (
              <>
                <span style={{ fontSize: 13, color: '#c89bff', fontWeight: 700 }}>
                  Vybrané: {selected.size}
                </span>
                <a href={bulkGenerateHref} style={{
                  padding: '7px 14px', borderRadius: 10, background: '#c89bff', color: '#1f2247',
                  fontWeight: 800, fontSize: 13, textDecoration: 'none',
                }}>
                  ⚡ Generovať vybrané →
                </a>
                <button onClick={deselectAll} style={{
                  padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,.06)', color: '#7a7faa', fontSize: 12, fontWeight: 600,
                }}>
                  Zrušiť
                </button>
              </>
            )}
            {selected.size === 0 && unusedFiltered.length > 0 && (
              <button onClick={selectAllVisible} style={{
                padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(200,155,255,.12)', color: '#c89bff', fontSize: 12, fontWeight: 700,
              }}>
                ☐ Vybrať všetky ({unusedFiltered.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#1a1f48', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                {['', 'Vek', 'Téma', 'Ponaučenie', 'Akcie'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#7a7faa', letterSpacing: '.07em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const age     = ages.find(a => a.id === t.age_id)
                const isEditing = editingId === t.id
                const isDeleting = deletingId === t.id

                return (
                  <tr key={t.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,.04)',
                    opacity: t.used || isDeleting ? .45 : 1,
                    background: selected.has(t.id) ? 'rgba(200,155,255,.07)' : 'transparent',
                    transition: '.2s',
                  }}>
                    {/* Checkbox */}
                    <td style={{ padding: '10px 10px 10px 14px', width: 32 }}>
                      {!t.used && (
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          style={{ accentColor: '#c89bff', width: 15, height: 15, cursor: 'pointer' }}
                        />
                      )}
                    </td>

                    {/* Age badge */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (age?.color ?? '#7cc6ff') + '22', color: age?.color ?? '#7cc6ff' }}>
                        {age?.range}
                      </span>
                    </td>

                    {/* Theme + keywords — editable inline */}
                    <td style={{ padding: '10px 14px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input
                            value={editState.theme}
                            onChange={e => setEditState(s => ({ ...s, theme: e.target.value }))}
                            placeholder="Téma"
                            style={inlineInputStyle}
                          />
                          <input
                            value={editState.keywords}
                            onChange={e => setEditState(s => ({ ...s, keywords: e.target.value }))}
                            placeholder="Kľúčové slová"
                            style={{ ...inlineInputStyle, fontSize: 11 }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f6f1e1' }}>{t.theme}</div>
                          {t.keywords && <div style={{ fontSize: 11, color: '#7a7faa', marginTop: 2 }}>{t.keywords}</div>}
                        </>
                      )}
                    </td>

                    {/* Moral — editable inline */}
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#cdc7e0', maxWidth: 200 }}>
                      {isEditing ? (
                        <input
                          value={editState.moral_lesson}
                          onChange={e => setEditState(s => ({ ...s, moral_lesson: e.target.value }))}
                          placeholder="Ponaučenie"
                          style={inlineInputStyle}
                        />
                      ) : (
                        t.moral_lesson
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => saveEdit(t.id)}
                            disabled={savingId === t.id}
                            style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: '#9be59b', color: '#1f2247' }}
                          >
                            {savingId === t.id ? '…' : '✓ Uložiť'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#cdc7e0' }}
                          >
                            Zrušiť
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {t.used ? (
                            <span style={{ fontSize: 11, color: '#7a7faa' }}>použitá</span>
                          ) : (
                            <a href={`/admin/generate?topicId=${t.id}`} style={{ fontSize: 12, color: '#c89bff', fontWeight: 600 }}>Generovať →</a>
                          )}
                          <button
                            onClick={() => startEdit(t)}
                            style={{ fontSize: 12, color: '#7cc6ff', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Upraviť
                          </button>
                          <button
                            onClick={() => deleteTopic(t.id)}
                            disabled={isDeleting}
                            style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {isDeleting ? '…' : 'Zmazať'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#7a7faa' }}>Žiadne témy.</div>}
        </div>
      </div>

      {/* Right: tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Import CSV */}
        <div style={{ background: '#1a1f48', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,.07)' }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>📂 Import CSV</h3>
          <p style={{ fontSize: 12, color: '#7a7faa', lineHeight: 1.5, marginBottom: 14 }}>
            Stĺpce: <code style={{ color: '#cdc7e0' }}>age_id, theme, keywords, moral_lesson</code>
          </p>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={importCsv} style={{ display: 'none' }} id="csvInput" />
          <label htmlFor="csvInput" style={{
            display: 'block', padding: '10px', borderRadius: 9, textAlign: 'center',
            background: 'rgba(255,255,255,.08)', border: '1px dashed rgba(255,255,255,.2)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#cdc7e0',
          }}>📎 Nahrať CSV súbor</label>
          {importStatus && <p style={{ fontSize: 12, color: '#cdc7e0', marginTop: 10 }}>{importStatus}</p>}
        </div>

        {/* AI generate topics */}
        <div style={{ background: '#1a1f48', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,.07)' }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 900, marginBottom: 14 }}>✨ AI generovanie tém</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Vek</label>
            <select value={aiAge} onChange={e => setAiAge(e.target.value)} style={inputStyle}>
              {ages.map(a => <option key={a.id} value={a.id} style={{ background: '#1a1f48' }}>{a.emoji} {a.range}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Počet tém</label>
            <input type="number" min={1} max={30} value={aiCount} onChange={e => setAiCount(Number(e.target.value))} style={inputStyle} />
          </div>
          <button onClick={generateAiTopics} style={{
            width: '100%', padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: '#c89bff', color: '#1f2247', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
          }}>Generovať témy</button>
          {aiStatus && <p style={{ fontSize: 12, color: '#cdc7e0', marginTop: 10 }}>{aiStatus}</p>}
        </div>

        {/* Manual add */}
        <div style={{ background: '#1a1f48', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,.07)' }}>
          <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 900, marginBottom: 14 }}>✏️ Pridať ručne</h3>
          <form onSubmit={addManual} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Vek</label>
              <select value={newTopic.age_id} onChange={e => setNewTopic(n => ({ ...n, age_id: e.target.value }))} style={inputStyle}>
                {ages.map(a => <option key={a.id} value={a.id} style={{ background: '#1a1f48' }}>{a.emoji} {a.range}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Téma *</label>
              <input value={newTopic.theme} onChange={e => setNewTopic(n => ({ ...n, theme: e.target.value }))} placeholder="napr. Pomoc kamarátovi" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Kľúčové slová</label>
              <input value={newTopic.keywords} onChange={e => setNewTopic(n => ({ ...n, keywords: e.target.value }))} placeholder="priateľstvo, pomoc, radosť" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ponaučenie</label>
              <input value={newTopic.moral_lesson} onChange={e => setNewTopic(n => ({ ...n, moral_lesson: e.target.value }))} placeholder="Pomoc iným nás robí šťastnými" style={inputStyle} />
            </div>
            <button type="submit" style={{
              width: '100%', padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: '#9be59b', color: '#1f2247', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
            }}>Pridať tému</button>
          </form>
        </div>
      </div>
    </div>
  )
}
