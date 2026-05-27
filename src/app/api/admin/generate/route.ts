import { supabaseAdmin } from '@/lib/supabase'
import { generateStoryOpenAI } from '@/lib/openai'
import { generateStoryGrok } from '@/lib/grok'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { ageId, theme, keywords, moralLesson, provider, topicId } = await req.json()

  if (!ageId || !theme) {
    return Response.json({ error: 'Chýba vek alebo téma.' }, { status: 400 })
  }

  const input = { ageId: ageId as AgeId, theme, keywords, moralLesson }
  console.log(`[POST /api/admin/generate] provider=${provider} age=${ageId} theme="${theme}"`)

  try {
    const story = provider === 'grok'
      ? await generateStoryGrok(input)
      : await generateStoryOpenAI(input)

    // Mark topic as used if provided
    if (topicId) {
      const db = supabaseAdmin()
      await db.from('topics').update({ used: true }).eq('id', topicId)
    }

    console.log(`[POST /api/admin/generate] Success: "${story.title}"`)
    return Response.json({ story })
  } catch (err) {
    console.error('[POST /api/admin/generate] Generation failed:', err)
    return Response.json({ error: 'Generovanie zlyhalo. Skontroluj API kľúč.' }, { status: 500 })
  }
}
