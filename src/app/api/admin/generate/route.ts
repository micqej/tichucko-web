import { supabaseAdmin } from '@/lib/supabase'
import { generateStoryOpenAI } from '@/lib/openai'
import { generateStoryGrok } from '@/lib/grok'
import { generateStoryClaude } from '@/lib/claude'
import { getApiKey, getSetting } from '@/lib/settings'
import type { NextRequest } from 'next/server'
import type { AgeId } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { ageId, theme, keywords, moralLesson, provider: reqProvider, topicId } = await req.json()

  if (!ageId || !theme) {
    return Response.json({ error: 'Chýba vek alebo téma.' }, { status: 400 })
  }

  // Use explicit provider from request, or fall back to admin settings default
  const provider = reqProvider || (await getSetting('ai_provider')) || 'openai'
  const input = { ageId: ageId as AgeId, theme, keywords, moralLesson }
  console.log(`[POST /api/admin/generate] provider=${provider} age=${ageId} theme="${theme}"`)

  try {
    let story
    if (provider === 'grok') {
      const apiKey = await getApiKey('grok_api_key', 'GROK_API_KEY')
      story = await generateStoryGrok(input, apiKey)
    } else if (provider === 'claude') {
      const apiKey = await getApiKey('claude_api_key', 'CLAUDE_API_KEY')
      story = await generateStoryClaude(input, apiKey)
    } else {
      const apiKey = await getApiKey('openai_api_key', 'OPENAI_API_KEY')
      story = await generateStoryOpenAI(input, apiKey)
    }

    if (topicId) {
      await supabaseAdmin().from('topics').update({ used: true }).eq('id', topicId)
    }

    console.log(`[POST /api/admin/generate] Success: "${story.title}"`)
    return Response.json({ story })
  } catch (err) {
    console.error('[POST /api/admin/generate] Generation failed:', err)
    return Response.json({ error: 'Generovanie zlyhalo. Skontroluj API kľúč v Nastaveniach.' }, { status: 500 })
  }
}
