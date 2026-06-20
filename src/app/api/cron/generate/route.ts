import { supabaseAdmin } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'
import { signActionToken } from '@/lib/token'
import { sendApprovalEmail } from '@/lib/email'
import { generateWithCascade, pickTopic, refillIfLow, neededAgesFrom } from '@/lib/generate'
import { AGE_CATEGORIES } from '@/lib/data'
import type { NextRequest } from 'next/server'
import type { AgeId, Story } from '@/lib/types'

export const maxDuration = 300

// Morning cron (e.g. 06:00 UTC = 08:00 SK). Generates DRAFTS (pending_review) and
// emails Michal one approval email. Nothing is sent to subscribers here.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON generate] started:', new Date().toISOString())
  const db = supabaseAdmin()

  const { data: subscribers } = await db.from('subscribers').select('age_preference').eq('active', true)
  const subs = (subscribers ?? []) as Array<{ age_preference: AgeId | 'all' | null }>
  const neededAges = neededAgesFrom(subs)

  const preferred = (await getSetting('ai_provider')) ?? 'openai'
  const autoApprove = (await getSetting('auto_approve')) === 'on'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tichucko.sk'
  const drafts: Story[] = []

  for (const ageId of neededAges) {
    const topic = await pickTopic(db, ageId)
    if (!topic) { console.warn(`[CRON generate] no topic for ${ageId}`); continue }

    let generated
    try {
      generated = await generateWithCascade(
        { ageId, theme: topic.theme, keywords: topic.keywords, moralLesson: topic.moral_lesson },
        preferred,
      )
    } catch (err) {
      console.error(`[CRON generate] all providers failed for ${ageId}:`, err)
      continue
    }
    const { story, provider } = generated

    const { data: saved, error } = await db.from('stories').insert({
      title: story.title, age_id: ageId, theme: topic.theme, emoji: story.emoji,
      cover_a: story.cover_a, cover_b: story.cover_b, minutes: story.minutes,
      pages: story.pages, author: story.author, generated_by: provider,
      status: autoApprove ? 'published' : 'pending_review',
      approved_at: autoApprove ? new Date().toISOString() : null,
    }).select().single()

    if (error || !saved) { console.error(`[CRON generate] save failed ${ageId}:`, error?.message); continue }

    await db.from('topics').update({ used: true }).eq('id', topic.id)
    await refillIfLow(db, ageId)
    drafts.push(saved as Story)
    console.log(`[CRON generate] ${ageId} draft via ${provider}: "${saved.title}"`)
  }

  // Build the approval email (skip if auto-approve is on — nothing to review)
  if (drafts.length > 0 && !autoApprove) {
    const items = await Promise.all(drafts.map(async (s) => {
      const ageLabel = AGE_CATEGORIES.find(a => a.id === s.age_id)?.range ?? ''
      const firstPage = s.pages.find(p => p.type === 'chapter')
      const preview = firstPage?.body?.[0]?.slice(0, 160) ?? ''
      const tokenFor = (action: string) => signActionToken({ id: s.id, action }, 36 * 3600)
      return {
        title: s.title, ageLabel, theme: s.theme, preview,
        storyUrl: `${appUrl}/rozpravky/${s.id}`,
        approveUrl: `${appUrl}/api/admin/approve?t=${await tokenFor('approve')}`,
        editUrl: `${appUrl}/admin/stories?edit=${s.id}`,
        discardUrl: `${appUrl}/api/admin/approve?t=${await tokenFor('discard')}`,
      }
    }))
    try { await sendApprovalEmail(items) } catch (err) { console.error('[CRON generate] approval email failed:', err) }
  }

  console.log(`[CRON generate] done. ${drafts.length} drafts, autoApprove=${autoApprove}`)
  return Response.json({ ok: true, drafts: drafts.length, autoApprove })
}
