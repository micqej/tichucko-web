'use client'
import { useState } from 'react'
import type { Story } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import Link from 'next/link'

const LENGTH_LABELS: Record<number, string> = { 2: 'Krátka', 4: 'Stredná', 6: 'Dlhá' }

export default function StoriesClient({ initialStories }: { initialStories: Story[] }) {
  const [stories, setStories] = useState(initialStories)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filterAge, setFilterAge] = useState('all')

  const filtered = filterAge === 'all' ? stories : stories.filter(s => s.age_id === filterAge)

  async function deleteStory(id: string) {
    if (!confirm('Vymazať rozprávku? Táto akcia sa nedá vrátiť.')) return
    setDeleting(id)
    await fetch(`/api/admin/stories?id=${id}`, { method: 'DELETE' })
    setStories(s => s.filter(x => x.id !== id))
    setDeleting(null)
  }

  async function toggleStatus(story: Story) {
    const newStatus = story.status === 'published' ? 'draft' : 'published'
    await fetch('/api/admin/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story.id, status: newStatus }),
    })
    setStories(s => s.map(x => x.id === story.id ? { ...x, status: newStatus } : x))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterAge('all')} style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: filterAge === 'all' ? '#c89bff' : 'rgba(255,255,255,.08)', color: filterAge === 'all' ? '#1f2247' : '#cdc7e0',
          }}>Všetky ({stories.length})</button>
          {AGE_CATEGORIES.map(a => {
            const cnt = stories.filter(s => s.age_id === a.id).length
            return (
              <button key={a.id} onClick={() => setFilterAge(a.id)} style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: filterAge === a.id ? a.color : 'rgba(255,255,255,.08)',
                color: filterAge === a.id ? '#fff' : '#cdc7e0',
              }}>{a.emoji} {a.range} ({cnt})</button>
            )
          })}
        </div>
        <Link href="/admin/generate" style={{ padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: '#c89bff', color: '#1f2247', textDecoration: 'none' }}>
          ✨ Generovať novú
        </Link>
      </div>

      <div style={{ background: '#1a1f48', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              {['', 'Názov', 'Vek', 'Dĺžka', 'Stav', 'Dátum', 'Akcie'].map((h, i) => (
                <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#7a7faa', letterSpacing: '.07em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(story => {
              const age = AGE_CATEGORIES.find(a => a.id === story.age_id)
              return (
                <tr key={story.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', opacity: deleting === story.id ? 0.4 : 1, transition: '.2s' }}>
                  <td style={{ padding: '12px 14px', fontSize: 22 }}>{story.emoji}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f6f1e1' }}>{story.title}</div>
                    <div style={{ fontSize: 12, color: '#7a7faa', marginTop: 2 }}>{story.theme}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: (age?.color ?? '#7cc6ff') + '22', color: age?.color ?? '#7cc6ff' }}>
                      {age?.range}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#cdc7e0' }}>
                    {story.minutes} min
                    <div style={{ fontSize: 11, color: '#5a5f8a' }}>{LENGTH_LABELS[story.minutes] ?? ''}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => toggleStatus(story)} style={{
                      fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', letterSpacing: '.05em',
                      background: story.status === 'published' ? '#9be59b22' : '#ffb34722',
                      color: story.status === 'published' ? '#9be59b' : '#ffb347',
                    }}>{story.status === 'published' ? '● Aktívna' : '○ Draft'}</button>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#7a7faa' }}>
                    {new Date(story.published_at).toLocaleDateString('sk-SK')}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <a href={`/rozpravky/${story.id}`} target="_blank" style={{ fontSize: 12, color: '#7cc6ff', fontWeight: 600 }}>Náhľad</a>
                      <button onClick={() => deleteStory(story.id)} disabled={deleting === story.id} style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {deleting === story.id ? '…' : 'Vymazať'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#7a7faa' }}>
            Žiadne rozprávky. <Link href="/admin/generate" style={{ color: '#c89bff' }}>Generovať prvú →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
