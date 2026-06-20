// Tichučko worker — nahrádza Vercel cron. Beží stále (pm2), číta časy z webu (/api/cron/config)
// a v daný čas (SK pásmo) spustí ranné generovanie a večerné odosielanie. Žiadny Vercel netreba.
// Spustenie: node --env-file=.env.local worker/worker.js  (alebo cez ecosystem.config.js)

const PORT = process.env.PORT || 3007
const BASE = process.env.WORKER_BASE_URL || `http://127.0.0.1:${PORT}`
const SECRET = process.env.CRON_SECRET || ''
const TZ = 'Europe/Bratislava'

const log = (...a) => console.log(new Date().toISOString(), '[worker]', ...a)

// Aktuálny čas "HH:MM" a dátum "YYYY-MM-DD" v slovenskom pásme.
function nowParts() {
  const fmt = new Intl.DateTimeFormat('sk-SK', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
  const dfmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
  return { hm: fmt.format(new Date()).replace('.', ':').padStart(5, '0'), date: dfmt.format(new Date()) }
}

async function getConfig() {
  try {
    const r = await fetch(`${BASE}/api/cron/config`, { headers: { authorization: `Bearer ${SECRET}` } })
    if (!r.ok) throw new Error(`config ${r.status}`)
    return await r.json()
  } catch (e) {
    log('config error, fallback 08:00/17:00:', e.message)
    return { generateTime: '08:00', sendTime: '17:00' }
  }
}

async function fire(path) {
  try {
    const r = await fetch(`${BASE}${path}`, { headers: { authorization: `Bearer ${SECRET}` } })
    const body = await r.text()
    log(`fired ${path} → ${r.status} ${body.slice(0, 200)}`)
  } catch (e) {
    log(`fire ${path} failed:`, e.message)
  }
}

const last = { generate: '', send: '' } // dátum posledného spustenia, aby sa nespustilo 2×

async function tick() {
  const { hm, date } = nowParts()
  const cfg = await getConfig()
  if (hm === (cfg.generateTime || '08:00') && last.generate !== date) {
    last.generate = date
    log('generate time hit', hm)
    await fire('/api/cron/generate')
  }
  if (hm === (cfg.sendTime || '17:00') && last.send !== date) {
    last.send = date
    log('send time hit', hm)
    await fire('/api/cron/daily')
  }
}

log(`štart, sleduje ${BASE}, pásmo ${TZ}`)
tick()
setInterval(tick, 30_000) // kontrola každých 30 s
