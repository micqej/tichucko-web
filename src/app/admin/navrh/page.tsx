import { AGE_CATEGORIES } from '@/lib/data'
import { getSetting } from '@/lib/settings'
import ProposeClient from './ProposeClient'

export const dynamic = 'force-dynamic'

export default async function NavrhPage() {
  const autoApprove = (await getSetting('auto_approve')) === 'on'
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 32, fontWeight: 900 }}>✨ Auto-návrh tém</h1>
        <p style={{ color: '#7a7faa', marginTop: 4 }}>
          Zadaj počet a roky → AI navrhne hlboké témy (z hodnôt veku + podľa kalendára) → ty len schváliš.
          Schválené idú do fronty a každý deň sa z nich automaticky robia rozprávky.
        </p>
      </div>
      <ProposeClient ages={AGE_CATEGORIES} autoApprove={autoApprove} />
    </div>
  )
}
