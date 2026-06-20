// Groq — ultra-fast LLM inference (groq.com), OpenAI-compatible API
import OpenAI from 'openai'
import type { AgeId } from './types'
import type { GenerateInput, GeneratedStory } from './openai'
import { directiveBlock, depthBlock } from './openai'
import { AGE_CATEGORIES } from './data'
import { getSetting } from './settings'

function getGroq(apiKey?: string) {
  return new OpenAI({
    apiKey: apiKey || process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })
}

const COVER_PALETTES: Record<AgeId, { a: string; b: string }> = {
  a02:   { a: '#ff9bbf', b: '#c89bff' },
  a24:   { a: '#ffb347', b: '#ff9bbf' },
  a47:   { a: '#9be59b', b: '#7cc6ff' },
  a710:  { a: '#7cc6ff', b: '#c89bff' },
  a1013: { a: '#3a2670', b: '#7cc6ff' },
}

const LENGTH_SPECS = {
  short:  { label: '2 min', words: '200–300', chapters: '2–3', minutes: 2 },
  medium: { label: '4 min', words: '500–650', chapters: '4–5', minutes: 4 },
  long:   { label: '6 min', words: '800–1000', chapters: '5–6', minutes: 6 },
}

function buildPrompt(input: GenerateInput): string {
  const age = AGE_CATEGORIES.find(a => a.id === input.ageId)!
  const spec = LENGTH_SPECS[input.length ?? 'medium']
  return `${directiveBlock(input)}${depthBlock()}Napíš originálnu slovenskú rozprávku na dobrú noc pre deti vo veku ${age.range}.

Téma: ${input.theme}
${input.keywords ? `Kľúčové slová: ${input.keywords}` : ''}
${input.moralLesson ? `Ponaučenie: ${input.moralLesson}` : ''}

Požiadavky:
- Dĺžka: ${spec.words} slov (cca ${spec.label} čítania)
- Počet kapitol: ${spec.chapters}
- Jazyk: slovenčina, vhodná pre vek ${age.range}
- Každá kapitola: poetický nadpis BEZ "Kapitola X:" prefixu + 2–4 odseky
- Posledná stránka: ponaučenie (1–2 vety) a emoji ozdoba
- Tón: teplý, poetický, upokojujúci
- Postavy: zvieratká alebo detské postavy s menami
- DÔLEŽITÉ pre "title": poetický rozprávkový názov — NIE "Rozprávka o X" ale napr. "Šepoty lesa", "Medvedík Ňuňo a mesiac", "Líška Terka hľadá domov"

Odpovedz VÝHRADNE vo formáte JSON (bez markdown):
{
  "title": "...",
  "emoji": "...",
  "author": "...",
  "pages": [
    { "type": "chapter", "heading": "...", "body": ["odsek1", "odsek2"] },
    { "type": "end", "moral": "...", "art": "emoji" }
  ]
}`
}

export async function generateStoryGroq(input: GenerateInput, apiKey?: string): Promise<GeneratedStory> {
  const res = await getGroq(apiKey).chat.completions.create({
    model: (await getSetting('groq_model')) || 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: buildPrompt(input) }],
    temperature: 0.9,
  })

  const content = res.choices[0].message.content!
  const jsonStr = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const raw = JSON.parse(jsonStr)
  const palette = COVER_PALETTES[input.ageId]
  const spec = LENGTH_SPECS[input.length ?? 'medium']

  return {
    title:   raw.title,
    emoji:   raw.emoji ?? '🌙',
    cover_a: palette.a,
    cover_b: palette.b,
    minutes: spec.minutes,
    author:  raw.author ?? '',
    pages:   raw.pages,
  }
}
