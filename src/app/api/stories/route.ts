import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const ageId = searchParams.get('age')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100)

  try {
    let query = supabase
      .from('stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (ageId) query = query.eq('age_id', ageId)

    const { data, error } = await query
    if (error) {
      console.error('[GET /api/stories] Supabase error:', error.message)
      return Response.json({ error: 'Nepodarilo sa načítať rozprávky.' }, { status: 500 })
    }

    return Response.json({ stories: data ?? [] })
  } catch (err) {
    console.error('[GET /api/stories] Unexpected error:', err)
    return Response.json({ error: 'Interná chyba servera.' }, { status: 500 })
  }
}
