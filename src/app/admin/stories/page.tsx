import { supabaseAdmin } from '@/lib/supabase'
import type { Story } from '@/lib/types'
import StoriesClient from './StoriesClient'

export default async function AdminStoriesPage() {
  const { data } = await supabaseAdmin()
    .from('stories')
    .select('*')
    .order('published_at', { ascending: false })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>📖 Rozprávky</h1>
        <p style={{ color: '#7a7faa', marginTop: 4 }}>{(data ?? []).length} rozprávok celkovo</p>
      </div>
      <StoriesClient initialStories={(data ?? []) as Story[]} />
    </div>
  )
}
