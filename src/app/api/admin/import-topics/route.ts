import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'

// Supported age_id values
const VALID_AGE_IDS = new Set(['a02', 'a24', 'a47', 'a710', 'a1013'])

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    values.push(cur.trim())

    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  }).filter(r => r.theme && VALID_AGE_IDS.has(r.age_id))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = supabaseAdmin()

  let rows: Array<{ age_id: AgeId; theme: string; keywords?: string; moral_lesson?: string }> = []

  if (body.csv) {
    const parsed = parseCsv(body.csv)
    console.log(`[POST /api/admin/import-topics] CSV parsed ${parsed.length} rows`)
    rows = parsed.map(r => ({
      age_id: r.age_id as AgeId,
      theme: r.theme,
      keywords: r.keywords || undefined,
      moral_lesson: r.moral_lesson || undefined,
    }))
  } else if (body.manual) {
    rows = body.manual.filter((r: { age_id: string; theme: string }) =>
      r.theme && VALID_AGE_IDS.has(r.age_id)
    )
  }

  if (rows.length === 0) {
    return Response.json({ error: 'Žiadne platné riadky. Skontroluj formát CSV (stĺpce: age_id, theme, keywords, moral_lesson).' }, { status: 400 })
  }

  const { data, error } = await db.from('topics').insert(rows).select()
  if (error) {
    console.error('[import-topics] DB error:', error.message)
    return Response.json({ error: 'Uloženie zlyhalo.' }, { status: 500 })
  }

  return Response.json({ count: data.length, topics: data })
}
