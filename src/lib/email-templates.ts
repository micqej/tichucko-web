import type { Story } from './types'
import { AGE_CATEGORIES } from './data'

// Pure HTML builders — shared by SMTP and Resend paths so reaction buttons,
// tracking pixel and the unsubscribe link live in ONE place.

const SHELL_BG = '#0e1230'

function ageRange(story: Story) {
  return AGE_CATEGORIES.find(a => a.id === story.age_id)?.range ?? ''
}

function reactionRow(reactBase: string) {
  const btn = 'display:inline-block;margin:0 4px;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.08);color:#cdc7e0;font-size:14px;text-decoration:none;border:1px solid rgba(255,255,255,.12)'
  return `
    <div style="text-align:center;margin:26px 0 6px">
      <p style="font-size:13px;color:#7a7faa;margin:0 0 12px">Ako sa páčila dnešná rozprávka?</p>
      <a href="${reactBase}like" style="${btn}">👍 Páčila</a>
      <a href="${reactBase}dislike" style="${btn}">👎 Nie</a>
      <a href="${reactBase}finished" style="${btn}">📖 Dočítali sme</a>
    </div>`
}

export function storyEmailHtml(opts: {
  story: Story
  storyUrl: string
  preview: string
  unsubUrl: string
  reactBase: string
  pixelUrl: string
}) {
  const { story, storyUrl, preview, unsubUrl, reactBase, pixelUrl } = opts
  return `<!DOCTYPE html>
<html lang="sk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${story.title}</title></head>
<body style="margin:0;padding:0;background:${SHELL_BG};font-family:Georgia,serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:28px">
      <span style="font-size:48px">${story.emoji}</span>
      <h1 style="color:#f6f1e1;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:12px 0 0">Tichučko — rozprávky na dobrú noc</h1>
    </div>
    <div style="background:linear-gradient(150deg,${story.cover_a},${story.cover_b});border-radius:20px;padding:36px 32px;text-align:center;color:#fff">
      <div style="font-size:72px;margin-bottom:16px">${story.emoji}</div>
      <div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.25);display:inline-block;padding:6px 14px;border-radius:999px;margin-bottom:16px">${ageRange(story)} · ${story.minutes} min</div>
      <h2 style="font-size:30px;font-weight:900;margin:0 0 14px;line-height:1.1">${story.title}</h2>
      <p style="font-size:16px;line-height:1.6;opacity:.9;margin:0 0 24px">${preview}…</p>
      <a href="${storyUrl}" style="display:inline-block;background:#fff;color:#1f2247;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;text-decoration:none">📖 Čítať rozprávku →</a>
    </div>
    <div style="margin:20px 0;padding:16px 20px;background:rgba(255,255,255,.05);border-radius:12px;color:#cdc7e0;font-size:14px">
      <strong style="color:#f6f1e1">Téma: </strong>${story.theme}
    </div>
    ${reactionRow(reactBase)}
    <p style="text-align:center;font-size:12px;color:#5a5f8a;margin-top:24px">
      Tichučko © ${new Date().getFullYear()} · <a href="${unsubUrl}" style="color:#7cc6ff;text-decoration:none">Odhlásiť odber</a>
    </p>
  </div>
  <img src="${pixelUrl}" width="1" height="1" alt="" style="display:none">
</body></html>`
}

export function welcomeHtml(unsubUrl: string) {
  return `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1f2247">
      <h1 style="font-size:28px;margin-bottom:8px">Vitaj v Tichučku! 🌙</h1>
      <p style="font-size:16px;line-height:1.6;color:#4a4f7a">
        Každý večer o <strong>17:00</strong> ti pošleme novú rozprávku šitú na mieru veku tvojho dieťatka.
      </p>
      <p style="font-size:14px;color:#9a9ab0;margin-top:32px">
        Ak si sa prihlásil omylom, <a href="${unsubUrl}" style="color:#c89bff">odhlásiť sa</a>.
      </p>
    </div>`
}

