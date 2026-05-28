import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

const API_KEY_KEYS = ['openai_api_key', 'claude_api_key', 'grok_api_key', 'resend_api_key', 'smtp_password']

function maskSecret(key: string, value: string): string {
  if (!API_KEY_KEYS.includes(key) || !value) return value
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 6) + '••••••••' + value.slice(-4)
}

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db.from('settings').select('key, value')
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const masked = Object.fromEntries(
    (data ?? []).map((r: { key: string; value: string }) => [r.key, maskSecret(r.key, r.value)])
  )
  return Response.json({ settings: masked })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { key, value } = body as { key: string; value: string }

  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 })

  // If value is still the masked form, don't overwrite
  if (API_KEY_KEYS.includes(key) && value.includes('••••')) {
    return Response.json({ ok: true, skipped: true })
  }

  const db = supabaseAdmin()
  const { error } = await db
    .from('settings')
    .upsert({ key, value: value ?? '', updated_at: new Date().toISOString() })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
