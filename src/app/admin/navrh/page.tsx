import { AGE_CATEGORIES } from '@/lib/data'
import { getSetting } from '@/lib/settings'
import { supabaseAdmin } from '@/lib/supabase'
import type { Topic } from '@/lib/types'
import ProposeClient from './ProposeClient'

export const dynamic = 'force-dynamic'

export default async function NavrhPage() {
  const autoApprove = (await getSetting('auto_approve')) === 'on'
  const { data } = await supabaseAdmin().from('topics').select('*').eq('used', false).order('created_at', { ascending: false })
  const queue = (data ?? []) as Topic[]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>🎬 Štúdio</h1>
        <p style={{ color: '#7a7faa', marginTop: 4 }}>
          Tri kroky: <strong>1.</strong> zadáš počet a roky → AI navrhne hlboké témy (z hodnôt veku + podľa kalendára) ·
          <strong> 2.</strong> schváliš · <strong>3.</strong> vygeneruješ rozprávky (alebo to necháš na ranný worker).
        </p>
      </div>
      <ProposeClient ages={AGE_CATEGORIES} autoApprove={autoApprove} queue={queue} />
    </div>
  )
}
