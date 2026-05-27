'use client'
import { useState } from 'react'
import type { AgeCategory } from '@/lib/types'
import AgeCard from './AgeCard'

interface Props {
  ages: AgeCategory[]
  counts: Record<string, number>
}

export default function AgesClient({ ages, counts }: Props) {
  const [active, setActive] = useState<string | null>(null)

  function handleClick(id: string) {
    setActive(prev => prev === id ? null : id)
    // scroll to stories
    setTimeout(() => {
      document.getElementById('rozpravky')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    // Dispatch custom event so StoriesSection can react
    window.dispatchEvent(new CustomEvent('tichucko:filter', { detail: { ageId: id === active ? null : id } }))
  }

  return (
    <section id="vekove" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 64px' }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 'clamp(28px,3.4vw,42px)', fontWeight: 900, color: 'var(--ink)' }}>Rozprávky podľa veku</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8, maxWidth: 520 }}>
            Každá hladina má svoj rytmus, dĺžku a slovnú zásobu — aby dieťatku presne sedela.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 18 }}>
          {ages.map(age => (
            <AgeCard
              key={age.id}
              age={age}
              count={counts[age.id] ?? 0}
              active={active === age.id}
              onClick={() => handleClick(age.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
