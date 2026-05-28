import { supabase } from '@/lib/supabase'
import type { Story } from '@/lib/types'
import Nav from '@/components/Nav'
import Stars from '@/components/Stars'
import StoriesSection from '@/components/StoriesSection'

async function getAllStories(): Promise<Story[]> {
  try {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    return (data ?? []) as Story[]
  } catch {
    return []
  }
}

export const metadata = {
  title: 'Rozprávky na dobrú noc — Tichučko',
  description: 'Zbierka krátkych rozprávok na dobrú noc pre deti od 0 do 13 rokov. Filtruj podľa veku.',
}

export default async function RozpravkyPage() {
  const stories = await getAllStories()

  return (
    <>
      <Stars />
      <Nav />

      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 28px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, color: 'var(--ink)', margin: '0 0 10px' }}>
          Rozprávky na dobrú noc
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 18, margin: 0 }}>
          {stories.length} rozprávok · filtruj podľa veku dieťatka
        </p>
      </section>

      <StoriesSection stories={stories} />

      <footer style={{
        marginTop: 20, padding: '36px 28px 28px', textAlign: 'center',
        color: 'var(--ink-soft)', fontSize: 14,
        borderTop: '1px solid rgba(31,34,71,.08)',
        position: 'relative', zIndex: 1,
      }}>
        <a href="/" style={{ fontWeight: 700, color: 'var(--ink)' }}>← Späť na Tichučko</a>
        {' · '}
        © {new Date().getFullYear()}
      </footer>
    </>
  )
}
