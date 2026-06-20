'use client'
import { useState } from 'react'
import type { AgeCategory, AgeId } from '@/lib/types'

interface Proposal { age_id: AgeId; theme: string; keywords: string; moral_lesson: string; keep: boolean }

export default function ProposeClient({ ages, autoApprove }: { ages: AgeCategory[]; autoApprove: boolean }) {
  const [selected, setSelected] = useState<Set<AgeId>>(new Set([ages[1].id]))
  const [count, setCount] = useState(5)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

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
      setSavedMsg(`✓ Schválených ${d.count} tém — pridané do fronty. Rozprávky sa z nich vyrobia automaticky podľa kalendára.`)
      setProposals([])
    } catch (e) { setError(e instanceof Error ? e.message : 'Chyba') }
    setSaving(false)
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

      {/* Vysvetlenie automatizácie */}
      <div style={{ ...card, background: 'rgba(124,198,255,.06)', borderColor: 'rgba(124,198,255,.2)' }}>
        <div style={{ fontSize: 13, color: '#cdc7e0', lineHeight: 1.6 }}>
          <strong style={{ color: '#7cc6ff' }}>Ako to ďalej beží automaticky:</strong><br />
          Schválené témy idú do fronty. Každé ráno z nich worker vyrobí rozprávku (hlbokú, sezónnu){autoApprove
            ? <> a keďže máš <strong>auto-schvaľovanie zapnuté</strong>, večer sa rovno odošle odberateľom.</>
            : <> a pošle ti ju na <strong>schválenie</strong>; po kliknutí sa večer odošle. (Ak chceš úplnú automatiku bez klikania, zapni <a href="/admin/settings" style={{ color: '#7cc6ff' }}>auto-schvaľovanie v Nastaveniach</a>.)</>}
          {' '}Keď tém ubúda, dopĺňajú sa samé. Pozri <a href="/admin/calendar" style={{ color: '#7cc6ff' }}>kalendár</a> alebo <a href="/admin/topics" style={{ color: '#7cc6ff' }}>frontu tém</a>.
        </div>
      </div>
    </div>
  )
}
