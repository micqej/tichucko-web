import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { age_id, count = 10 } = await req.json()
  const age = AGE_CATEGORIES.find(a => a.id === age_id)
  if (!age) return Response.json({ error: 'Neplatný vek.' }, { status: 400 })

  console.log(`[POST /api/admin/generate-topics] age=${age_id} count=${count}`)

  try {
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Vygeneruj ${count} originálnych tém pre slovenské rozprávky na dobrú noc pre deti vo veku ${age.range}.
Každá téma musí mať:
- theme: názov témy (5–8 slov)
- keywords: 3–5 kľúčových slov (čiarkou oddelené)
- moral_lesson: ponaučenie (jedna veta)

Odpovedz VÝHRADNE ako JSON pole (bez markdown):
[{"theme":"...","keywords":"...","moral_lesson":"..."}]`
      }],
      response_format: { type: 'json_object' },
    })

    const raw = JSON.parse(res.choices[0].message.content!)
    const items = Array.isArray(raw) ? raw : raw.topics ?? raw.items ?? []

    const db = supabaseAdmin()
    const rows = items.map((t: Record<string, string>) => ({
      age_id: age_id as AgeId,
      theme: t.theme,
      keywords: t.keywords,
      moral_lesson: t.moral_lesson,
    }))

    const { data, error } = await db.from('topics').insert(rows).select()
    if (error) {
      console.error('[generate-topics] DB error:', error.message)
      return Response.json({ error: 'Uloženie zlyhalo.' }, { status: 500 })
    }

    console.log(`[generate-topics] Inserted ${data.length} topics`)
    return Response.json({ count: data.length, topics: data })
  } catch (err) {
    console.error('[generate-topics] Error:', err)
    return Response.json({ error: 'Generovanie zlyhalo.' }, { status: 500 })
  }
}
