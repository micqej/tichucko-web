import { Resend } from 'resend'
import type { Story } from './types'
import { getApiKey, getSetting } from './settings'
import { createSmtpTransport, type SmtpConfig } from './smtp'
import {
  storyEmailHtml, welcomeHtml, confirmHtml,
  adminNewSubscriberHtml, adminApprovalHtml, adminReportHtml,
} from './email-templates'

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://tichucko.sk'
const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL ?? 'michal.mikula1@gmail.com'

async function getSmtpConfig(): Promise<SmtpConfig> {
  const [host, portStr, user, password, from] = await Promise.all([
    getSetting('smtp_host'), getSetting('smtp_port'), getSetting('smtp_user'),
    getSetting('smtp_password'), getSetting('smtp_from'),
  ])
  return {
    host: host ?? '',
    port: parseInt(portStr ?? '587', 10),
    user: user ?? '',
    password: password ?? '',
    from: from ?? 'Tichučko <rozpravky@tichucko.sk>',
  }
}

async function getProvider() {
  return (await getSetting('email_provider')) ?? 'smtp'
}

async function getFrom() {
  return (await getSetting('smtp_from')) ?? process.env.RESEND_FROM ?? 'Tichučko <rozpravky@tichucko.sk>'
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
}

interface RawMail { to: string; subject: string; html: string; headers?: Record<string, string> }

/** Pošle testovací email cez KONKRÉTNEHO providera (nezávisle od aktívneho). Vyhodí chybu pri zlyhaní. */
export async function sendTestEmail(provider: 'smtp' | 'resend', to?: string) {
  const recipient = to || ADMIN_EMAIL()
  const subject = `🧪 Test ${provider.toUpperCase()} — Tichučko`
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:28px;color:#1f2247">
    <h1 style="font-size:22px">🌙 Test odoslania funguje!</h1>
    <p style="font-size:15px;color:#4a4f7a">Toto je testovací e-mail z Tichučka cez <strong>${provider.toUpperCase()}</strong>.
    Ak ho čítaš, odosielanie je správne nastavené.</p>
    <p style="font-size:13px;color:#9a9ab0">Čas: ${new Date().toLocaleString('sk-SK')}</p>
  </div>`

  if (provider === 'smtp') {
    const cfg = await getSmtpConfig()
    if (!cfg.host || !cfg.user) throw new Error('SMTP nie je nastavené (host/používateľ).')
    await createSmtpTransport(cfg).sendMail({ from: cfg.from, to: recipient, subject, html })
  } else {
    const key = await getApiKey('resend_api_key', 'RESEND_API_KEY')
    if (!key) throw new Error('Resend API kľúč nie je nastavený.')
    const { error } = await new Resend(key).emails.send({ from: await getFrom(), to: recipient, subject, html })
    if (error) throw new Error(typeof error === 'string' ? error : (error.message || 'Resend chyba'))
  }
  return recipient
}

/** Send one email via the active provider (SMTP or Resend). */
export async function rawSend(mail: RawMail) {
  if ((await getProvider()) === 'smtp') {
    const cfg = await getSmtpConfig()
    await createSmtpTransport(cfg).sendMail({
      from: cfg.from, to: mail.to, subject: mail.subject, html: mail.html, headers: mail.headers,
    })
  } else {
    const resend = new Resend(await getApiKey('resend_api_key', 'RESEND_API_KEY'))
    await resend.emails.send({
      from: await getFrom(), to: mail.to, subject: mail.subject, html: mail.html, headers: mail.headers,
    })
  }
}

/** Daily story → all matching subscribers (per-recipient unsub token + List-Unsubscribe header). */
export async function sendDailyStory(
  story: Story,
  subscribers: Array<{ email: string; unsubscribe_token: string }>,
) {
  if (subscribers.length === 0) return { sent: 0 }

  const storyUrl = `${APP_URL()}/rozpravky/${story.id}`
  const firstPage = story.pages.find(p => p.type === 'chapter')
  const preview = firstPage?.body?.[0]?.slice(0, 120) ?? ''
  const subject = `🌙 ${story.title} — rozprávka na dobrú noc`

  const build = (token: string) => storyEmailHtml({
    story, storyUrl, preview,
    unsubUrl: `${APP_URL()}/api/unsubscribe?token=${token}`,
    reactBase: `${APP_URL()}/api/react?story=${story.id}&v=`,
    pixelUrl: `${APP_URL()}/api/track/open?s=${story.id}`,
  })
  const headers = (token: string) => ({
    'List-Unsubscribe': `<${APP_URL()}/api/unsubscribe?token=${token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  })

  if ((await getProvider()) === 'smtp') {
    const cfg = await getSmtpConfig()
    const tx = createSmtpTransport(cfg)
    let sent = 0
    for (const sub of subscribers) {
      try {
        await tx.sendMail({
          from: cfg.from, to: sub.email, subject,
          html: build(sub.unsubscribe_token), headers: headers(sub.unsubscribe_token),
        })
        sent++
      } catch (err) {
        console.error(`[SMTP] Failed to send to ${sub.email}:`, err)
      }
    }
    return { sent }
  }

  // Resend batch (max 50/req)
  const resend = new Resend(await getApiKey('resend_api_key', 'RESEND_API_KEY'))
  const from = await getFrom()
  let sent = 0
  for (const chunk of chunkArray(subscribers, 50)) {
    await resend.batch.send(chunk.map(sub => ({
      from, to: sub.email, subject,
      html: build(sub.unsubscribe_token), headers: headers(sub.unsubscribe_token),
    })))
    sent += chunk.length
  }
  return { sent }
}

export async function sendWelcomeEmail(email: string, unsubscribeToken: string) {
  await rawSend({
    to: email,
    subject: '🌙 Vitaj v Tichučku — každý večer nová rozprávka',
    html: welcomeHtml(`${APP_URL()}/api/unsubscribe?token=${unsubscribeToken}`),
  })
}

export async function sendConfirmEmail(email: string, confirmToken: string) {
  await rawSend({
    to: email,
    subject: '🌙 Potvrď svoj odber Tichučka',
    html: confirmHtml(`${APP_URL()}/api/confirm?token=${confirmToken}`),
  })
}

export async function notifyNewSubscriber(email: string, ageLabel: string, total: number) {
  await rawSend({
    to: ADMIN_EMAIL(),
    subject: `🎉 Nový odberateľ Tichučka: ${email}`,
    html: adminNewSubscriberHtml(email, ageLabel, total),
  })
}

export async function sendDailyReport(rows: Array<{ ageLabel: string; title: string; sent: number }>, totalSent: number) {
  await rawSend({
    to: ADMIN_EMAIL(),
    subject: `✉️ Tichučko report — ${totalSent} odoslaných`,
    html: adminReportHtml(rows, totalSent),
  })
}

export async function sendApprovalEmail(items: Parameters<typeof adminApprovalHtml>[0]) {
  await rawSend({
    to: ADMIN_EMAIL(),
    subject: '🌙 Dnešné rozprávky čakajú na schválenie',
    html: adminApprovalHtml(items),
  })
}
