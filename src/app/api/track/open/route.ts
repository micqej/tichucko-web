import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

function gif() {
  return new Response(PIXEL, {
    status: 200,
    headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  })
}

// Email open tracking — bumps opens on the latest send of this story. Always returns the pixel.
export async function GET(req: NextRequest) {
  const storyId = req.nextUrl.searchParams.get('s')
  if (!storyId) return gif()

  try {
    const db = supabaseAdmin()
    const { data: send } = await db
      .from('daily_sends')
      .select('id, opens')
      .eq('story_id', storyId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()
    if (send) {
      await db.from('daily_sends').update({ opens: (send.opens ?? 0) + 1 }).eq('id', send.id)
    }
  } catch (err) {
    console.error('[track/open] error:', err)
  }
  return gif()
}
