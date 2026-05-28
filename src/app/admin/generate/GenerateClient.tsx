'use client'
import { useState } from 'react'
import type { AgeCategory, Topic } from '@/lib/types'
import { LENGTH_SPECS } from '@/lib/openai'
import type { StoryLength } from '@/lib/openai'

interface Props {
  ages: AgeCategory[]
  unusedTopics: Topic[]
  preselectedTopic: Topic | null
  preselectedTopicIds?: string[]
}

type Provider = 'openai' | 'claude' | 'groq'
type SingleStatus = 'idle' | 'generating' | 'preview' | 'publishing' | 'done' | 'error'

interface BulkItem {
  topic: Topic
  status: 'pending' | 'generating' | 'done' | 'error'
  storyId?: string
  error?: string
}

const PROVIDERS: [Provider, string][] = [
  ['openai', '🤖 OpenAI'],
  ['claude', '🟠 Claude'],
  ['groq',   '⚡ Groq'],
]

const LENGTH_OPTIONS: [StoryLength, string, string][] = [
  ['short',  '🌙 Krátka', '~250 slov · 2 min'],
  ['medium', '📖 Stredná', '~550 slov · 4 min'],
  ['long',   '📚 Dlhá',   '~900 slov · 6 min'],
]

export default function GenerateClient({ ages, unusedTopics, preselectedTopic, preselectedTopicIds }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>(
    preselectedTopicIds && preselectedTopicIds.length > 1 ? 'bulk' : 'single'
  )

  // ── Single mode ────────────────────────────────────────────────
  const [ageId, setAgeId]               = useState(preselectedTopic?.age_id ?? ages[2].id)
  const [theme, setTheme]               = useState(preselectedTopic?.theme ?? '')
  const [keywords, setKeywords]         = useState(preselectedTopic?.keywords ?? '')
  const [moral, setMoral]               = useState(preselectedTopic?.moral_lesson ?? '')
  const [provider, setProvider]         = useState<Provider>('openai')
  const [length, setLength]             = useState<StoryLength>('medium')
  const [selectedTopicId, setSelectedTopicId] = useState(preselectedTopic?.id ?? '')
  const [singleStatus, setSingleStatus] = useState<SingleStatus>('idle')
  const [result, setResult]             = useState<Record<string, unknown> | null>(null)
  const [singleError, setSingleError]   = useState('')
  const [publishedId, setPublishedId]   = useState('')

  // ── Bulk mode ──────────────────────────────────────────────────
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    new Set(preselectedTopicIds ?? [])
  )
  const [bulkFilterAge, setBulkFilterAge] = useState('all')
  const [bulkProvider, setBulkProvider]   = useState<Provider>('openai')
  const [bulkLength, setBulkLength]       = useState<StoryLength>('medium')
  const [bulkItems, setBulkItems]         = useState<BulkItem[]>([])
  const [bulkRunning, setBulkRunning]     = useState(false)
  const [bulkDone, setBulkDone]           = useState(false)

  // ── Helpers ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
    color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#7a7faa', marginBottom: 7,
  }

  // ── Single: pick topic from dropdown ──────────────────────────
  function pickTopic(id: string) {
    const t = unusedTopics.find(t => t.id === id)
    if (!t) return
    setSelectedTopicId(id)
    setAgeId(t.age_id)
    setTheme(t.theme)
    setKeywords(t.keywords ?? '')
    setMoral(t.moral_lesson ?? '')
  }

  // ── Single: generate ──────────────────────────────────────────
  async function generate() {
    if (!theme) return
    setSingleStatus('generating')
    setSingleError('')
    setResult(null)
    const res = await fetch('/api/admin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ageId, theme, keywords, moralLesson: moral, provider, length, topicId: selectedTopicId || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      setResult(data.story)
      setSingleStatus('preview')
    } else {
      setSingleError(data.error ?? 'Generovanie zlyhalo.')
      setSingleStatus('error')
    }
  }

  // ── Single: publish ───────────────────────────────────────────
  async function publish() {
    if (!result) return
    setSingleStatus('publishing')
    const res = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, status: 'published', generated_by: provider }),
    })
    const data = await res.json()
    if (res.ok) {
      setPublishedId(data.id)
      setSingleStatus('done')
    } else {
      setSingleError(data.error ?? 'Publikovanie zlyhalo.')
      setSingleStatus('error')
    }
  }

  // ── Bulk: toggle selection ────────────────────────────────────
  function toggleBulkId(id: string) {
    setBulkSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    const visible = bulkFilterAge === 'all'
      ? unusedTopics
      : unusedTopics.filter(t => t.age_id === bulkFilterAge)
    setBulkSelectedIds(new Set(visible.map(t => t.id)))
  }

  function deselectAll() {
    setBulkSelectedIds(new Set())
  }

  // ── Bulk: run sequential generation ──────────────────────────
  async function runBulk() {
    const topics = unusedTopics.filter(t => bulkSelectedIds.has(t.id))
    if (!topics.length) return

    const initialItems: BulkItem[] = topics.map(t => ({ topic: t, status: 'pending' }))
    setBulkItems(initialItems)
    setBulkRunning(true)
    setBulkDone(false)

    const items = [...initialItems]
    for (let i = 0; i < items.length; i++) {
      // Set current item to 'generating'
      items[i] = { ...items[i], status: 'generating' }
      setBulkItems([...items])

      try {
        // Generate
        const genRes = await fetch('/api/admin/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ageId: items[i].topic.age_id,
            theme: items[i].topic.theme,
            keywords: items[i].topic.keywords,
            moralLesson: items[i].topic.moral_lesson,
            provider: bulkProvider,
            length: bulkLength,
            topicId: items[i].topic.id,
          }),
        })
        const genData = await genRes.json()
        if (!genRes.ok) throw new Error(genData.error ?? 'Generovanie zlyhalo')

        // Auto-publish as draft
        const pubRes = await fetch('/api/admin/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...genData.story, status: 'draft', generated_by: bulkProvider }),
        })
        const pubData = await pubRes.json()
        if (!pubRes.ok) throw new Error(pubData.error ?? 'Uloženie zlyhalo')

        items[i] = { ...items[i], status: 'done', storyId: pubData.id }
      } catch (err: unknown) {
        items[i] = { ...items[i], status: 'error', error: err instanceof Error ? err.message : 'Chyba' }
      }

      setBulkItems([...items])
    }

    setBulkRunning(false)
    setBulkDone(true)
  }

  // ── Render: single done ───────────────────────────────────────
  if (singleStatus === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 900, color: '#f6f1e1', margin: '16px 0 10px' }}>
          Rozprávka je živá!
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <a href={`/story/${publishedId}`} target="_blank" style={{ padding: '11px 20px', borderRadius: 12, background: '#c89bff', color: '#1f2247', fontWeight: 700, fontSize: 14 }}>
            📖 Zobraziť
          </a>
          <button onClick={() => { setSingleStatus('idle'); setResult(null); setTheme(''); setSelectedTopicId('') }} style={{ padding: '11px 20px', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#f6f1e1', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            ✨ Generovať ďalšiu
          </button>
          <a href="/admin/stories" style={{ padding: '11px 20px', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#f6f1e1', fontWeight: 700, fontSize: 14 }}>
            ← Späť na zoznam
          </a>
        </div>
      </div>
    )
  }

  const visibleBulkTopics = bulkFilterAge === 'all'
    ? unusedTopics
    : unusedTopics.filter(t => t.age_id === bulkFilterAge)

  const bulkDoneCount  = bulkItems.filter(i => i.status === 'done').length
  const bulkErrorCount = bulkItems.filter(i => i.status === 'error').length

  return (
    <div>
      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([['single', '✨ Jednotlivá'], ['bulk', '⚡ Hromadné']] as const).map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
            background: mode === m ? '#c89bff' : 'rgba(255,255,255,.08)',
            color: mode === m ? '#1f2247' : '#cdc7e0',
          }}>{l}</button>
        ))}
      </div>

      {/* ─────── SINGLE MODE ─────── */}
      {mode === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: singleStatus === 'preview' ? '1fr 1fr' : '560px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: '#1a1f48', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,.07)' }}>
            <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 900, marginBottom: 22 }}>Nastavenia</h2>

            {/* Pick from unused topics */}
            {unusedTopics.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Použiť existujúcu tému</label>
                <select value={selectedTopicId} onChange={e => pickTopic(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#1a1f48' }}>— vlastná téma —</option>
                  {unusedTopics.filter(t => t.age_id === ageId).map(t => (
                    <option key={t.id} value={t.id} style={{ background: '#1a1f48' }}>{t.theme}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Vek *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ages.map(a => (
                  <button key={a.id} onClick={() => setAgeId(a.id)} style={{
                    padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: ageId === a.id ? a.color : 'rgba(255,255,255,.08)',
                    color: ageId === a.id ? '#fff' : '#cdc7e0',
                  }}>{a.emoji} {a.range}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Téma *</label>
              <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="napr. Odvaha v tme" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Kľúčové slová</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="strach, svetlo, mama" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Ponaučenie</label>
              <input value={moral} onChange={e => setMoral(e.target.value)} placeholder="Odvaha rastie s každým krokom" style={inputStyle} />
            </div>

            {/* Length */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Dĺžka rozprávky</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {LENGTH_OPTIONS.map(([v, label, hint]) => (
                  <button key={v} onClick={() => setLength(v)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12, fontFamily: 'inherit', textAlign: 'center',
                    background: length === v ? '#ffd47a' : 'rgba(255,255,255,.08)',
                    color: length === v ? '#1f2247' : '#cdc7e0',
                    transition: '.15s',
                  }}>
                    <div>{label}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, opacity: .8, marginTop: 2 }}>{hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>AI motor</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PROVIDERS.map(([v, l]) => (
                  <button key={v} onClick={() => setProvider(v)} style={{
                    flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: provider === v ? '#c89bff' : 'rgba(255,255,255,.08)',
                    color: provider === v ? '#1f2247' : '#cdc7e0',
                    minWidth: 80,
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {singleError && (
              <p style={{ color: '#ffb3b3', fontSize: 13, marginBottom: 14, background: 'rgba(255,100,100,.1)', padding: '10px 14px', borderRadius: 8 }}>
                {singleError}
              </p>
            )}

            <button
              onClick={generate}
              disabled={!theme || singleStatus === 'generating'}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                cursor: !theme || singleStatus === 'generating' ? 'not-allowed' : 'pointer',
                background: '#c89bff', color: '#1f2247', fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                opacity: !theme || singleStatus === 'generating' ? .6 : 1,
              }}
            >
              {singleStatus === 'generating' ? '⏳ Generujem rozprávku…' : '✨ Vygenerovať rozprávku'}
            </button>
          </div>

          {/* Preview */}
          {singleStatus === 'preview' && result && (
            <div style={{ background: '#1a1f48', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,.07)' }}>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 900, marginBottom: 4, color: '#f6f1e1' }}>
                {result.emoji as string} {result.title as string}
              </h2>
              <p style={{ color: '#7a7faa', fontSize: 13, marginBottom: 20 }}>{result.author as string}</p>
              <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(result.pages as Array<Record<string, unknown>>).map((p, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,.04)', borderRadius: 10 }}>
                    {p.type === 'chapter' && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#c89bff', marginBottom: 8 }}>{p.heading as string}</div>
                        {(p.body as string[]).map((b, j) => <p key={j} style={{ fontSize: 13, color: '#cdc7e0', lineHeight: 1.6, margin: '0 0 6px' }}>{b}</p>)}
                      </>
                    )}
                    {p.type === 'end' && (
                      <div>
                        <div style={{ fontSize: 20 }}>{p.art as string}</div>
                        <p style={{ fontSize: 13, color: '#ffd47a', lineHeight: 1.6, margin: '8px 0 0', fontStyle: 'italic' }}>{p.moral as string}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={publish} disabled={singleStatus !== 'preview'} style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: '#9be59b', color: '#1f2247', fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
                }}>✅ Publikovať</button>
                <button onClick={generate} style={{
                  padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,.08)', color: '#f6f1e1', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                }}>🔄 Znova</button>
              </div>
            </div>
          )}

          {singleStatus === 'idle' && (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: 300, color: '#7a7faa', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48 }}>✨</div>
                <p style={{ marginTop: 12 }}>Vyplň formulár a klikni na generovať.<br />AI vytvorí rozprávku za 10–20 sekúnd.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────── BULK MODE ─────── */}
      {mode === 'bulk' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          {/* Left: topic picker */}
          <div style={{ background: '#1a1f48', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900 }}>Vyber témy</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={selectAllVisible} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(200,155,255,.15)', color: '#c89bff' }}>
                  Vybrať všetky
                </button>
                <button onClick={deselectAll} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.06)', color: '#7a7faa' }}>
                  Zrušiť výber
                </button>
              </div>
            </div>

            {/* Age filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {[['all', 'Všetky'], ...ages.map(a => [a.id, `${a.emoji} ${a.range}`])].map(([v, l]) => (
                <button key={v} onClick={() => setBulkFilterAge(v)} style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: bulkFilterAge === v ? '#c89bff' : 'rgba(255,255,255,.08)',
                  color: bulkFilterAge === v ? '#1f2247' : '#cdc7e0',
                }}>{l}</button>
              ))}
            </div>

            {/* Topic list */}
            <div style={{ maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {visibleBulkTopics.length === 0 ? (
                <p style={{ color: '#7a7faa', fontSize: 13, padding: '16px 0' }}>Žiadne nepoužité témy.</p>
              ) : visibleBulkTopics.map(t => {
                const age = ages.find(a => a.id === t.age_id)
                const checked = bulkSelectedIds.has(t.id)
                const bulkItem = bulkItems.find(i => i.topic.id === t.id)
                return (
                  <label key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: checked ? 'rgba(200,155,255,.12)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${checked ? 'rgba(200,155,255,.3)' : 'transparent'}`,
                    transition: '.15s',
                    opacity: bulkRunning ? .8 : 1,
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => !bulkRunning && toggleBulkId(t.id)}
                      disabled={bulkRunning}
                      style={{ accentColor: '#c89bff', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f6f1e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.theme}</div>
                      {t.keywords && <div style={{ fontSize: 11, color: '#7a7faa', marginTop: 1 }}>{t.keywords}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: (age?.color ?? '#7cc6ff') + '22', color: age?.color ?? '#7cc6ff', flexShrink: 0 }}>
                      {age?.range}
                    </span>
                    {/* Per-item status icon */}
                    {bulkItem && (
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {bulkItem.status === 'generating' && '⏳'}
                        {bulkItem.status === 'done'       && '✅'}
                        {bulkItem.status === 'error'      && '❌'}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Right: settings + run */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#1a1f48', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,.07)' }}>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900, marginBottom: 20 }}>Nastavenia</h2>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Dĺžka rozprávok</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {LENGTH_OPTIONS.map(([v, label, hint]) => (
                    <button key={v} onClick={() => setBulkLength(v)} style={{
                      padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 13, fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: bulkLength === v ? '#ffd47a' : 'rgba(255,255,255,.08)',
                      color: bulkLength === v ? '#1f2247' : '#cdc7e0',
                    }}>
                      <span>{label}</span>
                      <span style={{ fontSize: 11, opacity: .7 }}>{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>AI motor</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {PROVIDERS.map(([v, l]) => (
                    <button key={v} onClick={() => setBulkProvider(v)} style={{
                      padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: bulkProvider === v ? '#c89bff' : 'rgba(255,255,255,.08)',
                      color: bulkProvider === v ? '#1f2247' : '#cdc7e0',
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,212,122,.08)', border: '1px solid rgba(255,212,122,.15)', marginBottom: 20, fontSize: 12, color: '#ffd47a' }}>
                Vybrané témy: <strong>{bulkSelectedIds.size}</strong><br />
                Rozprávky sa uložia ako <strong>Draft</strong> — skontroluješ ich v zozname.
              </div>

              <button
                onClick={runBulk}
                disabled={bulkSelectedIds.size === 0 || bulkRunning}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  cursor: bulkSelectedIds.size === 0 || bulkRunning ? 'not-allowed' : 'pointer',
                  background: '#c89bff', color: '#1f2247', fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                  opacity: bulkSelectedIds.size === 0 || bulkRunning ? .5 : 1,
                }}
              >
                {bulkRunning
                  ? `⏳ Generujem ${bulkItems.filter(i => i.status === 'done' || i.status === 'error').length}/${bulkItems.length}…`
                  : `⚡ Generovať ${bulkSelectedIds.size} rozprávok`}
              </button>
            </div>

            {/* Progress / results */}
            {bulkDone && (
              <div style={{ background: '#1a1f48', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 10 }}>
                  {bulkErrorCount === 0 ? '🎉' : '⚠️'}
                </div>
                <p style={{ textAlign: 'center', fontSize: 14, color: '#f6f1e1', marginBottom: 12 }}>
                  <strong>{bulkDoneCount}</strong> uložených · <strong>{bulkErrorCount}</strong> chýb
                </p>
                <a href="/admin/stories" style={{
                  display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, background: '#9be59b',
                  color: '#1f2247', fontWeight: 700, fontSize: 13,
                }}>
                  📖 Zobraziť rozprávky →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
