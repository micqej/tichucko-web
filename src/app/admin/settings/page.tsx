'use client'
import { useEffect, useState } from 'react'

const SECTIONS = [
  {
    title: '🤖 AI Generátor',
    fields: [
      { key: 'ai_provider', label: 'Aktívny AI provider', type: 'select', options: ['openai', 'claude', 'grok'] },
      { key: 'openai_api_key', label: 'OpenAI API kľúč', type: 'password', placeholder: 'sk-proj-...' },
      { key: 'claude_api_key', label: 'Claude (Anthropic) API kľúč', type: 'password', placeholder: 'sk-ant-...' },
      { key: 'grok_api_key', label: 'Grok (xAI) API kľúč', type: 'password', placeholder: 'xai-...' },
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

      <div style={{ background: 'rgba(255,212,122,.08)', border: '1px solid rgba(255,212,122,.2)', borderRadius: 12, padding: '14px 18px', color: '#ffd47a', fontSize: 13 }}>
        💡 API kľúče sú maskované pri zobrazení. Po uložení sa nový kľúč hneď použije — bez redeploymentu.
      </div>
    </div>
  )
}
