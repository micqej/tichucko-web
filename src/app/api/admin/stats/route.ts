import { supabaseAdmin } from '@/lib/supabase'

// Subscriber growth (cumulative, last 30 days) + reaction insights for the dashboard.
export async function GET() {
  const db = supabaseAdmin()

  const [{ data: subs }, { data: reactions }, { data: pending }] = await Promise.all([
    db.from('subscribers').select('subscribed_at, active'),
    db.from('reactions').select('signal, age_id'),
    db.from('stories').select('id, title, age_id, theme, created_at').eq('status', 'pending_review').order('created_at', { ascending: false }),
  ])

  // cumulative growth over the last 30 days
  const days = 30
  const today = new Date()
  const growth: Array<{ date: string; total: number }> = []
  const subsArr = (subs ?? []) as Array<{ subscribed_at: string; active: boolean }>
  const allSubs = subsArr.filter(s => s.subscribed_at).sort((a, b) => a.subscribed_at.localeCompare(b.subscribed_at))
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const cutoff = d.toISOString().slice(0, 10)
    const total = allSubs.filter(s => s.subscribed_at.slice(0, 10) <= cutoff).length
    growth.push({ date: cutoff, total })
  }

  // reaction insights
  const r = (reactions ?? []) as Array<{ signal: string; age_id: string }>
  const likes = r.filter(x => x.signal === 'like').length
  const dislikes = r.filter(x => x.signal === 'dislike').length
  const finished = r.filter(x => x.signal === 'finished').length

  return Response.json({
    growth,
    activeSubscribers: subsArr.filter(s => s.active).length,
    reactions: { likes, dislikes, finished, total: r.length },
    pending: pending ?? [],
  })
}
