import { supabaseAdmin } from '@/lib/supabase'
import type { Topic } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import TopicsClient from './TopicsClient'

export default async function AdminTopicsPage() {
  const db = supabaseAdmin()
  // Použité témy sú „minuté" (stala sa z nich rozprávka) — v zozname ich neukazujeme.
  const { data } = await db
    .from('topics')
    .select('*')
    .eq('used', false)
    .order('created_at', { ascending: false })
  const topics: Topic[] = data ?? []

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>Témy pre rozprávky</h1>
        <p style={{ color: '#7a7faa', marginTop: 4 }}>
          {topics.length} pripravených tém vo fronte
        </p>
      </div>
      <TopicsClient topics={topics} ages={AGE_CATEGORIES} />
    </div>
  )
}
