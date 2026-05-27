import { SignJWT } from 'jose'
import type { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? 'fallback-secret-change-me'
)

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    console.warn('[POST /api/admin/login] Failed login attempt')
    return Response.json({ error: 'Nesprávne heslo.' }, { status: 401 })
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  const res = Response.json({ ok: true })
  const headers = new Headers(res.headers)
  headers.set(
    'Set-Cookie',
    `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  )
  return new Response(res.body, { status: 200, headers })
}
