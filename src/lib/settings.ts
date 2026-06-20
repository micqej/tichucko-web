import { supabaseAdmin } from './supabase'
import { encrypt, decrypt } from './crypto'

// Citlivé kľúče sa v DB ukladajú šifrovane (AES-256-GCM). Pri čítaní sa dešifrujú.
export const SECRET_KEYS = new Set([
  'openai_api_key', 'claude_api_key', 'groq_api_key', 'grok_api_key', 'resend_api_key', 'smtp_password',
])

// 60-sekundová in-memory cache (dešifrované hodnoty)
let _cache: Record<string, string> = {}
let _cacheAt = 0
const TTL = 60_000

async function load() {
  if (_cacheAt !== 0 && Date.now() - _cacheAt < TTL) return
  try {
    const { data } = await supabaseAdmin().from('settings').select('key, value')
    if (data) {
      _cache = Object.fromEntries((data as { key: string; value: string }[]).map(r => [
        r.key, SECRET_KEYS.has(r.key) ? decrypt(r.value) : r.value,
      ]))
      _cacheAt = Date.now()
    }
  } catch { /* fallback na env */ }
}

export async function getSetting(key: string): Promise<string | null> {
  await load()
  return _cache[key] ?? null
}

export async function getAllSettings(): Promise<Record<string, string>> {
  await load()
  return { ..._cache }
}

export async function setSetting(key: string, value: string) {
  const stored = SECRET_KEYS.has(key) ? encrypt(value) : value
  await supabaseAdmin().from('settings').upsert({ key, value: stored, updated_at: new Date().toISOString() })
  _cache[key] = value
  _cacheAt = Date.now()
}

/** Read an API key: prefer DB setting, fall back to env var */
export async function getApiKey(settingKey: string, envKey: string): Promise<string> {
  const fromDb = await getSetting(settingKey)
  return fromDb || process.env[envKey] || ''
}
