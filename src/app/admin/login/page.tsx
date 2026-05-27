'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Nesprávne heslo.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: '#0e1230',
    }}>
      <div style={{
        background: '#1a1f48', borderRadius: 20, padding: 40,
        width: '100%', maxWidth: 380, boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        border: '1px solid rgba(255,255,255,.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🌙</div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#f6f1e1', fontSize: 26, fontWeight: 900, margin: '10px 0 4px' }}>Tichučko Admin</h1>
          <p style={{ color: '#7a7faa', fontSize: 14 }}>Prihlás sa pre správu rozprávok</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#cdc7e0', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>Heslo</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {error && <p style={{ color: '#ffb3b3', fontSize: 13, marginBottom: 14, background: 'rgba(255,100,100,.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 13, borderRadius: 10,
              background: '#ffd47a', color: '#1f2247', fontWeight: 800, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
              opacity: loading ? .7 : 1, fontFamily: 'inherit',
            }}
          >{loading ? 'Prihlasujem…' : 'Prihlásiť sa'}</button>
        </form>
      </div>
    </div>
  )
}
