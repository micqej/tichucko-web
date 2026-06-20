import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// POST — bulk vytvorenie schválených tém (z auto-návrhu) alebo jednej ručnej témy
export async function POST(req: NextRequest) {
  const body = await req.json()
  const rows = (Array.isArray(body.topics) ? body.topics : [body]) as Array<{ age_id: string; theme: string; keywords?: string; moral_lesson?: string }>
  const valid = rows.filter(r => r.age_id && r.theme)
  if (valid.length === 0) return Response.json({ error: 'Chýbajú témy.' }, { status: 400 })

  const payload = valid.map(r => ({ age_id: r.age_id, theme: r.theme, keywords: r.keywords ?? '', moral_lesson: r.moral_lesson ?? '' }))
  const { data, error } = await supabaseAdmin().from('topics').insert(payload).select()
  if (error) {
    console.error('[POST /api/admin/topics] DB error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
  console.log(`[POST /api/admin/topics] Pridaných ${data.length} tém`)
  return Response.json({ count: data.length, topics: data }, { status: 201 })
}

// PATCH — edit topic fields
export async function PATCH(req: NextRequest) {
  const { id, theme, keywords, moral_lesson, used } = await req.json()
  if (!id) return Response.json({ error: 'Chýba id.' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (theme !== undefined)        updates.theme = theme
  if (keywords !== undefined)     updates.keywords = keywords
  if (moral_lesson !== undefined) updates.moral_lesson = moral_lesson
  if (used !== undefined)         updates.used = used

  const { data, error } = await supabaseAdmin()
    .from('topics')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH /api/admin/topics] DB error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
  console.log(`[PATCH /api/admin/topics] Updated topic id=${id}`)
  return Response.json({ topic: data })
}

// DELETE — via ?id=
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'Chýba id.' }, { status: 400 })

  const { error } = await supabaseAdmin()
    .from('topics')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[DELETE /api/admin/topics] DB error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
  console.log(`[DELETE /api/admin/topics] Deleted topic id=${id}`)
  return Response.json({ ok: true })
}
