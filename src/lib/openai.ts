import OpenAI from 'openai'
import type { AgeId, StoryPage } from './types'
import { AGE_CATEGORIES } from './data'
import { getSetting } from './settings'
import { seasonalContext } from './seasonal'

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
  /** Pokyny redaktora (admin) — majú prednosť pred všetkým. */
  adminDirective?: string
}

/** Blok s pokynmi redaktora, ktorý sa vkladá na začiatok promptu (najvyššia priorita). */
export function directiveBlock(input: GenerateInput): string {
  return input.adminDirective?.trim()
    ? `\nNAJDÔLEŽITEJŠIE — pokyny redaktora, ktoré musíš dodržať nad všetkým ostatným:\n${input.adminDirective.trim()}\n`
    : ''
}

/** Pokyny na hĺbku príbehu + sezónny kontext — vkladá sa do každého generovania rozprávky. */
export function depthBlock(): string {
  return `\nKĽÚČOVÉ PRE KVALITU — rozprávka musí mať skutočnú HĹBKU:
- Emocionálna vrstva a vnútorný svet postavy: jemný vnútorný konflikt a premena zvnútra, nie plochý dej.
- Ukazuj cez obraz, dej a dialóg — nepoučuj. Ponaučenie nech vyplynie prirodzene zo zážitku, nie ako nálepka.
- Konkrétne zmyslové detaily (vône, zvuky, svetlo, dotyk), poetický no jednoduchý jazyk primeraný veku.
- Žiadne klišé ani moralizovanie. Tón teplý, láskavý, upokojujúci pred spaním; nikdy strašidelný.
- Postavy s menom a charakterom, ktorým dieťa rozumie a fandí.
Sezónny kontext (${seasonalContext()}): ak to prirodzene sedí k téme, jemne ho votkaj do prostredia a atmosféry (nie nasilu).\n`
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
  return `${directiveBlock(input)}${depthBlock()}Napíš originálnu slovenskú rozprávku na dobrú noc pre deti vo veku ${age.range}.

Téma: ${input.theme}
${input.keywords ? `Kľúčové slová: ${input.keywords}` : ''}
${input.moralLesson ? `Ponaučenie: ${input.moralLesson}` : ''}

Požiadavky:
- Dĺžka: ${spec.words} slov (cca ${spec.label} čítania, ${spec.approxWords})
- Počet kapitol: ${spec.chapters}
- Jazyk: slovenčina, vhodná pre vek ${age.range}
- Každá kapitola má poetický nadpis BEZ predpony "Kapitola X:" a 2–4 odseky
- Posledná stránka: krátke ponaučenie (1–2 vety) a emoji ozdoba
- Tón: teplý, poetický, upokojujúci, nie strašidelný
- Postavy: zvieratká alebo detské postavy s menami
- DÔLEŽITÉ pre "title": vymysli poetický rozprávkový názov — NIE popisný ("Rozprávka o klamstve", "Odvaha a pravda") ale magický a konkrétny ako "Šepoty hviezd", "Medvedík Ňuňo a stratená nálada", "Hvezdička Alka sa vracia" — krátky, s postavou ak je to možné

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
    model: (await getSetting('openai_model')) || 'gpt-4o-mini',
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
