import OpenAI from 'openai'
import { getDb } from './db'
import { supabaseAdmin } from './supabase'
import { AGE_CATEGORIES } from './data'
import { getApiKey, getSetting } from './settings'
import type { AgeId } from './types'

async function getTopicClient() {
  const provider = (await getSetting('ai_provider')) ?? 'openai'
  if (provider === 'groq') {
    const apiKey = await getApiKey('groq_api_key', 'GROQ_API_KEY')
    return { client: new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }), model: 'llama-3.3-70b-versatile' }
  }
  const apiKey = await getApiKey('openai_api_key', 'OPENAI_API_KEY')
  return { client: new OpenAI({ apiKey }), model: 'gpt-4o-mini' }
}

/** Top témy podľa pomeru 👍 (learning signál) — vstup do promptu pre nové témy. */
async function winningThemes(ageId: AgeId): Promise<string[]> {
  try {
    const rows = getDb().prepare(
      `SELECT s.theme AS theme,
              SUM(CASE r.signal WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0.3 END) AS score
         FROM reactions r JOIN stories s ON s.id = r.story_id
        WHERE s.age_id = ?
        GROUP BY s.theme HAVING score > 0
        ORDER BY score DESC LIMIT 5`,
    ).all(ageId) as Array<{ theme: string }>
    return rows.map(r => r.theme)
  } catch {
    return []
  }
}

/** Generate `count` fresh topics for an age group and insert them. Returns inserted rows. */
export async function generateTopicsForAge(ageId: AgeId, count = 10) {
  const age = AGE_CATEGORIES.find(a => a.id === ageId)
  if (!age) throw new Error(`Neplatný vek: ${ageId}`)

  const { client, model } = await getTopicClient()
  const winners = await winningThemes(ageId)
  const directive = (await getSetting('learning_directives')) ?? ''
  // Tvoje (admin) pokyny majú PREDNOSŤ pred hlasmi ľudí.
  const steer = directive.trim()
    ? `\n\nNAJDÔLEŽITEJŠIE — pokyny redaktora, ktoré musíš dodržať nad všetkým ostatným:\n${directive.trim()}`
    : ''
  const inspiration = winners.length
    ? `\n\nTieto témy mali u rodičov úspech — inšpiruj sa ich náladou (vymysli NOVÉ, neopakuj doslova), ale len ak neodporujú pokynom redaktora:\n- ${winners.join('\n- ')}`
    : ''

  const res = await client.chat.completions.create({
    model,
    messages: [{
      role: 'user',
      content: `Vygeneruj ${count} originálnych tém pre slovenské rozprávky na dobrú noc pre deti vo veku ${age.range}.${steer}${inspiration}

Každá téma musí mať:
- theme: krátka téma/námet (max 5 slov, nie popisný názov)
- keywords: 3–5 kľúčových slov (čiarkou oddelené)
- moral_lesson: ponaučenie (jedna krátka veta)

Odpovedz VÝHRADNE ako JSON pole (bez markdown):
[{"theme":"...","keywords":"...","moral_lesson":"..."}]`
    }],
    response_format: { type: 'json_object' },
  })

  const raw = JSON.parse(res.choices[0].message.content!)
  const items: Array<Record<string, string>> = Array.isArray(raw) ? raw : raw.topics ?? raw.items ?? raw.themes ?? []
  if (!items.length) throw new Error('AI nevrátila žiadne témy.')

  const rows = items.map((t) => ({
    age_id: ageId,
    theme: t.theme ?? '',
    keywords: t.keywords ?? '',
    moral_lesson: t.moral_lesson ?? '',
  }))

  const { data, error } = await supabaseAdmin().from('topics').insert(rows).select()
  if (error) throw new Error(`Uloženie tém zlyhalo: ${error.message}`)
  return data
}
