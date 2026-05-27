// xAI Grok uses OpenAI-compatible API
import OpenAI from 'openai'
import type { AgeId } from './types'
import type { GenerateInput, GeneratedStory } from './openai'
import { AGE_CATEGORIES } from './data'

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

const COVER_PALETTES: Record<AgeId, { a: string; b: string }> = {
  a02: { a: '#ff9bbf', b: '#c89bff' },
  a24: { a: '#ffb347', b: '#ff9bbf' },
  a47: { a: '#9be59b', b: '#7cc6ff' },
  a710: { a: '#7cc6ff', b: '#c89bff' },
  a1013: { a: '#3a2670', b: '#7cc6ff' },
}

function buildPrompt(input: GenerateInput): string {
  const age = AGE_CATEGORIES.find(a => a.id === input.ageId)!
  return `Napíš originálnu slovenskú rozprávku na dobrú noc pre deti vo veku ${age.range}.

Téma: ${input.theme}
${input.keywords ? `Kľúčové slová: ${input.keywords}` : ''}
${input.moralLesson ? `Ponaučenie: ${input.moralLesson}` : ''}

Požiadavky:
- Dĺžka na čítanie: 4–5 minút (cca 600–800 slov)
- Jazyk: slovenčina, vhodná pre vek ${age.range}
- Štruktúra: 4–5 kapitol + záverečná stránka s ponaučením
- Každá kapitola: nadpis + 3–5 odsekov
- Posledná stránka: krátke ponaučenie (1–2 vety) a emoji
- Tón: teplý, poetický, upokojujúci
- Postavy: zvieratká alebo detské postavy s menami

Odpovedz VÝHRADNE vo formáte JSON (bez markdown kódu):
{
  "title": "...",
  "emoji": "...",
  "author": "...",
  "pages": [
    { "type": "chapter", "heading": "...", "body": ["...","..."] },
    { "type": "end", "moral": "...", "art": "..." }
  ]
}`
}

export async function generateStoryGrok(input: GenerateInput): Promise<GeneratedStory> {
  const res = await grok.chat.completions.create({
    model: 'grok-3-mini',
    messages: [{ role: 'user', content: buildPrompt(input) }],
    temperature: 0.9,
  })

  const content = res.choices[0].message.content!
  // strip possible markdown fences
  const jsonStr = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const raw = JSON.parse(jsonStr)
  const palette = COVER_PALETTES[input.ageId]

  return {
    title: raw.title,
    emoji: raw.emoji ?? '🌙',
    cover_a: palette.a,
    cover_b: palette.b,
    minutes: 4,
    author: raw.author ?? '',
    pages: raw.pages,
  }
}
