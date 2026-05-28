'use client'
import { useState } from 'react'
import type { AgeCategory, Topic } from '@/lib/types'

interface Props {
  ages: AgeCategory[]
  unusedTopics: Topic[]
  preselectedTopic: Topic | null
}

export default function GenerateClient({ ages, unusedTopics, preselectedTopic }: Props) {
  const [ageId, setAgeId] = useState(preselectedTopic?.age_id ?? ages[2].id)
  const [theme, setTheme] = useState(preselectedTopic?.theme ?? '')
  const [keywords, setKeywords] = useState(preselectedTopic?.keywords ?? '')
  const [moral, setMoral] = useState(preselectedTopic?.moral_lesson ?? '')
  const [provider, setProvider] = useState<'openai' | 'claude' | 'grok'>('openai')
  const [selectedTopicId, setSelectedTopicId] = useState(preselectedTopic?.id ?? '')
  const [status, setStatus] = useState<'idle' | 'generating' | 'preview' | 'publishing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [publishedId, setPublishedId] = useState('')

  function pickTopic(id: string) {
    const t = unusedTopics.find(t => t.id === id)
    if (!t) return
    setSelectedTopicId(id)
    setAgeId(t.age_id)
    setTheme(t.theme)
    setKeywords(t.keywords ?? '')
    setMoral(t.moral_lesson ?? '')
  }

  async function generate() {
    if (!theme) return
    setStatus('generating')
    setError('')
    setResult(null)
    const res = await fetch('/api/admin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ageId, theme, keywords, moralLesson: moral, provider, topicId: selectedTopicId || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      setResult(data.story)
      setStatus('preview')
    } else {
      setError(data.error ?? 'Generovanie zlyhalo.')
      setStatus('error')
    }
  }

  async function publish() {
    if (!result) return
    setStatus('publishing')
    const res = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, status: 'published', generated_by: provider }),
    })
    const data = await res.json()
    if (res.ok) {
      setPublishedId(data.id)
      setStatus('done')
    } else {
      setError(data.error ?? 'Publikovanie zlyhalo.')
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
    color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#7a7faa', marginBottom: 7 }

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 900, color: '#f6f1e1', margin: '16px 0 10px' }}>Rozprávka je živá!</h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <a href={`/story/${publishedId}`} target="_blank" style={{ padding: '11px 20px', borderRadius: 12, background: '#c89bff', color: '#1f2247', fontWeight: 700, fontSize: 14 }}>📖 Zobraziť</a>
          <button onClick={() => { setStatus('idle'); setResult(null); setTheme(''); setSelectedTopicId('') }} style={{ padding: '11px 20px', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#f6f1e1', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>✨ Generovať ďalšiu</button>
          <a href="/admin/stories" style={{ padding: '11px 20px', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#f6f1e1', fontWeight: 700, fontSize: 14 }}>← Späť na zoznam</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: status === 'preview' ? '1fr 1fr' : '560px 1fr', gap: 24, alignItems: 'start' }}>
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

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>AI motor</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              ['openai', '🤖 OpenAI'],
              ['claude', '🟠 Claude'],
              ['grok', '⚡ Grok'],
            ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setProvider(v)} style={{
                flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: provider === v ? '#ffd47a' : 'rgba(255,255,255,.08)',
                color: provider === v ? '#1f2247' : '#cdc7e0',
                minWidth: 80,
              }}>{l}</button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#ffb3b3', fontSize: 13, marginBottom: 14, background: 'rgba(255,100,100,.1)', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}

        <button
          onClick={generate}
          disabled={!theme || status === 'generating'}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: !theme || status === 'generating' ? 'not-allowed' : 'pointer',
            background: '#c89bff', color: '#1f2247', fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
            opacity: !theme || status === 'generating' ? .6 : 1,
          }}
        >{status === 'generating' ? '⏳ Generujem rozprávku…' : '✨ Vygenerovať rozprávku'}</button>
      </div>

      {/* Preview */}
      {status === 'preview' && result && (
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
            <button onClick={publish} disabled={status !== 'preview'} style={{
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

      {status === 'idle' && (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300, color: '#7a7faa', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 48 }}>✨</div>
            <p style={{ marginTop: 12 }}>Vyplň formulár a klikni na generovať.<br />AI vytvorí rozprávku za 10–20 sekúnd.</p>
          </div>
        </div>
      )}
    </div>
  )
}
