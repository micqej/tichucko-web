import { SignJWT } from 'jose'
import type { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? 'fallback-secret-change-me'
)

const THIRTY_DAYS = 30 * 24 * 3600

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    console.warn('[admin/login] Failed login attempt')
    return Response.json({ error: 'Nesprávne heslo.' }, { status: 401 })
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const res = Response.json({ ok: true })
  const headers = new Headers(res.headers)
  headers.set(
    'Set-Cookie',
    `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THIRTY_DAYS}${secure}`
  )
  return new Response(res.body, { status: 200, headers })
}
