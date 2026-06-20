import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail, notifyNewSubscriber } from '@/lib/email'
import { AGE_CATEGORIES } from '@/lib/data'
import type { NextRequest } from 'next/server'

function page(emoji: string, title: string, body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '/'
  return new Response(
    `<!DOCTYPE html><html lang="sk"><head><meta charset="utf-8"><title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#0e1230;color:#f6f1e1;text-align:center;padding:20px}
    h1{font-size:30px;margin:12px 0}p{color:#cdc7e0;line-height:1.6}a{color:#ffd47a;font-weight:700}</style></head>
    <body><div><div style="font-size:52px">${emoji}</div><h1>${title}</h1><p>${body}</p>
    <p style="margin-top:24px"><a href="${appUrl}">← Späť na Tichučko</a></p></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return page('⚠️', 'Neplatný odkaz', 'Chýba potvrdzovací token.')

  const db = supabaseAdmin()
  const { data: sub } = await db.from('subscribers').select('*').eq('confirm_token', token).single()
  if (!sub) return page('🤷', 'Odkaz nie je platný', 'Možno bol už použitý.')

  if (sub.confirmed && sub.active) {
    return page('✅', 'Už potvrdené', 'Tvoj odber je aktívny. Každý večer ti príde nová rozprávka. 🌙')
  }

  await db.from('subscribers').update({ confirmed: true, active: true }).eq('id', sub.id)
  console.log(`[confirm] ${sub.email} confirmed`)

  // Welcome the subscriber + notify the admin (now a real, confirmed subscriber)
  const { count } = await db.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true)
  const ageLabel = AGE_CATEGORIES.find(a => a.id === sub.age_preference)?.range ?? 'všetky veky'
  try { await sendWelcomeEmail(sub.email, sub.unsubscribe_token) } catch (err) { console.error('[confirm] welcome failed:', err) }
  try { await notifyNewSubscriber(sub.email, ageLabel, count ?? 0) } catch (err) { console.error('[confirm] notify failed:', err) }

  return page('🌙', 'Odber potvrdený!', 'Vitaj v Tichučku. Každý večer ti pošleme novú rozprávku na dobrú noc.')
}
