'use client'
import { useState } from 'react'
import type { Story } from '@/lib/types'
import Reader from '@/components/Reader'

export default function StoryPageClient({ story }: { story: Story }) {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: 72 }}>{story.emoji}</div>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 36, fontWeight: 900, color: 'var(--ink)', textAlign: 'center', margin: 0 }}>
          {story.title}
        </h1>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: '14px 28px', borderRadius: 999, fontWeight: 700, fontSize: 16,
            background: 'var(--ink)', color: 'var(--bg)',
            boxShadow: 'var(--shadow)', cursor: 'pointer',
          }}
        >📖 Čítať rozprávku</button>
        <a href="/" style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600 }}>← Všetky rozprávky</a>
      </div>
    )
  }

  return <Reader story={story} onClose={() => setOpen(false)} />
}