export function confirmHtml(confirmUrl: string) {
  return `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1f2247">
      <h1 style="font-size:28px;margin-bottom:8px">Ešte jeden krôčik 🌙</h1>
      <p style="font-size:16px;line-height:1.6;color:#4a4f7a">
        Potvrď, prosím, svoj odber Tichučka — klikni na tlačidlo a každý večer ti pošleme novú rozprávku.
      </p>
      <p style="margin:28px 0">
        <a href="${confirmUrl}" style="display:inline-block;background:#c89bff;color:#1f2247;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;text-decoration:none">✅ Potvrdiť odber</a>
      </p>
      <p style="font-size:13px;color:#9a9ab0">Ak si sa neprihlásil ty, tento email môžeš ignorovať.</p>
    </div>`
}

// ---- Admin (Michal) emails ----

export function adminNewSubscriberHtml(email: string, ageLabel: string, total: number) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1f2247">
      <h1 style="font-size:22px;margin-bottom:6px">🎉 Nový odberateľ</h1>
      <p style="font-size:16px;color:#4a4f7a"><strong>${email}</strong><br>Vek: ${ageLabel}</p>
      <p style="font-size:14px;color:#9a9ab0;margin-top:18px">Aktívnych odberateľov spolu: <strong>${total}</strong></p>
    </div>`
}

export function adminApprovalHtml(items: Array<{
  title: string; ageLabel: string; theme: string; preview: string; storyUrl: string; approveUrl: string; editUrl: string; discardUrl: string
}>) {
  const blocks = items.map(it => `
    <div style="border:1px solid #e6e3f0;border-radius:14px;padding:20px;margin-bottom:18px">
      <div style="font-size:12px;font-weight:800;color:#8a73d6;text-transform:uppercase;letter-spacing:.06em">${it.ageLabel} · ${it.theme}</div>
      <h2 style="font-size:20px;margin:6px 0 8px;color:#1f2247">${it.title}</h2>
      <p style="font-size:14px;line-height:1.6;color:#5a5f7a;margin:0 0 16px">${it.preview}…</p>
      <a href="${it.approveUrl}" style="display:inline-block;background:#2ecc71;color:#fff;font-weight:800;font-size:14px;padding:11px 18px;border-radius:10px;text-decoration:none;margin:0 6px 8px 0">✅ Schváliť &amp; odoslať</a>
      <a href="${it.editUrl}" style="display:inline-block;background:#f0eef7;color:#1f2247;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px;text-decoration:none;margin:0 6px 8px 0">✏️ Upraviť</a>
      <a href="${it.discardUrl}" style="display:inline-block;background:#fbe9e9;color:#c0392b;font-weight:700;font-size:14px;padding:11px 18px;border-radius:10px;text-decoration:none;margin:0 6px 8px 0">❌ Zahodiť</a>
      <a href="${it.storyUrl}" style="display:inline-block;color:#8a73d6;font-size:13px;padding:11px 4px;text-decoration:none">Náhľad →</a>
    </div>`).join('')
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:28px 22px;color:#1f2247">
      <h1 style="font-size:24px;margin-bottom:6px">🌙 Dnešné rozprávky na schválenie</h1>
      <p style="font-size:14px;color:#7a7faa;margin-bottom:24px">Schváľ, čo má dnes o 17:00 odísť odberateľom. Čo neschváliš, sa neodošle.</p>
      ${blocks}
    </div>`
}

export function adminReportHtml(rows: Array<{ ageLabel: string; title: string; sent: number }>, totalSent: number) {
  const list = rows.map(r => `<li style="margin-bottom:6px"><strong>${r.title}</strong> <span style="color:#7a7faa">(${r.ageLabel})</span> → <strong>${r.sent}</strong> ľuďom</li>`).join('')
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:28px 24px;color:#1f2247">
      <h1 style="font-size:22px;margin-bottom:6px">✉️ Denný report Tichučko</h1>
      <p style="font-size:16px;color:#4a4f7a">Dnes odoslané spolu: <strong>${totalSent}</strong> emailov.</p>
      <ul style="font-size:15px;color:#4a4f7a;padding-left:18px;margin-top:14px">${list || '<li>Dnes sa neodoslalo nič.</li>'}</ul>
    </div>`
}
