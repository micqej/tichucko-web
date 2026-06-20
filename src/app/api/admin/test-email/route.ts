import type { NextRequest } from 'next/server'
import { sendTestEmail } from '@/lib/email'

// Pošle testovací e-mail cez vybraného providera (smtp/resend). Chránené proxy.ts.
export async function POST(req: NextRequest) {
  const { provider, to } = (await req.json()) as { provider: 'smtp' | 'resend'; to?: string }
  if (provider !== 'smtp' && provider !== 'resend') {
    return Response.json({ error: 'Neplatný provider.' }, { status: 400 })
  }
  try {
    const recipient = await sendTestEmail(provider, to)
    console.log(`[test-email] ${provider} → ${recipient}`)
    return Response.json({ ok: true, to: recipient })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[test-email] ${provider} failed:`, msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
