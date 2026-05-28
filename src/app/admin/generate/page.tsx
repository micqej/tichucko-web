import { supabaseAdmin } from '@/lib/supabase'
import { AGE_CATEGORIES } from '@/lib/data'
import GenerateClient from './GenerateClient'

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string; topicIds?: string }>
}) {
  const { topicId, topicIds } = await searchParams
  const db = supabaseAdmin()

  // Parse multiple topic IDs from bulk link (e.g. topicIds=id1,id2,id3)
  const bulkIds = topicIds ? topicIds.split(',').filter(Boolean) : []

  const [topicsRes, topicRes] = await Promise.all([
    db.from('topics').select('*').eq('used', false).order('priority', { ascending: false }).limit(100),
    topicId ? db.from('topics').select('*').eq('id', topicId).single() : Promise.resolve({ data: null }),
  ])

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>✨ AI Generovanie</h1>
      <p style={{ color: '#7a7faa', marginBottom: 28 }}>
        Vyber tému a nechaj AI vygenerovať rozprávku. Môžeš ju pred publikovaním skontrolovať.
      </p>
      <GenerateClient
        ages={AGE_CATEGORIES}
        unusedTopics={topicsRes.data ?? []}
        preselectedTopic={topicRes.data}
        preselectedTopicIds={bulkIds.length > 0 ? bulkIds : undefined}
      />
    </div>
  )
}
