import { supabaseAdmin } from '@/lib/supabase'
import { sendDailyStory, sendDailyReport } from '@/lib/email'
import { ageOf, neededAgesFrom } from '@/lib/generate'
import { AGE_CATEGORIES } from '@/lib/data'
import type { NextRequest } from 'next/server'
import type { AgeId, Story } from '@/lib/types'

export const maxDuration = 300

type Sub = { email: string; unsubscribe_token: string; age_preference: AgeId | 'all' | null }

// Evening cron (15:00 UTC = 17:00 SK). Sends APPROVED (status='published') stories
// that haven't gone out yet, each to its matching age group. Idempotent per story.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON daily] started:', new Date().toISOString())
  const db = supabaseAdmin()

  const { data: subscribers } = await db
    .from('subscribers')
    .select('email, unsubscribe_token, age_preference')
    .eq('active', true)
  const subs = (subscribers ?? []) as Sub[]
  if (subs.length === 0) {
    console.log('[CRON daily] no active subscribers')
    return Response.json({ ok: true, sent: 0, reason: 'no_subscribers' })
  }

  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  const report: Array<{ ageLabel: string; title: string; sent: number }> = []
  let totalSent = 0

  for (const ageId of neededAgesFrom(subs)) {
    // newest approved, recent story for this age
    const { data: stories } = await db
      .from('stories')
      .select('*')
      .eq('age_id', ageId)
      .eq('status', 'published')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5)

    // pick the newest one that hasn't been sent yet (idempotency guard)
    let story: Story | null = null
    for (const s of (stories ?? []) as Story[]) {
      const { count } = await db.from('daily_sends').select('id', { count: 'exact', head: true }).eq('story_id', s.id)
      if ((count ?? 0) === 0) { story = s; break }
    }
    if (!story) { console.log(`[CRON daily] ${ageId}: nothing new approved`); continue }

    const recipients = subs.filter(s => ageOf(s) === ageId)
    if (recipients.length === 0) continue

    const { sent } = await sendDailyStory(story, recipients)
    await db.from('daily_sends').insert({ story_id: story.id, recipient_count: sent })
    totalSent += sent
    report.push({ ageLabel: AGE_CATEGORIES.find(a => a.id === ageId)?.range ?? '', title: story.title, sent })
    console.log(`[CRON daily] ${ageId}: "${story.title}" → ${sent}`)
  }

  if (report.length > 0) {
    try { await sendDailyReport(report, totalSent) } catch (err) { console.error('[CRON daily] report failed:', err) }
  }

  console.log(`[CRON daily] done. ${report.length} stories, ${totalSent} emails`)
  return Response.json({ ok: true, sent: totalSent, stories: report })
}
