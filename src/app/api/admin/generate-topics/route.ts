import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import { generateTopicsForAge } from '@/lib/topics'

export async function POST(req: NextRequest) {
  const { age_id, count = 10 } = await req.json()
  if (!AGE_CATEGORIES.find(a => a.id === age_id)) {
    return Response.json({ error: 'Neplatný vek.' }, { status: 400 })
  }

  console.log(`[POST /api/admin/generate-topics] age=${age_id} count=${count}`)

  try {
    const data = await generateTopicsForAge(age_id as AgeId, count)
    console.log(`[generate-topics] Inserted ${data.length} topics`)
    return Response.json({ count: data.length, topics: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-topics] Error:', msg)
    return Response.json({ error: `Generovanie zlyhalo: ${msg}` }, { status: 500 })
  }
}
