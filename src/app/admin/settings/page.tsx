'use client'
import { useEffect, useState } from 'react'

const SECTIONS = [
  {
    title: '🤖 AI Generátor',
    fields: [
      { key: 'ai_provider', label: 'Aktívny AI provider', type: 'select', options: ['openai', 'claude', 'groq', 'grok'] },
      { key: 'openai_api_key', label: 'OpenAI API kľúč', type: 'password', placeholder: 'sk-proj-...' },
      { key: 'claude_api_key', label: 'Claude (Anthropic) API kľúč', type: 'password', placeholder: 'sk-ant-...' },
      { key: 'groq_api_key', label: 'Groq API kľúč (groq.com)', type: 'password', placeholder: 'gsk_...' },
      { key: 'grok_api_key', label: 'Grok API kľúč (x.ai)', type: 'password', placeholder: 'xai-...' },
    ],
  },
  {
    title: '🧠 Modely (editovateľné)',
    fields: [
      { key: 'openai_model', label: 'OpenAI model', type: 'text', placeholder: 'gpt-4o-mini' },
      { key: 'claude_model', label: 'Claude model', type: 'text', placeholder: 'claude-sonnet-4-6' },
      { key: 'groq_model', label: 'Groq model', type: 'text', placeholder: 'llama-3.3-70b-versatile' },
      { key: 'grok_model', label: 'Grok model', type: 'text', placeholder: 'grok-3-mini' },
    ],
  },
  {
    title: '⚙️ Automatizácia a časy',
    fields: [
      { key: 'auto_approve', label: 'Auto-schvaľovanie (bez teba) — on/off', type: 'select', options: ['off', 'on'] },
      { key: 'double_optin', label: 'Double opt-in (potvrdenie emailom) — on/off', type: 'select', options: ['off', 'on'] },
      { key: 'generate_time', label: 'Čas generovania (SK, HH:MM)', type: 'text', placeholder: '08:00' },
      { key: 'send_time', label: 'Čas odoslania newslettera (SK, HH:MM)', type: 'text', placeholder: '17:00' },
    ],
  },
  {
    title: '🧭 Učenie a smerovanie (tvoje slovo má prednosť)',
    fields: [
      { key: 'learning_directives', label: 'Pokyny pre AI — majú PREDNOSŤ pred hlasmi ľudí (štýl, témy, čomu sa vyhnúť)', type: 'textarea', placeholder: 'Napr.: Píš vždy láskavo, vyhýbaj sa strašidelným motívom, preferuj zvieracie postavy a krátke vety…' },
    ],
  },
  {
    title: '📧 Email / Newsletter',
    fields: [
      { key: 'email_provider', label: 'Email provider', type: 'select', options: ['smtp', 'resend'] },
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'text', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP Používateľ', type: 'text', placeholder: 'mail@tichucko.sk' },
      { key: 'smtp_password', label: 'SMTP Heslo', type: 'password', placeholder: '••••••••' },
      { key: 'smtp_from', label: 'Odosielateľ (From)', type: 'text', placeholder: 'Tichučko <rozpravky@tichucko.sk>' },
      { key: 'resend_api_key', label: 'Resend API kľúč', type: 'password', placeholder: 're_...' },
    ],
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { setValues(d.settings ?? {}); setLoading(false) })
  }, [])

  async function save(key: string) {
    setSaving(key)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: values[key] ?? '' }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '10px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
    color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }

  if (loading) return <div style={{ color: '#7a7faa', padding: 40 }}>Načítavam nastavenia…</div>

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>⚙️ Nastavenia</h1>
      <p style={{ color: '#7a7faa', marginBottom: 36 }}>API kľúče a konfigurácia — uložené bezpečne v databáze.</p>

      {SECTIONS.map(section => (
        <div key={section.title} style={{
          background: '#1a1f48', borderRadius: 16, padding: 28,
          border: '1px solid rgba(255,255,255,.07)', marginBottom: 24,
        }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900, marginBottom: 22, color: '#f6f1e1' }}>
            {section.title}
          </h2>

          {section.fields.map(field => (
            <div key={field.key} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#7a7faa', marginBottom: 8 }}>
                {field.label}
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {field.type === 'select' ? (
                  <select
                    value={values[field.key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    style={{ ...inputStyle, appearance: 'none' }}
                  >
                    {(field.options ?? []).map(opt => (
                      <option key={opt} value={opt} style={{ background: '#1a1f48' }}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={values[field.key] ?? ''}
                    placeholder={field.placeholder}
                    rows={5}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                ) : (
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={values[field.key] ?? ''}
                    placeholder={field.placeholder}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    style={inputStyle}
                  />
                )}
                <button
                  onClick={() => save(field.key)}
                  disabled={saving === field.key}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, fontFamily: 'inherit', flexShrink: 0,
                    background: saved === field.key ? '#9be59b' : saving === field.key ? 'rgba(255,255,255,.1)' : '#c89bff',
                    color: saved === field.key ? '#1f2247' : saving === field.key ? '#cdc7e0' : '#1f2247',
                    transition: '.2s',
                  }}
                >
                  {saved === field.key ? '✓ Uložené' : saving === field.key ? '…' : 'Uložiť'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      <PasswordSection />

      <div style={{ background: 'rgba(255,212,122,.08)', border: '1px solid rgba(255,212,122,.2)', borderRadius: 12, padding: '14px 18px', color: '#ffd47a', fontSize: 13 }}>
        💡 API kľúče sú šifrované v databáze a maskované pri zobrazení. Po uložení sa nové hodnoty hneď použijú — bez reštartu.
      </div>
    </div>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, marginBottom: 12,
    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
    color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }

  async function change() {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, next }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) { setMsg({ ok: true, text: 'Heslo zmenené. ✓' }); setCurrent(''); setNext('') }
    else setMsg({ ok: false, text: d.error || 'Zmena zlyhala.' })
  }

  return (
    <div style={{ background: '#1a1f48', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,.07)', marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 900, marginBottom: 22, color: '#f6f1e1' }}>🔐 Zmena hesla</h2>
      <input type="password" placeholder="Súčasné heslo" value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} />
      <input type="password" placeholder="Nové heslo (min. 8 znakov)" value={next} onChange={e => setNext(e.target.value)} style={inputStyle} />
      {msg && <p style={{ color: msg.ok ? '#9be59b' : '#ffb3b3', fontSize: 13, marginBottom: 12 }}>{msg.text}</p>}
      <button onClick={change} disabled={busy || !current || next.length < 8} style={{
        padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
        fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
        background: busy ? 'rgba(255,255,255,.1)' : '#ffd47a', color: '#1f2247',
        opacity: (!current || next.length < 8) ? 0.5 : 1,
      }}>{busy ? 'Mením…' : 'Zmeniť heslo'}</button>
    </div>
  )
}
