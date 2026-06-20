import OpenAI from 'openai'
import { getDb } from './db'
import { supabaseAdmin } from './supabase'
import { AGE_CATEGORIES } from './data'
import { getApiKey, getSetting } from './settings'
import { seasonalContext } from './seasonal'
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

export type TopicProposal = { theme: string; keywords: string; moral_lesson: string }

/** Navrhne `count` tém pre vek — BEZ uloženia (na schválenie adminom). Vracia návrhy. */
export async function proposeTopicsForAge(ageId: AgeId, count = 10): Promise<TopicProposal[]> {
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

  const dateStr = new Date().toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
  const seasonal = seasonalContext()
  const valuesPalette = age.values.map(v => `- ${v}`).join('\n')
  const ideas = (age.articleIdeas ?? []).map(v => `- ${v}`).join('\n')

  const res = await client.chat.completions.create({
    model,
    messages: [{
      role: 'user',
      content: `Si skúsený detský psychológ a rozprávkár. Vygeneruj ${count} originálnych, EMOCIONÁLNE HLBOKÝCH tém pre slovenské rozprávky na dobrú noc pre deti vo veku ${age.range} (${age.label}).${steer}

Charakteristika veku: ${age.blurb}

Vychádzaj z hodnôt dôležitých pre tento vek (kombinuj ich a prepájaj, nech majú témy vrstvu):
${valuesPalette}
${ideas ? `\nMôžeš sa inšpirovať aj týmito rodičovskými námetmi:\n${ideas}` : ''}

KALENDÁR (dnes je ${dateStr}) — ${seasonal}.
Pri časti tém (nie pri všetkých a nikdy nasilu) jemne zapleť tento sezónny/sviatočný motív, nech to má súvis s obdobím.${inspiration}

Požiadavky na HĹBKU (toto je najdôležitejšie):
- Žiadne ploché námety typu „zdieľanie hračiek". Každá téma nech nesie vnútorný konflikt alebo jemnú emóciu dieťaťa (napr. „keď je najťažšie požičať to najmilšie").
- Prepájaj hodnoty navzájom, aby mala téma presah a hĺbku.
- Láskavé, upokojujúce, vhodné pred spaním — nikdy strašidelné ani moralizujúce.

Každá téma musí mať:
- theme: pútavý konkrétny názov (max ~6 slov)
- keywords: 3–5 kľúčových slov / hodnôt (čiarkou oddelené)
- moral_lesson: ponaučenie s hĺbkou (jedna veta, nie klišé)

Odpovedz VÝHRADNE ako JSON pole (bez markdown):
[{"theme":"...","keywords":"...","moral_lesson":"..."}]`
    }],
    response_format: { type: 'json_object' },
    temperature: 1,
  })

  const raw = JSON.parse(res.choices[0].message.content!)
  const items: Array<Record<string, string>> = Array.isArray(raw) ? raw : raw.topics ?? raw.items ?? raw.themes ?? []
  if (!items.length) throw new Error('AI nevrátila žiadne témy.')

  return items.map((t) => ({ theme: t.theme ?? '', keywords: t.keywords ?? '', moral_lesson: t.moral_lesson ?? '' }))
}

/** Uloží návrhy tém pre daný vek do fronty. */
export async function insertTopics(ageId: AgeId, rows: TopicProposal[]) {
  if (!rows.length) return []
  const payload = rows.map(r => ({ age_id: ageId, theme: r.theme, keywords: r.keywords, moral_lesson: r.moral_lesson }))
  const { data, error } = await supabaseAdmin().from('topics').insert(payload).select()
  if (error) throw new Error(`Uloženie tém zlyhalo: ${error.message}`)
  return data
}

/** Navrhne a rovno uloží témy (používa cron auto-refill, keď dochádzajú témy). */
export async function generateTopicsForAge(ageId: AgeId, count = 10) {
  const proposals = await proposeTopicsForAge(ageId, count)
  return insertTopics(ageId, proposals)
}
