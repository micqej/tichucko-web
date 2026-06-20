import { supabaseAdmin } from './supabase'
import { generateStoryOpenAI, type GenerateInput, type GeneratedStory } from './openai'
import { generateStoryGrok } from './grok'
import { generateStoryGroq } from './groq'
import { getApiKey, getSetting } from './settings'
import { generateTopicsForAge } from './topics'
import type { AgeId } from './types'

export const DEFAULT_AGE: AgeId = 'a47'
export const TOPIC_REFILL_THRESHOLD = 5

/** Generate a story with the preferred provider, cascading to OpenAI on failure. */
export async function generateWithCascade(input: GenerateInput, preferred: string): Promise<{ story: GeneratedStory; provider: string }> {
  // Pokyny redaktora (admin) majú prednosť — pripoja sa ku každému generovaniu.
  if (input.adminDirective === undefined) {
    input = { ...input, adminDirective: (await getSetting('learning_directives')) ?? '' }
  }
  try {
    if (preferred === 'grok') return { story: await generateStoryGrok(input, await getApiKey('grok_api_key', 'GROK_API_KEY')), provider: 'grok' }
    if (preferred === 'groq') return { story: await generateStoryGroq(input, await getApiKey('groq_api_key', 'GROQ_API_KEY')), provider: 'groq' }
    return { story: await generateStoryOpenAI(input, await getApiKey('openai_api_key', 'OPENAI_API_KEY')), provider: 'openai' }
  } catch (primaryErr) {
    if (preferred === 'openai') throw primaryErr
    console.warn(`[generate] ${preferred} failed, falling back to openai:`, primaryErr)
    return { story: await generateStoryOpenAI(input, await getApiKey('openai_api_key', 'OPENAI_API_KEY')), provider: 'openai' }
  }
}

/** Pick an unused topic for an age, auto-refilling topics if the queue is empty. */
export async function pickTopic(db: ReturnType<typeof supabaseAdmin>, ageId: AgeId) {
  const query = () => db.from('topics').select('*').eq('age_id', ageId).eq('used', false).order('priority', { ascending: false }).limit(10)

  let { data: topics } = await query()
  if (!topics || topics.length === 0) {
    console.log(`[generate] No topics for ${ageId} — generating fresh batch`)
    try { await generateTopicsForAge(ageId, 10) } catch (err) { console.error(`[generate] Refill failed for ${ageId}:`, err); return null }
    ;({ data: topics } = await query())
  }
  if (!topics || topics.length === 0) return null
  return topics[Math.floor(Math.random() * Math.min(topics.length, 5))]
}

/** Proactively top up the topic queue for an age if it's running low. */
export async function refillIfLow(db: ReturnType<typeof supabaseAdmin>, ageId: AgeId) {
  const { count } = await db.from('topics').select('id', { count: 'exact', head: true }).eq('age_id', ageId).eq('used', false)
  if ((count ?? 0) < TOPIC_REFILL_THRESHOLD) {
    try { await generateTopicsForAge(ageId, 10) } catch (err) { console.warn(`[generate] Proactive refill for ${ageId} failed:`, err) }
  }
}

/** Ages we need a story for today, derived from active subscribers ('all'/null → default). */
export function neededAgesFrom(subs: Array<{ age_preference: AgeId | 'all' | null }>): Set<AgeId> {
  const ages = new Set<AgeId>()
  for (const s of subs) ages.add(!s.age_preference || s.age_preference === 'all' ? DEFAULT_AGE : s.age_preference)
  if (ages.size === 0) ages.add(DEFAULT_AGE)
  return ages
}

export function ageOf(sub: { age_preference: AgeId | 'all' | null }): AgeId {
  return !sub.age_preference || sub.age_preference === 'all' ? DEFAULT_AGE : sub.age_preference
}
