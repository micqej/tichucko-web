'use client'
import { useState } from 'react'
import { AGE_CATEGORIES } from '@/lib/data'

export default function SubscribeSection() {
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('all')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, age_preference: age }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('ok')
        setMsg(data.message ?? 'Prihlásenie sa podarilo! 🌙')
        setEmail('')
      } else {
        setStatus('error')
        setMsg(data.error ?? 'Niečo sa nepodarilo. Skúste znova.')
      }
    } catch {
      setStatus('error')
      setMsg('Spojenie zlyhalo. Skúste znova.')
    }
  }

  return (
    <section id="odoberat" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 80px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #2a1d5c, #1d3a6b)',
          borderRadius: 28, padding: 'clamp(36px,6vw,64px)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
          color: '#f6f1e1',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,.4)',
        }}
          className="subscribe-grid"
        >
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,.12)', padding: '7px 14px',
              borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: '.06em',
              textTransform: 'uppercase', color: '#cdc7e0', marginBottom: 16,
            }}>✨ Každý večer nová rozprávka</span>
            <h2 style={{
              fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(30px,4vw,48px)',
              fontWeight: 900, lineHeight: 1.05, color: '#fff',
            }}>
              Rozprávky<br />priamo do<br />
              <span style={{ fontStyle: 'italic', color: '#ffd47a' }}>schránky</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: '#cdc7e0', marginTop: 16, maxWidth: 400 }}>
              Každý deň o <strong style={{ color: '#fff' }}>17:00</strong> ti pošleme novú rozprávku šitú na mieru veku tvojho dieťatka. Žiadny spam — iba tichúčke príbehy.
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
              {[['🌙', 'Každý večer'], ['✨', 'Bez reklám'], ['💛', 'Zadarmo']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#cdc7e0' }}>
                  <span>{icon}</span>{text}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{
            background: 'rgba(255,255,255,.06)', borderRadius: 20,
            padding: 32, backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,.1)',
          }}>
            {status === 'ok' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 56 }}>🌙</div>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 900, color: '#fff', margin: '16px 0 10px' }}>Vitaj v Tichučku!</h3>
                <p style={{ color: '#cdc7e0', lineHeight: 1.6 }}>{msg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#cdc7e0', marginBottom: 8 }}>
                    E-mailová adresa
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="mama@tichucko.sk"
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12,
                      background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                      color: '#fff', fontSize: 15, fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#cdc7e0', marginBottom: 8 }}>
                    Vek dieťatka
                  </label>
                  <select
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12,
                      background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                      color: '#fff', fontSize: 15, fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    <option value="all" style={{ background: '#1a1f48' }}>Všetky vekové kategórie</option>
                    {AGE_CATEGORIES.map(a => (
                      <option key={a.id} value={a.id} style={{ background: '#1a1f48' }}>
                        {a.emoji} {a.range} — {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {status === 'error' && (
                  <p style={{ color: '#ffb3b3', fontSize: 13, marginBottom: 14, background: 'rgba(255,100,100,.1)', padding: '8px 12px', borderRadius: 8 }}>
                    {msg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: '#ffd47a', color: '#1f2247',
                    fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    opacity: status === 'loading' ? .7 : 1,
                    transition: '.2s',
                    border: 'none',
                  }}
                >
                  {status === 'loading' ? 'Prihlasovanie…' : '🌙 Odoberať rozprávky zadarmo'}
                </button>

                <p style={{ fontSize: 11, color: '#7a7faa', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  Odhlásenie je kedykoľvek možné jedným kliknutím.
                </p>
              </form>
            )}
          </div>
        </div>

        <style>{`
          @media (max-width: 720px) {
            .subscribe-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  )
}
