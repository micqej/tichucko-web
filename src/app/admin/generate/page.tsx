import { supabaseAdmin } from '@/lib/supabase'
import { AGE_CATEGORIES } from '@/lib/data'
import GenerateClient from './GenerateClient'

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ topicId?: string }> }) {
  const { topicId } = await searchParams
  const db = supabaseAdmin()

  const [topicsRes, topicRes] = await Promise.all([
    db.from('topics').select('*').eq('used', false).order('priority', { ascending: false }).limit(50),
    topicId ? db.from('topics').select('*').eq('id', topicId).single() : Promise.resolve({ data: null }),
  ])

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>✨ AI Generovanie</h1>
      <p style={{ color: '#7a7faa', marginBottom: 28 }}>Vyber tému a nechaj AI vygenerovať rozprávku. Môžeš ju pred publikovaním upraviť.</p>
      <GenerateClient
        ages={AGE_CATEGORIES}
        unusedTopics={topicsRes.data ?? []}
        preselectedTopic={topicRes.data}
      />
    </div>
  )
}
