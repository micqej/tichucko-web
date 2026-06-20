import { SignJWT, jwtVerify } from 'jose'

// Signed, expiring tokens for one-click admin actions in emails (approve/discard).
// Uses the same secret as the admin session.
const secret = () => new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? 'dev-insecure-change-me')

export async function signActionToken(payload: Record<string, unknown>, ttlSeconds = 86_400): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secret())
}

export async function verifyActionToken<T = Record<string, unknown>>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as T
  } catch {
    return null
  }
}
