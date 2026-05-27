import { supabaseAdmin } from '@/lib/supabase'
import { generateStoryOpenAI } from '@/lib/openai'
import { generateStoryGrok } from '@/lib/grok'
import { sendDailyStory } from '@/lib/email'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'

// Vercel Cron calls this at 15:00 UTC (17:00 SK čas)
// Protected by CRON_SECRET header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    console.warn('[CRON] Unauthorized request')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Daily job started:', new Date().toISOString())
  const db = supabaseAdmin()

  // 1. Pick a random unused topic (prefer higher priority)
  const { data: topics } = await db
    .from('topics')
    .select('*')
    .eq('used', false)
    .order('priority', { ascending: false })
    .limit(10)

  if (!topics || topics.length === 0) {
    console.warn('[CRON] No unused topics found — skipping generation')
    return Response.json({ skipped: true, reason: 'no_topics' })
  }

  const topic = topics[Math.floor(Math.random() * Math.min(topics.length, 5))]
  console.log(`[CRON] Selected topic: "${topic.theme}" age=${topic.age_id}`)

  // 2. Generate story — try Grok first (free), fall back to OpenAI
  let story
  try {
    story = await generateStoryGrok({
      ageId: topic.age_id as AgeId,
      theme: topic.theme,
      keywords: topic.keywords,
      moralLesson: topic.moral_lesson,
    })
    console.log(`[CRON] Generated via Grok: "${story.title}"`)
  } catch (grokErr) {
    console.warn('[CRON] Grok failed, falling back to OpenAI:', grokErr)
    story = await generateStoryOpenAI({
      ageId: topic.age_id as AgeId,
      theme: topic.theme,
      keywords: topic.keywords,
      moralLesson: topic.moral_lesson,
    })
    console.log(`[CRON] Generated via OpenAI: "${story.title}"`)
  }

  // 3. Save story to DB
  const { data: savedStory, error: storyErr } = await db
    .from('stories')
    .insert({
      title: story.title,
      age_id: topic.age_id,
      theme: topic.theme,
      emoji: story.emoji,
      cover_a: story.cover_a,
      cover_b: story.cover_b,
      minutes: story.minutes,
      pages: story.pages,
      author: story.author,
      generated_by: 'grok',
      status: 'published',
    })
    .select()
    .single()

  if (storyErr || !savedStory) {
    console.error('[CRON] Failed to save story:', storyErr?.message)
    return Response.json({ error: 'Uloženie rozprávky zlyhalo.' }, { status: 500 })
  }

  // 4. Mark topic as used
  await db.from('topics').update({ used: true }).eq('id', topic.id)

  // 5. Get active subscribers
  const { data: subscribers } = await db
    .from('subscribers')
    .select('email')
    .eq('active', true)

  const emails = (subscribers ?? []).map((s: { email: string }) => s.email)
  console.log(`[CRON] Sending to ${emails.length} subscribers`)

  // 6. Send emails
  let sent = 0
  if (emails.length > 0) {
    const result = await sendDailyStory(savedStory, emails)
    sent = result.sent
  }

  // 7. Log the send
  await db.from('daily_sends').insert({
    story_id: savedStory.id,
    recipient_count: sent,
  })

  console.log(`[CRON] Done. Story "${savedStory.title}" sent to ${sent} subscribers.`)
  return Response.json({
    ok: true,
    story: { id: savedStory.id, title: savedStory.title },
    sent,
  })
}
