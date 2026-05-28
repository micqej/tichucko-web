'use client'
import { useState, useEffect } from 'react'
import type { Story } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import StoryCard from './StoryCard'
import Reader from './Reader'

interface Props {
  stories: Story[]
  initialAgeFilter?: string | null
  showAllLink?: string
}

export default function StoriesSection({ stories, initialAgeFilter, showAllLink }: Props) {
  const [ageFilter, setAgeFilter] = useState<string | null>(initialAgeFilter ?? null)
  const [openStory, setOpenStory] = useState<Story | null>(null)

  // Listen for filter events from AgesClient
  useEffect(() => {
    function onFilter(e: Event) {
      const detail = (e as CustomEvent<{ ageId: string | null }>).detail
      setAgeFilter(detail.ageId)
    }
    window.addEventListener('tichucko:filter', onFilter)
    return () => window.removeEventListener('tichucko:filter', onFilter)
  }, [])

  const filtered = ageFilter ? stories.filter(s => s.age_id === ageFilter) : stories

  return (
    <section id="rozpravky" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(28px,3.4vw,42px)', fontWeight: 900, color: 'var(--ink)' }}>Najnovšie rozprávky</h2>
            <p style={{ color: 'var(--ink-soft)', marginTop: 8, maxWidth: 520 }}>Kliknite na rozprávku a otvorí sa vám kniha s otáčaním stránok.</p>
          </div>
          {showAllLink && (
            <a href={showAllLink} style={{
              padding: '11px 22px', borderRadius: 999, fontWeight: 700, fontSize: 15,
              background: 'var(--ink)', color: 'var(--bg)', textDecoration: 'none',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Všetky rozprávky →
            </a>
          )}
        </div>

        {/* Age filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          <button
            onClick={() => setAgeFilter(null)}
            style={{
              padding: '9px 18px', borderRadius: 999, fontWeight: 700, fontSize: 14,
              background: ageFilter === null ? 'var(--ink)' : 'rgba(31,34,71,.07)',
              color: ageFilter === null ? 'var(--bg)' : 'var(--ink-soft)',
              transition: '.15s', border: 'none', cursor: 'pointer',
            }}
          >Všetky</button>
          {AGE_CATEGORIES.map(age => (
            <button
              key={age.id}
              onClick={() => setAgeFilter(age.id)}
              style={{
                padding: '9px 18px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: ageFilter === age.id ? age.color : 'rgba(31,34,71,.07)',
                color: ageFilter === age.id ? '#fff' : 'var(--ink-soft)',
                transition: '.15s', border: 'none', cursor: 'pointer',
              }}
            >{age.emoji} {age.range}</button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-soft)' }}>
            <div style={{ fontSize: 48 }}>🌙</div>
            <p style={{ marginTop: 16, fontSize: 18 }}>Pre túto vekovú skupinu ešte nemáme rozprávky. Čoskoro pribudnú!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 22,
          }}>
            {filtered.map(story => (
              <StoryCard key={story.id} story={story} onOpen={setOpenStory} />
            ))}
          </div>
        )}
      </div>

      {/* Reader modal */}
      {openStory && <Reader story={openStory} onClose={() => setOpenStory(null)} />}
    </section>
  )
}
