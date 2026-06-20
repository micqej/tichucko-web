import { supabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail, sendConfirmEmail, notifyNewSubscriber } from '@/lib/email'
import { getSetting } from '@/lib/settings'
import { AGE_CATEGORIES } from '@/lib/data'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, age_preference } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Neplatná e-mailová adresa.' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const doubleOptin = (await getSetting('double_optin')) === 'on'
  const ageLabel = AGE_CATEGORIES.find(a => a.id === age_preference)?.range ?? 'všetky veky'

  // already exists?
  const { data: existing } = await db
    .from('subscribers')
    .select('id, active, confirm_token, unsubscribe_token')
    .eq('email', email)
    .single()

  if (existing) {
    if (existing.active) {
      return Response.json({ error: 'Táto adresa je už prihlásená.' }, { status: 409 })
    }
    if (doubleOptin) {
      await db.from('subscribers').update({ age_preference, confirmed: false }).eq('id', existing.id)
      try { await sendConfirmEmail(email, existing.confirm_token) } catch { /* ignore */ }
      return Response.json({ message: 'Skoro hotovo! Potvrď, prosím, odber v e-maile, ktorý sme ti poslali. 📩' })
    }
    await db.from('subscribers').update({ active: true, confirmed: true, age_preference }).eq('id', existing.id)
    const { count } = await db.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true)
    try { await notifyNewSubscriber(email, ageLabel, count ?? 0) } catch { /* ignore */ }
    return Response.json({ message: 'Odber bol znova aktivovaný. 🌙' })
  }

  // new subscriber — double opt-in keeps them inactive until they confirm
  const { data, error } = await db
    .from('subscribers')
    .insert({ email, age_preference: age_preference ?? 'all', active: !doubleOptin, confirmed: !doubleOptin })
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Uloženie zlyhalo. Skúste znova.' }, { status: 500 })
  }

  if (doubleOptin) {
    try { await sendConfirmEmail(email, data.confirm_token) } catch { /* ignore */ }
    return Response.json({ message: 'Skoro hotovo! Potvrď, prosím, odber v e-maile, ktorý sme ti poslali. 📩' })
  }

  // single opt-in: welcome the subscriber + tell the admin right away
  const { count } = await db.from('subscribers').select('id', { count: 'exact', head: true }).eq('active', true)
  try { await sendWelcomeEmail(email, data.unsubscribe_token) } catch { /* ignore */ }
  try { await notifyNewSubscriber(email, ageLabel, count ?? 0) } catch { /* ignore */ }

  return Response.json({ message: 'Prihlásenie sa podarilo! Vitaj v Tichučku. 🌙' })
}
