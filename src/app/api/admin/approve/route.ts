import { supabaseAdmin } from '@/lib/supabase'
import { verifyActionToken } from '@/lib/token'
import type { NextRequest } from 'next/server'

function page(emoji: string, title: string, body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '/'
  return new Response(
    `<!DOCTYPE html><html lang="sk"><head><meta charset="utf-8"><title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#0e1230;color:#f6f1e1;text-align:center;padding:20px}
    h1{font-size:30px;margin:12px 0}p{color:#cdc7e0;line-height:1.6;max-width:420px}a{color:#ffd47a;font-weight:700}</style></head>
    <body><div><div style="font-size:52px">${emoji}</div><h1>${title}</h1><p>${body}</p>
    <p style="margin-top:24px"><a href="${appUrl}/admin">← Späť do administrácie</a></p></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  if (!token) return page('⚠️', 'Neplatný odkaz', 'Chýba bezpečnostný token.')

  const payload = await verifyActionToken<{ id: string; action: string }>(token)
  if (!payload?.id) return page('⏰', 'Odkaz vypršal', 'Tento schvaľovací odkaz už nie je platný. Sprav to priamo v administrácii.')

  const db = supabaseAdmin()
  const { data: story } = await db.from('stories').select('id, title, status').eq('id', payload.id).single()
  if (!story) return page('🤷', 'Rozprávka neexistuje', 'Možno bola medzitým zmazaná.')

  console.log(`[approve] action=${payload.action} id=${payload.id} status=${story.status}`)

  if (payload.action === 'discard') {
    await db.from('stories').update({ status: 'discarded' }).eq('id', payload.id)
    return page('🗑️', 'Zahodené', `Rozprávka „${story.title}" sa neodošle.`)
  }

  // approve
  if (story.status === 'published') {
    return page('✅', 'Už schválené', `„${story.title}" je schválená. Odošle sa dnes o 17:00.`)
  }
  await db.from('stories').update({ status: 'published', approved_at: new Date().toISOString() }).eq('id', payload.id)
  return page('✅', 'Schválené!', `„${story.title}" sa dnes o 17:00 odošle odberateľom. 🌙`)
}
