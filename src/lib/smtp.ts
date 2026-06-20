import nodemailer from 'nodemailer'

export interface SmtpConfig {
  host: string
  port: number
  user: string
  password: string
  from: string
}

// Transport only — all HTML lives in email-templates.ts, orchestration in email.ts.
export function createSmtpTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465, // Hetzner blokuje 465/25 → drž sa 587 (STARTTLS)
    auth: { user: cfg.user, pass: cfg.password },
  })
}
