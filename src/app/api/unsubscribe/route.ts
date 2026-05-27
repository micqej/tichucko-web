import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return new Response('Neplatný odkaz.', { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('subscribers')
    .update({ active: false })
    .eq('unsubscribe_token', token)
    .select()
    .single()

  if (error || !data) {
    console.warn('[GET /api/unsubscribe] Token not found:', token)
    return new Response('Odkaz nie je platný alebo bol už použitý.', { status: 404 })
  }

  console.log(`[GET /api/unsubscribe] Unsubscribed: ${data.email}`)

  // Redirect to a friendly page
  return new Response(
    `<!DOCTYPE html><html lang="sk"><head><meta charset="utf-8"><title>Odhlásenie</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#0e1230;color:#f6f1e1;text-align:center;padding:20px}
    h1{font-size:32px;margin-bottom:12px}p{color:#cdc7e0;line-height:1.6}a{color:#ffd47a;font-weight:700}</style>
    </head><body>
    <div><div style="font-size:48px;margin-bottom:16px">🌙</div>
    <h1>Odber zrušený</h1>
    <p>Adresa <strong>${data.email}</strong> bola odhlásená.<br>Ďakujeme, že si bol s nami.</p>
    <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? '/'}">← Späť na Tichučko</a></p>
    </div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
