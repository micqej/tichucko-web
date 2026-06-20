import { getAllSettings, setSetting, SECRET_KEYS } from '@/lib/settings'
import type { NextRequest } from 'next/server'

function mask(key: string, value: string): string {
  if (!SECRET_KEYS.has(key) || !value) return value
  return '••••••••' // hodnota je šifrovaná v DB, klientovi ju neukazujeme
}

export async function GET() {
  const all = await getAllSettings()
  const masked = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, mask(k, v)]))
  delete masked['admin_password_hash'] // hash hesla klientovi nikdy
  return Response.json({ settings: masked })
}

export async function POST(req: NextRequest) {
  const { key, value } = (await req.json()) as { key: string; value: string }
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 })
  if (key === 'admin_password_hash') return Response.json({ error: 'Forbidden' }, { status: 403 })

  // ak prišla ešte maskovaná hodnota, neprepisuj
  if (SECRET_KEYS.has(key) && value.includes('••••')) {
    return Response.json({ ok: true, skipped: true })
  }

  await setSetting(key, value ?? '')
  return Response.json({ ok: true })
}
