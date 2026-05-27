import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Tichučko Admin' }

const NAV = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/stories', label: '📖 Rozprávky' },
  { href: '/admin/topics', label: '🗂️ Témy' },
  { href: '/admin/generate', label: '✨ Generovať AI' },
  { href: '/admin/subscribers', label: '📬 Odberatelia' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e1230', color: '#f6f1e1', fontFamily: 'var(--font-quicksand)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: '#161a3d', borderRight: '1px solid rgba(255,255,255,.07)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'conic-gradient(from 210deg, #ff6b9d, #ffb347, #7cc6ff, #c89bff, #ff6b9d)',
            display: 'grid', placeItems: 'center', fontSize: 18,
          }}>🌙</span>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: 18, color: '#f6f1e1' }}>tichučko</span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '10px 14px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: '#cdc7e0',
                transition: '.15s', display: 'block',
              }}
            >{item.label}</Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 16, marginTop: 16 }}>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" style={{
              width: '100%', padding: '9px 14px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#7a7faa',
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left',
            }}>🚪 Odhlásiť</button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
