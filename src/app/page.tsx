import { supabase } from '@/lib/supabase'
import { AGE_CATEGORIES } from '@/lib/data'
import type { Story } from '@/lib/types'
import Nav from '@/components/Nav'
import Stars from '@/components/Stars'
import StoriesSection from '@/components/StoriesSection'
import ValuesSection from '@/components/ValuesSection'
import SubscribeSection from '@/components/SubscribeSection'
import AgesClient from '@/components/AgesClient'
import HeroButtons from '@/components/HeroButtons'

async function getStories(): Promise<Story[]> {
  try {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(30)
    return (data ?? []) as Story[]
  } catch {
    return []
  }
}

export default async function Home() {
  const stories = await getStories()
  const ageCounts = Object.fromEntries(
    AGE_CATEGORIES.map(a => [a.id, stories.filter(s => s.age_id === a.id).length])
  )

  return (
    <>
      <Stars />
      <Nav />

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px,8vw,96px) 28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 48, alignItems: 'center' }}
          className="hero-grid">
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,107,157,.12)', color: '#c4257a',
              padding: '8px 16px', borderRadius: 999, fontWeight: 700,
              fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase',
            }}>✨ Tichučko rozprávky</span>

            <h1 style={{ fontSize: 'clamp(40px,6vw,76px)', lineHeight: 1.02, fontWeight: 900, margin: '20px 0 18px', color: 'var(--ink)' }}>
              Krátke rozprávky{' '}
              <span style={{
                background: 'linear-gradient(90deg, #ff6b9d, #ffb347 50%, #c89bff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', fontStyle: 'italic',
              }}>na dobrú noc</span>{' '}
              pre veľké srdiečka.
            </h1>

            <p style={{ fontSize: 19, color: 'var(--ink-soft)', maxWidth: 520, lineHeight: 1.55 }}>
              Pre každý vek inú — od prvých uspávaniek pre bábätká až po dobrodružstvá pre školákov.
              Každá rozprávka v Tichučku trvá iba <strong>3 až 5 minút</strong> a učí dieťa niečomu krásnemu:
              dôvere, odvahe, úcte a láske k sebe samému.
            </p>

            <HeroButtons />
          </div>

          {/* Hero art */}
          <div style={{ position: 'relative', aspectRatio: '1', maxWidth: 480, margin: '0 auto', width: '100%' }} aria-hidden>
            <div style={{
              position: 'absolute', right: '8%', bottom: '12%', width: '60%', aspectRatio: '1',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #fff7d6, #ffd97a 60%, #ffb347)',
              boxShadow: '0 30px 80px -20px rgba(255,179,71,.5), inset -20px -30px 60px rgba(0,0,0,.08)',
              animation: 'float 8s ease-in-out infinite',
            }} />
            {[
              { left: '14%', top: '22%', size: 22, delay: '0s', char: '✦' },
              { left: '80%', top: '60%', size: 18, delay: '-1s', char: '✧' },
              { left: '42%', top: '8%', size: 14, delay: '-2s', char: '✦' },
              { left: '24%', top: '70%', size: 16, delay: '-.5s', char: '✧' },
            ].map((s, i) => (
              <span key={i} style={{
                position: 'absolute', left: s.left, top: s.top,
                fontSize: s.size, color: '#fff',
                animation: `twinkle 2.4s ease-in-out infinite`,
                animationDelay: s.delay,
              }}>{s.char}</span>
            ))}
          </div>
        </div>
      </section>

      {/* AGE CATEGORIES */}
      <AgesClient ages={AGE_CATEGORIES} counts={ageCounts} />

      {/* STORIES */}
      <StoriesSection stories={stories} />

      {/* VALUES */}
      <ValuesSection />

      {/* SUBSCRIBE */}
      <SubscribeSection />

      {/* FOOTER */}
      <footer id="o-nas" style={{
        marginTop: 20, padding: '36px 28px 28px', textAlign: 'center',
        color: 'var(--ink-soft)', fontSize: 14,
        borderTop: '1px solid rgba(31,34,71,.08)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ margin: 0 }}>
            Tichučko © {new Date().getFullYear()} — Rozprávky pre najmenších i tých väčších.
            Vyrobené s láskou pre rodičov, ktorí veria, že večerné slová formujú srdce. 💛
          </p>
        </div>
      </footer>

      <style>{`
        @media (max-width: 880px) { .hero-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  )
}
