import { supabaseAdmin } from '@/lib/supabase'
import type { Story } from '@/lib/types'
import { AGE_CATEGORIES } from '@/lib/data'
import Link from 'next/link'

export default async function AdminStoriesPage() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('stories')
    .select('*')
    .order('published_at', { ascending: false })
  const stories: Story[] = data ?? []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>Rozprávky</h1>
          <p style={{ color: '#7a7faa', marginTop: 4 }}>{stories.length} rozprávok celkovo</p>
        </div>
        <Link href="/admin/generate" style={{
          padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: '#c89bff', color: '#1f2247', textDecoration: 'none',
        }}>✨ Generovať novú</Link>
      </div>

      <div style={{ background: '#1a1f48', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              {['', 'Názov', 'Vek', 'Téma', 'Stav', 'Dátum', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#7a7faa', letterSpacing: '.07em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stories.map(story => {
              const age = AGE_CATEGORIES.find(a => a.id === story.age_id)
              return (
                <tr key={story.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '12px 14px', fontSize: 24 }}>{story.emoji}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f6f1e1' }}>{story.title}</div>
                    <div style={{ fontSize: 12, color: '#7a7faa', marginTop: 2 }}>{story.minutes} min · {story.pages.length} str.</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: (age?.color ?? '#7cc6ff') + '22', color: age?.color ?? '#7cc6ff' }}>
                      {age?.range}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#cdc7e0', maxWidth: 200 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{story.theme}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, letterSpacing: '.05em',
                      background: story.status === 'published' ? '#9be59b22' : '#ffb34722',
                      color: story.status === 'published' ? '#9be59b' : '#ffb347',
                    }}>{story.status === 'published' ? '● Aktívna' : '○ Draft'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#7a7faa' }}>
                    {new Date(story.published_at).toLocaleDateString('sk-SK')}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`/story/${story.id}`} target="_blank" style={{ fontSize: 12, color: '#7cc6ff', fontWeight: 600 }}>Náhľad</a>
                      <DeleteButton storyId={story.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {stories.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#7a7faa' }}>
            Zatiaľ žiadne rozprávky. <Link href="/admin/generate" style={{ color: '#c89bff' }}>Generovať prvú →</Link>
          </div>
        )}
      </div>
    </div>
  )
}

function DeleteButton({ storyId }: { storyId: string }) {
  return (
    <form action={`/api/admin/stories?id=${storyId}`} method="POST">
      <input type="hidden" name="_method" value="DELETE" />
      <button type="submit" style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={e => { if (!confirm('Vymazať rozprávku?')) e.preventDefault() }}
      >Vymazať</button>
    </form>
  )
}
