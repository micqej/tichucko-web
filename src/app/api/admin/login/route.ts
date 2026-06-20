import { SignJWT } from 'jose'
import type { NextRequest } from 'next/server'
import { getSetting } from '@/lib/settings'
import { verifyPassword } from '@/lib/crypto'

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? 'fallback-secret-change-me')
const THIRTY_DAYS = 30 * 24 * 3600

// Jednoduchý rate-limit v pamäti (na proces) — proti hádaniu hesla.
const attempts = new Map<string, { n: number; ts: number }>()
function tooMany(ip: string): boolean {
  const now = Date.now()
  const a = attempts.get(ip)
  if (!a || now - a.ts > 15 * 60_000) { attempts.set(ip, { n: 1, ts: now }); return false }
  a.n++; a.ts = now
  return a.n > 10
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (tooMany(ip)) {
    return Response.json({ error: 'Príliš veľa pokusov. Skús o 15 minút.' }, { status: 429 })
  }

  const { password } = await req.json()
  const hash = await getSetting('admin_password_hash')

  const ok = hash
    ? verifyPassword(password ?? '', hash)
    : Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD)

  if (!ok) {
    console.warn(`[admin/login] Failed login from ${ip}`)
    return Response.json({ error: 'Nesprávne heslo.' }, { status: 401 })
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  headers.set('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THIRTY_DAYS}${secure}`)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}
