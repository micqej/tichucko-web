import OpenAI from 'openai'
import type { AgeId, StoryPage } from './types'
import { AGE_CATEGORIES } from './data'

function getClient(apiKey?: string) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
}

export type StoryLength = 'short' | 'medium' | 'long'

export const LENGTH_SPECS: Record<StoryLength, { label: string; words: string; chapters: string; minutes: number; approxWords: string }> = {
  short:  { label: 'Krátka',  words: '200–300',   chapters: '2–3', minutes: 2, approxWords: '~250 slov' },
  medium: { label: 'Stredná', words: '500–650',   chapters: '4–5', minutes: 4, approxWords: '~550 slov' },
  long:   { label: 'Dlhá',    words: '800–1000',  chapters: '5–6', minutes: 6, approxWords: '~900 slov' },
}

export interface GenerateInput {
  ageId: AgeId
  theme: string
  keywords?: string
  moralLesson?: string
  length?: StoryLength
}

export interface GeneratedStory {
  title: string
  emoji: string
  cover_a: string
  cover_b: string
  minutes: number
  author: string
  pages: StoryPage[]
}

const COVER_PALETTES: Record<AgeId, { a: string; b: string }> = {
  a02: { a: '#ff9bbf', b: '#c89bff' },
  a24: { a: '#ffb347', b: '#ff9bbf' },
  a47: { a: '#9be59b', b: '#7cc6ff' },
  a710: { a: '#7cc6ff', b: '#c89bff' },
  a1013: { a: '#3a2670', b: '#7cc6ff' },
}

function buildPrompt(input: GenerateInput): string {
  const age = AGE_CATEGORIES.find(a => a.id === input.ageId)!
  const spec = LENGTH_SPECS[input.length ?? 'medium']
  return `Napíš originálnu slovenskú rozprávku na dobrú noc pre deti vo veku ${age.range}.

Téma: ${input.theme}
${input.keywords ? `Kľúčové slová: ${input.keywords}` : ''}
${input.moralLesson ? `Ponaučenie: ${input.moralLesson}` : ''}

Požiadavky:
- Dĺžka: ${spec.words} slov (cca ${spec.label} čítania, ${spec.approxWords})
- Počet kapitol: ${spec.chapters}
- Jazyk: slovenčina, vhodná pre vek ${age.range}
- Každá kapitola má nadpis a 2–4 odseky
- Posledná stránka: krátke ponaučenie (1–2 vety) a emoji ozdoba
- Tón: teplý, poetický, upokojujúci, nie strašidelný
- Postavy: zvieratká alebo detské postavy s menami

Odpovedz VÝHRADNE vo formáte JSON (bez markdown):
{
  "title": "Názov rozprávky",
  "emoji": "jedna emoji pre tému",
  "author": "krátky podtitul (max 10 slov)",
  "pages": [
    { "type": "chapter", "heading": "Názov kapitoly", "body": ["odsek1", "odsek2", "odsek3"] },
    { "type": "end", "moral": "Ponaučenie vety.", "art": "emoji1 emoji2" }
  ]
}`
}

export async function generateStoryOpenAI(input: GenerateInput, apiKey?: string): Promise<GeneratedStory> {
  const res = await getClient(apiKey).chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(input) }],
    response_format: { type: 'json_object' },
    temperature: 0.9,
  })

  const raw = JSON.parse(res.choices[0].message.content!)
  const palette = COVER_PALETTES[input.ageId]

  const spec = LENGTH_SPECS[input.length ?? 'medium']
  return {
    title: raw.title,
    emoji: raw.emoji ?? '🌙',
    cover_a: palette.a,
    cover_b: palette.b,
    minutes: spec.minutes,
    author: raw.author ?? '',
    pages: raw.pages,
  }
}
