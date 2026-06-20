import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import { proposeTopicsForAge } from '@/lib/topics'

// Navrhne témy (BEZ uloženia) pre zadané veky a počet. Admin ich potom schváli.
export async function POST(req: NextRequest) {
  const { ages, count = 5 } = (await req.json()) as { ages: AgeId[]; count: number }
  const valid = (ages ?? []).filter(a => AGE_CATEGORIES.some(c => c.id === a))
  if (valid.length === 0) return Response.json({ error: 'Vyber aspoň jeden vek.' }, { status: 400 })

  const per = Math.max(1, Math.min(20, Number(count) || 5))
  try {
    const results = await Promise.all(valid.map(async (ageId) => {
      const proposals = await proposeTopicsForAge(ageId, per)
      return proposals.map(p => ({ age_id: ageId, ...p }))
    }))
    const proposals = results.flat()
    console.log(`[propose-topics] navrhnutých ${proposals.length} tém pre ${valid.join(',')}`)
    return Response.json({ proposals })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[propose-topics] error:', msg)
    return Response.json({ error: `Návrh zlyhal: ${msg}` }, { status: 500 })
  }
}
