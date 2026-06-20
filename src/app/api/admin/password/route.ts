import type { NextRequest } from 'next/server'
import { getSetting, setSetting } from '@/lib/settings'
import { verifyPassword, hashPassword } from '@/lib/crypto'

// Zmena admin hesla. Chránené proxy.ts (len prihlásený admin sa sem dostane).
export async function POST(req: NextRequest) {
  const { current, next } = (await req.json()) as { current: string; next: string }

  if (!next || next.length < 8) {
    return Response.json({ error: 'Nové heslo musí mať aspoň 8 znakov.' }, { status: 400 })
  }

  const hash = await getSetting('admin_password_hash')
  const ok = hash
    ? verifyPassword(current ?? '', hash)
    : Boolean(process.env.ADMIN_PASSWORD && current === process.env.ADMIN_PASSWORD)

  if (!ok) {
    return Response.json({ error: 'Súčasné heslo je nesprávne.' }, { status: 401 })
  }

  await setSetting('admin_password_hash', hashPassword(next))
  console.log('[admin/password] heslo zmenené')
  return Response.json({ ok: true })
}
