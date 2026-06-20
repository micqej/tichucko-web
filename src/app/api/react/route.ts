import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

const VALID = ['like', 'dislike', 'finished'] as const
const LABEL: Record<string, string> = { like: 'Teší nás, že sa páčila! 💛', dislike: 'Ďakujeme — budeme sa snažiť lepšie. 🙏', finished: 'Krásne, že ste ju dočítali. 🌙' }

function page(emoji: string, title: string, body: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '/'
  return new Response(
    `<!DOCTYPE html><html lang="sk"><head><meta charset="utf-8"><title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;background:#0e1230;color:#f6f1e1;text-align:center;padding:20px}
    h1{font-size:28px;margin:12px 0}p{color:#cdc7e0;line-height:1.6}a{color:#ffd47a;font-weight:700}</style></head>
    <body><div><div style="font-size:52px">${emoji}</div><h1>${title}</h1><p>${body}</p>
    <p style="margin-top:24px"><a href="${appUrl}/rozpravky">Pozri ďalšie rozprávky →</a></p></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(req: NextRequest) {
  const storyId = req.nextUrl.searchParams.get('story')
  const signal = req.nextUrl.searchParams.get('v') ?? ''
  if (!storyId || !VALID.includes(signal as typeof VALID[number])) {
    return page('🤔', 'Neplatný odkaz', 'Skús kliknúť priamo z emailu.')
  }

  const db = supabaseAdmin()
  const { data: story } = await db.from('stories').select('age_id').eq('id', storyId).single()
  if (!story) return page('🤷', 'Rozprávka neexistuje', 'Možno bola medzitým zmazaná.')

  await db.from('reactions').insert({ story_id: storyId, signal, age_id: story.age_id })
  console.log(`[react] story=${storyId} signal=${signal}`)
  return page(signal === 'dislike' ? '🙏' : '💛', 'Ďakujeme za odozvu!', LABEL[signal])
}
