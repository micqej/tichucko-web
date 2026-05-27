import type { Story } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'

interface Props {
  story: Story
  onOpen: (story: Story) => void
}

export default function StoryCard({ story, onOpen }: Props) {
  const age = AGE_CATEGORIES.find(a => a.id === story.age_id)

  return (
    <article
      onClick={() => onOpen(story)}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
        background: 'var(--paper)', border: '1px solid var(--paper-edge)',
        boxShadow: 'var(--shadow)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform .25s ease, box-shadow .25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = '0 28px 60px -20px rgba(31,34,71,.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}
    >
      {/* Cover */}
      <div style={{
        aspectRatio: '4/3',
        background: `linear-gradient(135deg, ${story.cover_a}, ${story.cover_b})`,
        display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <span style={{
          position: 'absolute', top: 14, left: 14,
          background: 'rgba(255,255,255,.9)', color: 'var(--ink)',
          padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800,
          backdropFilter: 'blur(8px)',
        }}>{age?.range}</span>
        <span style={{ fontSize: 96, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.18))', animation: 'float 6s ease-in-out infinite' }}>
          {story.emoji}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 22px 24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
          {story.theme}
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 900, margin: '8px 0 6px', lineHeight: 1.2, color: 'var(--ink)' }}>
          {story.title}
        </h3>
        {story.pages[0]?.type === 'chapter' && story.pages[0].body?.[0] && (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 12px', flexGrow: 1 }}>
            {story.pages[0].body[0].slice(0, 110)}…
          </p>
        )}
        <div style={{ display: 'flex', gap: 14, color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600, marginTop: 'auto' }}>
          <span>⏱️ {story.minutes} min</span>
          <span>📖 {story.pages.length} stránok</span>
          {story.generated_by && story.generated_by !== 'manual' && (
            <span style={{ marginLeft: 'auto', fontSize: 11, opacity: .6 }}>✨ AI</span>
          )}
        </div>
      </div>
    </article>
  )
}
