'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin',             label: '📊 Dashboard',     exact: true  },
  { href: '/admin/stories',     label: '📖 Rozprávky',     exact: false },
  { href: '/admin/topics',      label: '🗂️ Témy',          exact: false },
  { href: '/admin/generate',    label: '✨ Generovať AI',  exact: false },
  { href: '/admin/subscribers', label: '📬 Odberatelia',   exact: false },
  { href: '/admin/settings',    label: '⚙️ Nastavenia',    exact: false },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page — no sidebar
  if (pathname === '/admin/login') {
    return (
      <div style={{ background: '#0e1230', minHeight: '100vh', fontFamily: 'var(--font-quicksand)', color: '#f6f1e1' }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0e1230', color: '#f6f1e1', fontFamily: 'var(--font-quicksand)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 230, flexShrink: 0,
        background: '#161a3d', borderRight: '1px solid rgba(255,255,255,.07)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 14px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'conic-gradient(from 210deg, #ff6b9d, #ffb347, #7cc6ff, #c89bff, #ff6b9d)',
            display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0,
          }}>🌙</span>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 900, fontSize: 18, color: '#f6f1e1' }}>tichučko</span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  color: active ? '#f6f1e1' : '#7a7faa',
                  background: active ? 'rgba(200,155,255,.15)' : 'transparent',
                  border: active ? '1px solid rgba(200,155,255,.2)' : '1px solid transparent',
                  transition: '.15s', display: 'block', textDecoration: 'none',
                }}
              >{item.label}</Link>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 14, marginTop: 14 }}>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" style={{
              width: '100%', padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#7a7faa',
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left',
            }}>🚪 Odhlásiť</button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
