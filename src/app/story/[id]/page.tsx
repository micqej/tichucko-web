import { supabase } from '@/lib/supabase'
import type { Story } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Stars from '@/components/Stars'
import StoryPageClient from './StoryPageClient'

type Props = { params: Promise<{ id: string }> }

async function getStory(id: string): Promise<Story | null> {
  const { data } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()
  return data as Story | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const story = await getStory(id)
  if (!story) return { title: 'Rozprávka nenájdená' }
  const age = AGE_CATEGORIES.find(a => a.id === story.age_id)
  return {
    title: `${story.title} — Tichučko`,
    description: `${age?.range} · ${story.minutes} min · ${story.theme}`,
    openGraph: {
      title: story.title,
      description: story.theme,
      type: 'article',
    },
  }
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params
  const story = await getStory(id)
  if (!story) notFound()

  return (
    <>
      <Stars />
      <Nav />
      <StoryPageClient story={story} />
      <footer style={{
        padding: '24px 28px', textAlign: 'center', color: 'var(--ink-soft)',
        fontSize: 14, borderTop: '1px solid rgba(31,34,71,.08)', position: 'relative', zIndex: 1,
      }}>
        <a href="/" style={{ fontWeight: 700, color: 'var(--ink)' }}>← Späť na Tichučko</a>
        {' · '}
        Tichučko © {new Date().getFullYear()}
      </footer>
    </>
  )
}
