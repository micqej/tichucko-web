import { supabaseAdmin } from '@/lib/supabase'
import { generateStoryOpenAI } from '@/lib/openai'
import { generateStoryGrok } from '@/lib/grok'
import { generateStoryClaude } from '@/lib/claude'
import { sendDailyStory } from '@/lib/email'
import { getSetting, getApiKey } from '@/lib/settings'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'

// Vercel Cron calls this at 15:00 UTC (17:00 SK čas)
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    console.warn('[CRON] Unauthorized request')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Daily job started:', new Date().toISOString())
  const db = supabaseAdmin()

  // 1. Pick a random unused topic
  const { data: topics } = await db
    .from('topics')
    .select('*')
    .eq('used', false)
    .order('priority', { ascending: false })
    .limit(10)

  if (!topics || topics.length === 0) {
    console.warn('[CRON] No unused topics — skipping')
    return Response.json({ skipped: true, reason: 'no_topics' })
  }

  const topic = topics[Math.floor(Math.random() * Math.min(topics.length, 5))]
  const input = {
    ageId: topic.age_id as AgeId,
    theme: topic.theme,
    keywords: topic.keywords,
    moralLesson: topic.moral_lesson,
  }

  // 2. Generate — use admin-configured provider, cascade on failure
  const preferredProvider = (await getSetting('ai_provider')) ?? 'openai'
  let story
  let usedProvider = preferredProvider

  try {
    if (preferredProvider === 'grok') {
      story = await generateStoryGrok(input, await getApiKey('grok_api_key', 'GROK_API_KEY'))
    } else if (preferredProvider === 'claude') {
      story = await generateStoryClaude(input, await getApiKey('claude_api_key', 'CLAUDE_API_KEY'))
    } else {
      story = await generateStoryOpenAI(input, await getApiKey('openai_api_key', 'OPENAI_API_KEY'))
    }
    console.log(`[CRON] Generated via ${usedProvider}: "${story.title}"`)
  } catch (primaryErr) {
    console.warn(`[CRON] ${usedProvider} failed, falling back to openai:`, primaryErr)
    try {
      story = await generateStoryOpenAI(input, await getApiKey('openai_api_key', 'OPENAI_API_KEY'))
      usedProvider = 'openai'
      console.log(`[CRON] Fallback openai success: "${story.title}"`)
    } catch (fallbackErr) {
      console.error('[CRON] All providers failed:', fallbackErr)
      return Response.json({ error: 'Generovanie zlyhalo.' }, { status: 500 })
    }
  }

  // 3. Save story
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
      generated_by: usedProvider,
      status: 'published',
    })
    .select()
    .single()

  if (storyErr || !savedStory) {
    console.error('[CRON] Save failed:', storyErr?.message)
    return Response.json({ error: 'Uloženie zlyhalo.' }, { status: 500 })
  }

  // 4. Mark topic used
  await db.from('topics').update({ used: true }).eq('id', topic.id)

  // 5. Get active subscribers (with unsubscribe tokens for SMTP)
  const { data: subscribers } = await db
    .from('subscribers')
    .select('email, unsubscribe_token')
    .eq('active', true)

  const subs = (subscribers ?? []) as Array<{ email: string; unsubscribe_token: string }>
  console.log(`[CRON] Sending to ${subs.length} subscribers`)

  // 6. Send emails
  let sent = 0
  if (subs.length > 0) {
    const result = await sendDailyStory(savedStory, subs)
    sent = result.sent
  }

  // 7. Log
  await db.from('daily_sends').insert({ story_id: savedStory.id, recipient_count: sent })

  console.log(`[CRON] Done. "${savedStory.title}" sent to ${sent} subscribers.`)
  return Response.json({ ok: true, story: { id: savedStory.id, title: savedStory.title }, sent })
}
