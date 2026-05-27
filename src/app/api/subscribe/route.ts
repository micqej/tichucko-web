import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, age_preference } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Neplatná e-mailová adresa.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Check if already exists
  const { data: existing } = await db
    .from('subscribers')
    .select('id, active')
    .eq('email', email)
    .single()

  if (existing) {
    if (existing.active) {
      return Response.json({ error: 'Táto adresa je už prihlásená.' }, { status: 409 })
    }
    // Reactivate
    await db.from('subscribers').update({ active: true, age_preference }).eq('id', existing.id)
    return Response.json({ message: 'Odber bol znova aktivovaný. 🌙' })
  }

  const { data, error } = await db
    .from('subscribers')
    .insert({ email, age_preference: age_preference ?? 'all' })
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Uloženie zlyhalo. Skúste znova.' }, { status: 500 })
  }

  // Send welcome email (non-blocking)
  try {
    await sendWelcomeEmail(email, data.unsubscribe_token)
  } catch {
    // don't fail the request if email fails
  }

  return Response.json({ message: 'Prihlásenie sa podarilo! Vitaj v Tichučku. 🌙' })
}
