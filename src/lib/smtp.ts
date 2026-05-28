import nodemailer from 'nodemailer'
import type { Story } from './types'
import { AGE_CATEGORIES } from './data'

interface SmtpConfig {
  host: string
  port: number
  user: string
  password: string
  from: string
}

function buildHtml(story: Story, age: { range: string } | undefined, storyUrl: string, preview: string, unsubToken: string) {
  const unsubUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tichucko.sk'}/api/unsubscribe?token=${unsubToken}`
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

export async function sendDailyStorySMTP(
  story: Story,
  subscribers: Array<{ email: string; unsubscribe_token: string }>,
  cfg: SmtpConfig
): Promise<{ sent: number }> {
  if (subscribers.length === 0) return { sent: 0 }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.password },
  })

  const age = AGE_CATEGORIES.find(a => a.id === story.age_id)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tichucko.sk'
  const storyUrl = `${appUrl}/story/${story.id}`
  const firstPage = story.pages.find(p => p.type === 'chapter')
  const preview = firstPage?.body?.[0]?.slice(0, 120) ?? ''

  let sent = 0
  for (const sub of subscribers) {
    try {
      await transporter.sendMail({
        from: cfg.from,
        to: sub.email,
        subject: `🌙 ${story.title} — rozprávka na dobrú noc`,
        html: buildHtml(story, age, storyUrl, preview, sub.unsubscribe_token),
      })
      sent++
    } catch (err) {
      console.error(`[SMTP] Failed to send to ${sub.email}:`, err)
    }
  }

  return { sent }
}

export async function sendWelcomeEmailSMTP(
  email: string,
  unsubscribeToken: string,
  cfg: SmtpConfig
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tichucko.sk'
  const unsubUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.password },
  })

  await transporter.sendMail({
    from: cfg.from,
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
