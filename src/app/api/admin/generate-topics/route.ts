import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import { getApiKey, getSetting } from '@/lib/settings'

async function getClient() {
  const provider = (await getSetting('ai_provider')) ?? 'openai'
  if (provider === 'groq') {
    const apiKey = await getApiKey('groq_api_key', 'GROQ_API_KEY')
    return { client: new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }), model: 'llama-3.3-70b-versatile' }
  }
  const apiKey = await getApiKey('openai_api_key', 'OPENAI_API_KEY')
  return { client: new OpenAI({ apiKey }), model: 'gpt-4o-mini' }
}

export async function POST(req: NextRequest) {
  const { age_id, count = 10 } = await req.json()
  const age = AGE_CATEGORIES.find(a => a.id === age_id)
  if (!age) return Response.json({ error: 'Neplatný vek.' }, { status: 400 })

  console.log(`[POST /api/admin/generate-topics] age=${age_id} count=${count}`)

  try {
    const { client, model } = await getClient()

    const res = await client.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `Vygeneruj ${count} originálnych tém pre slovenské rozprávky na dobrú noc pre deti vo veku ${age.range}.

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

    if (!items.length) {
      return Response.json({ error: 'AI nevrátila žiadne témy.' }, { status: 500 })
    }

    const db = supabaseAdmin()
    const rows = items.map((t) => ({
      age_id: age_id as AgeId,
      theme: t.theme ?? '',
      keywords: t.keywords ?? '',
      moral_lesson: t.moral_lesson ?? '',
    }))

    const { data, error } = await db.from('topics').insert(rows).select()
    if (error) {
      console.error('[generate-topics] DB error:', error.message)
      return Response.json({ error: `Uloženie zlyhalo: ${error.message}` }, { status: 500 })
    }

    console.log(`[generate-topics] Inserted ${data.length} topics`)
    return Response.json({ count: data.length, topics: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-topics] Error:', msg)
    return Response.json({ error: `Generovanie zlyhalo: ${msg}` }, { status: 500 })
  }
}
