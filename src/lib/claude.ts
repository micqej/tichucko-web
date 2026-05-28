import Anthropic from '@anthropic-ai/sdk'
import type { AgeId } from './types'
import type { GenerateInput, GeneratedStory } from './openai'
import { LENGTH_SPECS } from './openai'
import { AGE_CATEGORIES } from './data'

const COVER_PALETTES: Record<AgeId, { a: string; b: string }> = {
  a02:   { a: '#ff9bbf', b: '#c89bff' },
  a24:   { a: '#ffb347', b: '#ff9bbf' },
  a47:   { a: '#9be59b', b: '#7cc6ff' },
  a710:  { a: '#7cc6ff', b: '#c89bff' },
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
- Každá kapitola: poetický nadpis BEZ "Kapitola X:" prefixu + 2–4 odseky
- Posledná stránka: ponaučenie (1–2 vety) a emoji ozdoba
- Tón: teplý, poetický, upokojujúci
- Postavy: zvieratká alebo detské postavy s menami
- DÔLEŽITÉ pre "title": poetický rozprávkový názov — NIE "Rozprávka o X" ale napr. "Šepoty lesa", "Medvedík Ňuňo a mesiac", "Líška Terka hľadá domov"

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

export async function generateStoryClaude(input: GenerateInput, apiKey: string): Promise<GeneratedStory> {
  const client = new Anthropic({ apiKey })

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(input) }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')

  const jsonStr = block.text
    .replace(/^```json\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
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
