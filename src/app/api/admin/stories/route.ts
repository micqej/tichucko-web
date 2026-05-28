import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// POST — create story (from AI generate preview)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, age_id, theme, emoji, cover_a, cover_b, minutes, pages, author, generated_by, status } = body

  if (!title || !age_id || !pages) {
    return Response.json({ error: 'Chýbajú povinné polia.' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('stories')
    .insert({ title, age_id, theme, emoji, cover_a, cover_b, minutes, pages, author, generated_by, status: status ?? 'published' })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/stories] DB error:', error.message, '| code:', error.code)
    return Response.json({ error: `Uloženie zlyhalo: ${error.message}` }, { status: 500 })
  }

  console.log(`[POST /api/admin/stories] Created story id=${data.id} "${title}"`)
  return Response.json({ id: data.id, story: data }, { status: 201 })
}

// PATCH — update status
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  if (!id) return Response.json({ error: 'Chýba id.' }, { status: 400 })

  const db = supabaseAdmin()
  const { error } = await db.from('stories').update({ status }).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

// DELETE — via ?id=
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'Chýba id.' }, { status: 400 })

  const db = supabaseAdmin()
  const { error } = await db.from('stories').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  console.log(`[DELETE /api/admin/stories] Deleted story id=${id}`)
  return Response.json({ ok: true })
}
