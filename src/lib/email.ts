import { Resend } from 'resend'
import type { Story } from './types'
import { AGE_CATEGORIES } from './data'
import { getApiKey, getSetting } from './settings'
import { sendDailyStorySMTP, sendWelcomeEmailSMTP } from './smtp'

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://tichucko.sk'

async function getSmtpConfig() {
  const [host, portStr, user, password, from] = await Promise.all([
    getSetting('smtp_host'),
    getSetting('smtp_port'),
    getSetting('smtp_user'),
    getSetting('smtp_password'),
    getSetting('smtp_from'),
  ])
  return {
    host: host ?? '',
    port: parseInt(portStr ?? '587', 10),
    user: user ?? '',
    password: password ?? '',
    from: from ?? 'Tichučko <rozpravky@tichucko.sk>',
  }
}

export async function sendDailyStory(story: Story, subscribers: Array<{ email: string; unsubscribe_token: string }>) {
  if (subscribers.length === 0) return { sent: 0 }

  const provider = (await getSetting('email_provider')) ?? 'smtp'

  if (provider === 'smtp') {
    const cfg = await getSmtpConfig()
    return sendDailyStorySMTP(story, subscribers, cfg)
  }

  // Resend path
  const resendKey = await getApiKey('resend_api_key', 'RESEND_API_KEY')
  const fromAddr = (await getSetting('smtp_from')) ?? process.env.RESEND_FROM ?? 'Tichučko <rozpravky@tichucko.sk>'
  const resend = new Resend(resendKey)

  const age = AGE_CATEGORIES.find(a => a.id === story.age_id)
  const storyUrl = `${APP_URL()}/rozpravky/${story.id}`
  const firstPage = story.pages.find(p => p.type === 'chapter')
  const preview = firstPage?.body?.[0]?.slice(0, 120) ?? ''
  const html = buildEmailHtml({ story, age, storyUrl, preview })

  const chunks = chunkArray(subscribers, 50)
  let sent = 0
  for (const chunk of chunks) {
    await resend.batch.send(
      chunk.map(sub => ({
        from: fromAddr,
        to: sub.email,
        subject: `🌙 ${story.title} — rozprávka na dobrú noc`,
        html,
      }))
    )
    sent += chunk.length
  }
  return { sent }
}

export async function sendWelcomeEmail(email: string, unsubscribeToken: string) {
  const provider = (await getSetting('email_provider')) ?? 'smtp'

  if (provider === 'smtp') {
    const cfg = await getSmtpConfig()
    return sendWelcomeEmailSMTP(email, unsubscribeToken, cfg)
  }

  // Resend
  const resendKey = await getApiKey('resend_api_key', 'RESEND_API_KEY')
  const fromAddr = (await getSetting('smtp_from')) ?? process.env.RESEND_FROM ?? 'Tichučko <rozpravky@tichucko.sk>'
  const unsubUrl = `${APP_URL()}/api/unsubscribe?token=${unsubscribeToken}`
  const resend = new Resend(resendKey)
  await resend.emails.send({
    from: fromAddr,
    to: email,
    subject: '🌙 Vitaj v Tichučku — každý večer nová rozprávka',
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1f2247">
        <h1 style="font-size:28px;margin-bottom:8px">Vitaj v Tichučku! 🌙</h1>
        <p style="font-size:16px;line-height:1.6;color:#4a4f7a">
          Každý večer o <strong>17:00</strong> ti pošleme novú rozprávku šitú na mieru veku tvojho dieťatka.
        </p>
        <p style="font-size:14px;color:#9a9ab0;margin-top:32px">
          Ak si sa prihlásil omylom, <a href="${unsubUrl}" style="color:#c89bff">odhlásiť sa</a>.
        </p>
      </div>
    `,
  })
}

function buildEmailHtml({ story, age, storyUrl, preview }: {
  story: Story
  age: ReturnType<typeof AGE_CATEGORIES.find>
  storyUrl: string
  preview: string
}) {
  const unsubUrl = `${APP_URL()}/api/unsubscribe?email={{email}}`
  return `<!DOCTYPE html>
<html lang="sk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${story.title}</title></head>
<body style="margin:0;padding:0;background:#0e1230;font-family:Georgia,serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:28px">
      <span style="font-size:48px">${story.emoji}</span>
      <h1 style="color:#f6f1e1;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:12px 0 0">Tichučko — rozprávky na dobrú noc</h1>
    </div>
    <div style="background:linear-gradient(150deg,${story.cover_a},${story.cover_b});border-radius:20px;padding:36px 32px;text-align:center;color:#fff">
      <div style="font-size:72px;margin-bottom:16px">${story.emoji}</div>
      <div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.25);display:inline-block;padding:6px 14px;border-radius:999px;margin-bottom:16px">${age?.range ?? ''} · ${story.minutes} min</div>
      <h2 style="font-size:30px;font-weight:900;margin:0 0 14px;line-height:1.1">${story.title}</h2>
      <p style="font-size:16px;line-height:1.6;opacity:.9;margin:0 0 24px">${preview}…</p>
      <a href="${storyUrl}" style="display:inline-block;background:#fff;color:#1f2247;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;text-decoration:none">📖 Čítať rozprávku →</a>
    </div>
    <div style="margin:20px 0;padding:16px 20px;background:rgba(255,255,255,.05);border-radius:12px;color:#cdc7e0;font-size:14px">
      <strong style="color:#f6f1e1">Téma: </strong>${story.theme}
    </div>
    <p style="text-align:center;font-size:12px;color:#5a5f8a;margin-top:24px">
      Tichučko © ${new Date().getFullYear()} · <a href="${unsubUrl}" style="color:#7cc6ff;text-decoration:none">Odhlásiť odber</a>
    </p>
  </div>
</body></html>`
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}
