import { supabaseAdmin } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const exportCsv = req.nextUrl.searchParams.get('export') === 'csv'
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const header = 'email,age_preference,active,subscribed_at\n'
    const rows = (data ?? []).map((s: { email: string; age_preference: string; active: boolean; subscribed_at: string }) =>
      `${s.email},${s.age_preference ?? ''},${s.active},${s.subscribed_at}`
    ).join('\n')
    return new Response(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="subscribers.csv"',
      },
    })
  }

  return Response.json({ subscribers: data ?? [] })
}
