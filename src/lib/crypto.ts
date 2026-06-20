import crypto from 'node:crypto'

// AES-256-GCM šifrovanie citlivých hodnôt (API kľúče, SMTP heslo) pri uložení do SQLite.
// ENCRYPTION_KEY = 64 hex znakov (32 bajtov). Formát: iv.tag.ciphertext (base64, oddelené bodkou).

function key(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY musí byť 64 hex znakov (32 bajtov).')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plain: string | null | undefined): string {
  if (plain == null || plain === '') return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join('.')
}

export function decrypt(blob: string | null | undefined): string {
  if (!blob) return ''
  const [ivB, tagB, ctB] = String(blob).split('.')
  if (!ivB || !tagB || !ctB) return ''
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(ctB, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}

// --- Admin password hashing (scrypt) ---
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(pw, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false
  const [saltHex, hashHex] = stored.split(':')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}
