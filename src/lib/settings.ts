import { supabaseAdmin } from './supabase'

// 60-second in-memory cache so each request doesn't hit the DB
let _cache: Record<string, string> = {}
let _cacheAt = 0
const TTL = 60_000

async function load() {
  if (Date.now() - _cacheAt < TTL) return
  try {
    const { data } = await supabaseAdmin().from('settings').select('key, value')
    if (data) {
      _cache = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
      _cacheAt = Date.now()
    }
  } catch { /* fallback to empty — env vars will be used */ }
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
  await supabaseAdmin()
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  _cache[key] = value          // update in-memory immediately
  _cacheAt = Date.now()
}

/** Read an API key: prefer DB setting, fall back to env var */
export async function getApiKey(settingKey: string, envKey: string): Promise<string> {
  const fromDb = await getSetting(settingKey)
  return fromDb || process.env[envKey] || ''
}
