'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Story } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'

interface Props {
  story: Story
  onClose: () => void
}

export default function Reader({ story, onClose }: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = story.pages.length + 1 // +1 for cover
  const touchRef = useRef<number | null>(null)
  const age = AGE_CATEGORIES.find(a => a.id === story.age_id)

  const goNext = useCallback(() => setCurrentPage(p => Math.min(p + 1, totalPages - 1)), [totalPages])
  const goPrev = useCallback(() => setCurrentPage(p => Math.max(p - 1, 0)), [])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function onTouchStart(e: React.TouchEvent) { touchRef.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchRef.current === null) return
    const dx = e.changedTouches[0].clientX - touchRef.current
    if (Math.abs(dx) > 40) dx < 0 ? goNext() : goPrev()
    touchRef.current = null
  }

  const pages = [
    { type: 'cover' as const },
    ...story.pages,
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'radial-gradient(1200px 800px at 50% -20%, #2a1d5c 0%, #0c1740 60%, #050926 100%)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadein .4s ease',
        color: '#f6f1e1',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
    >
      {/* Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        background: 'rgba(0,0,0,.15)', backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 28 }}>{story.emoji}</span>
        <div>
          <h4 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: '#f6f1e1', margin: 0 }}>{story.title}</h4>
          <div style={{ color: '#cdc7e0', fontSize: 13, fontWeight: 600 }}>{age?.range} · {story.minutes} min na čítanie</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Zavrieť"
          style={{
            marginLeft: 'auto', width: 42, height: 42, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            background: 'rgba(255,255,255,.08)', color: '#fff',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)' }}
        >✕</button>
      </div>

      {/* Book stage */}
      <div
        style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '20px 80px', position: 'relative', overflow: 'hidden' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Prev arrow */}
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          aria-label="Predchádzajúca stránka"
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(10px)',
            display: 'grid', placeItems: 'center', color: '#fff',
            opacity: currentPage === 0 ? .3 : 1, cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            zIndex: 10, transition: '.2s',
          }}
        >←</button>

        {/* Page */}
        <div
          style={{
            width: '100%', maxWidth: 820,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            borderRadius: 20,
            background: 'linear-gradient(180deg,#fffaf2,#f4e7d5)',
            color: '#1f2247',
            boxShadow: '0 30px 80px -30px rgba(0,0,0,.6), inset 0 0 0 1px rgba(31,34,71,.08)',
            padding: 'clamp(28px,5vw,56px)',
            animation: 'fadein .35s ease',
            position: 'relative',
          }}
          key={currentPage}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x > rect.width * 0.6) goNext()
            else if (x < rect.width * 0.4) goPrev()
          }}
        >
          <PageContent page={pages[currentPage]} story={story} pageNum={currentPage} total={totalPages} />

          {/* page number */}
          <div style={{ position: 'absolute', bottom: 16, right: 20, fontSize: 12, color: '#9a8fa8', fontWeight: 700, letterSpacing: '.08em' }}>
            {currentPage === 0 ? 'otvor →' : `— ${currentPage} / ${totalPages - 1} —`}
          </div>
        </div>

        {/* Next arrow */}
        <button
          onClick={goNext}
          disabled={currentPage === totalPages - 1}
          aria-label="Ďalšia stránka"
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(10px)',
            display: 'grid', placeItems: 'center', color: '#fff',
            opacity: currentPage === totalPages - 1 ? .3 : 1,
            cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
            zIndex: 10, transition: '.2s',
          }}
        >→</button>
      </div>

      {/* Progress dots */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center', padding: '12px 16px',
        background: 'rgba(0,0,0,.2)', borderTop: '1px solid rgba(255,255,255,.06)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            aria-label={`Stránka ${i + 1}`}
            style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
              background: i === currentPage ? '#ffd47a' : 'rgba(255,255,255,.25)',
              transform: i === currentPage ? 'scale(1.4)' : 'scale(1)',
              transition: '.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Strip AI-generated "Kapitola 1:" / "Chapter 2:" prefixes from headings
function cleanHeading(h: string): string {
  return h.replace(/^(?:kapitola|chapter)\s*\d+\s*[:\-–—]?\s*/i, '').trim() || h
}

function PageContent({ page, story, pageNum, total }: {
  page: { type: 'cover' } | Story['pages'][number]
  story: Story
  pageNum: number
  total: number
}) {
  if (page.type === 'cover') {
    return (
      <div style={{
        background: `linear-gradient(150deg, ${story.cover_a}, ${story.cover_b})`,
        borderRadius: 14, margin: '-56px -56px 0', padding: '48px 32px 40px',
        color: '#fff', textAlign: 'center',
        minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 'clamp(80px,15vw,130px)', filter: 'drop-shadow(0 16px 30px rgba(0,0,0,.3))', marginBottom: 16 }}>
          {story.emoji}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(28px,5vw,50px)',
          fontWeight: 900, lineHeight: 1.05, textShadow: '0 2px 16px rgba(0,0,0,.15)',
          color: '#fff',
        }}>{story.title}</h2>
        <div style={{
          marginTop: 14, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
          fontSize: 13, background: 'rgba(255,255,255,.25)', padding: '8px 16px',
          borderRadius: 999, backdropFilter: 'blur(6px)',
        }}>
          {AGE_CATEGORIES.find(a => a.id === story.age_id)?.range} · {story.minutes} min
        </div>
        {story.author && (
          <p style={{ marginTop: 20, fontStyle: 'italic', opacity: .9, fontSize: 15 }}>{story.author}</p>
        )}
      </div>
    )
  }

  if (page.type === 'end') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 'clamp(50px,10vw,80px)', marginBottom: 20 }}>{page.art}</div>
        <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, color: '#5a3a8a', marginBottom: 16 }}>Koniec</h3>
        <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: '#2a2c52', maxWidth: 500, lineHeight: 1.7 }}>{page.moral}</p>
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, marginBottom: 18, color: '#5a3a8a' }}>
        {cleanHeading(page.heading ?? '')}
      </h3>
      <div>
        {page.body?.map((para, i) => (
          <div key={i}>
            <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', lineHeight: 1.75, color: '#2a2c52', margin: '0 0 14px' }}>{para}</p>
            {i < (page.body?.length ?? 0) - 1 && (
              <div style={{ textAlign: 'center', fontSize: 20, margin: '8px 0', opacity: .5 }}>∽</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
