import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { SEED_STORIES, SEED_TOPICS } from './seed'

// SQLite vrstva — nahrádza Supabase. Beží len na serveri (Next.js server + worker hit přes HTTP).
// WAL kvôli súbežnému prístupu; busy_timeout proti zámkom.

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  const file = process.env.TICHUCKO_DB || path.join(process.cwd(), 'data', 'tichucko.db')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  _db = new Database(file)
  _db.pragma('journal_mode = WAL')
  _db.pragma('busy_timeout = 5000')
  init(_db)
  return _db
}

const TS = "strftime('%Y-%m-%dT%H:%M:%SZ','now')"
const ID = "lower(hex(randomblob(16)))"

function init(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY DEFAULT (${ID}),
      title TEXT NOT NULL,
      age_id TEXT NOT NULL,
      theme TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🌙',
      cover_a TEXT NOT NULL DEFAULT '#ff9bbf',
      cover_b TEXT NOT NULL DEFAULT '#c89bff',
      minutes INTEGER NOT NULL DEFAULT 4,
      pages TEXT NOT NULL DEFAULT '[]',
      author TEXT,
      generated_by TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      approved_at TEXT,
      published_at TEXT DEFAULT (${TS}),
      created_at TEXT DEFAULT (${TS})
    );
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY DEFAULT (${ID}),
      age_id TEXT NOT NULL,
      theme TEXT NOT NULL,
      keywords TEXT,
      moral_lesson TEXT,
      used INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (${TS})
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY DEFAULT (${ID}),
      email TEXT NOT NULL UNIQUE,
      age_preference TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      confirmed INTEGER NOT NULL DEFAULT 1,
      unsubscribe_token TEXT DEFAULT (lower(hex(randomblob(20)))),
      confirm_token TEXT DEFAULT (lower(hex(randomblob(20)))),
      subscribed_at TEXT DEFAULT (${TS})
    );
    CREATE TABLE IF NOT EXISTS daily_sends (
      id TEXT PRIMARY KEY DEFAULT (${ID}),
      story_id TEXT,
      sent_at TEXT DEFAULT (${TS}),
      recipient_count INTEGER DEFAULT 0,
      opens INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY DEFAULT (${ID}),
      story_id TEXT,
      age_id TEXT,
      signal TEXT NOT NULL,
      created_at TEXT DEFAULT (${TS})
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS stories_status_idx ON stories(status);
    CREATE INDEX IF NOT EXISTS stories_age_idx ON stories(age_id);
    CREATE INDEX IF NOT EXISTS stories_created_idx ON stories(created_at DESC);
    CREATE INDEX IF NOT EXISTS topics_unused_idx ON topics(age_id, used, priority DESC);
    CREATE INDEX IF NOT EXISTS reactions_story_idx ON reactions(story_id);
    CREATE INDEX IF NOT EXISTS subscribers_active_idx ON subscribers(active);
  `)
  seed(d)
}

function seed(d: Database.Database) {
  const storyCount = (d.prepare('SELECT COUNT(*) c FROM stories').get() as { c: number }).c
  if (storyCount === 0) {
    const stmt = d.prepare(`INSERT INTO stories (title, age_id, theme, emoji, cover_a, cover_b, minutes, author, generated_by, status, pages)
      VALUES (@title,@age_id,@theme,@emoji,@cover_a,@cover_b,@minutes,@author,@generated_by,'published',@pages)`)
    for (const s of SEED_STORIES) stmt.run({ ...s, pages: JSON.stringify(s.pages) })
  }
  const topicCount = (d.prepare('SELECT COUNT(*) c FROM topics').get() as { c: number }).c
  if (topicCount === 0) {
    const stmt = d.prepare('INSERT INTO topics (age_id, theme, keywords, moral_lesson) VALUES (@age_id,@theme,@keywords,@moral_lesson)')
    for (const t of SEED_TOPICS) stmt.run(t)
  }
  // Predvolené nastavenia (admin ich potom mení v UI). INSERT OR IGNORE = neprepíše existujúce.
  const defaults: Record<string, string> = {
    ai_provider: 'openai', email_provider: 'smtp',
    generate_time: '08:00', send_time: '17:00',
    auto_approve: 'off', double_optin: 'off',
    openai_model: 'gpt-4o-mini', claude_model: 'claude-sonnet-4-6',
    groq_model: 'llama-3.3-70b-versatile', grok_model: 'grok-3-mini',
    learning_directives: '',
  }
  const ins = d.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
  for (const [k, v] of Object.entries(defaults)) ins.run(k, v, new Date().toISOString())

  // Seed admin password hash z env ADMIN_PASSWORD pri prvom behu (ak ešte nie je)
  const hasHash = d.prepare("SELECT 1 FROM settings WHERE key='admin_password_hash'").get()
  if (!hasHash && process.env.ADMIN_PASSWORD) {
    // lazy import aby sa crypto nenačítal zbytočne
    const { hashPassword } = require('./crypto') as typeof import('./crypto')
    d.prepare('INSERT INTO settings (key,value,updated_at) VALUES (?,?,?)')
      .run('admin_password_hash', hashPassword(process.env.ADMIN_PASSWORD), new Date().toISOString())
  }
}

// ---------------- Supabase-kompatibilný shim ----------------

const BOOL_COLS = new Set(['active', 'used', 'confirmed'])
const JSON_COLS = new Set(['pages'])

function encVal(col: string, v: unknown): unknown {
  if (typeof v === 'boolean') return v ? 1 : 0
  if (JSON_COLS.has(col) && v != null && typeof v === 'object') return JSON.stringify(v)
  return v
}
function decRow(row: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!row) return row
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (BOOL_COLS.has(k)) out[k] = !!v
    else if (JSON_COLS.has(k) && typeof v === 'string') { try { out[k] = JSON.parse(v) } catch { out[k] = v } }
    else out[k] = v
  }
  return out
}

// data je zámerne `any` — call-sites si výsledok typujú samy (rovnako ako pôvodný Supabase klient).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Result = { data: any; error: { message: string; code?: string } | null; count: number | null }

class SelectQuery {
  private _cols = '*'; private _where: string[] = []; private _params: unknown[] = []
  private _order = ''; private _limit = 0; private _count = false; private _head = false; private _single = false
  constructor(private table: string, cols?: string, opts?: { count?: string; head?: boolean }) {
    if (cols) this._cols = cols
    if (opts?.count) this._count = true
    if (opts?.head) this._head = true
  }
  eq(c: string, v: unknown) { this._where.push(`${c} = ?`); this._params.push(encVal(c, v)); return this }
  gte(c: string, v: unknown) { this._where.push(`${c} >= ?`); this._params.push(encVal(c, v)); return this }
  order(c: string, opts?: { ascending?: boolean }) { this._order = ` ORDER BY ${c} ${opts?.ascending === false ? 'DESC' : 'ASC'}`; return this }
  limit(n: number) { this._limit = n; return this }
  single() { this._single = true; this._limit = 1; return this }
  private run(): Result {
    const db = getDb()
    const where = this._where.length ? ' WHERE ' + this._where.join(' AND ') : ''
    if (this._head) {
      const row = db.prepare(`SELECT COUNT(*) c FROM ${this.table}${where}`).get(...this._params) as { c: number }
      return { data: null, count: row.c, error: null }
    }
    const sql = `SELECT ${this._cols} FROM ${this.table}${where}${this._order}${this._limit ? ` LIMIT ${this._limit}` : ''}`
    const rows = (db.prepare(sql).all(...this._params) as Record<string, unknown>[]).map(decRow)
    const count = this._count ? (db.prepare(`SELECT COUNT(*) c FROM ${this.table}${where}`).get(...this._params) as { c: number }).c : null
    if (this._single) {
      return rows[0] ? { data: rows[0], error: null, count } : { data: null, error: { message: 'No rows', code: 'PGRST116' }, count }
    }
    return { data: rows, error: null, count }
  }
  then(resolve: (r: Result) => void, reject?: (e: unknown) => void) {
    try { resolve(this.run()) } catch (e) { reject ? reject(e) : resolve({ data: null, error: { message: String(e) }, count: null }) }
  }
}

class WriteQuery {
  private _where: string[] = []; private _params: unknown[] = []; private _returning = false; private _single = false
  constructor(private table: string, private kind: 'insert' | 'update' | 'delete' | 'upsert', private values?: Record<string, unknown> | Record<string, unknown>[]) {}
  eq(c: string, v: unknown) { this._where.push(`${c} = ?`); this._params.push(encVal(c, v)); return this }
  select() { this._returning = true; return this }
  single() { this._returning = true; this._single = true; return this }
  private run(): Result {
    const db = getDb()
    try {
      if (this.kind === 'insert') {
        const rowsIn = Array.isArray(this.values) ? this.values : [this.values!]
        const out: Record<string, unknown>[] = []
        for (const r of rowsIn) {
          const entries = Object.entries(r).filter(([, v]) => v !== undefined)
          const cols = entries.map(([k]) => k)
          const sql = `INSERT INTO ${this.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})${this._returning ? ' RETURNING *' : ''}`
          const params = entries.map(([k, v]) => encVal(k, v))
          if (this._returning) out.push(decRow(db.prepare(sql).get(...params) as Record<string, unknown>)!)
          else db.prepare(sql).run(...params)
        }
        return { data: this._single ? (out[0] ?? null) : out, error: null, count: null }
      }
      if (this.kind === 'update') {
        const entries = Object.entries(this.values as Record<string, unknown>).filter(([, v]) => v !== undefined)
        const set = entries.map(([k]) => `${k} = ?`).join(', ')
        const where = this._where.length ? ' WHERE ' + this._where.join(' AND ') : ''
        const sql = `UPDATE ${this.table} SET ${set}${where}${this._returning ? ' RETURNING *' : ''}`
        const params = [...entries.map(([k, v]) => encVal(k, v)), ...this._params]
        if (this._returning) {
          const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined
          return row ? { data: decRow(row), error: null, count: null } : { data: null, error: { message: 'No rows', code: 'PGRST116' }, count: null }
        }
        db.prepare(sql).run(...params)
        return { data: null, error: null, count: null }
      }
      if (this.kind === 'delete') {
        const where = this._where.length ? ' WHERE ' + this._where.join(' AND ') : ''
        db.prepare(`DELETE FROM ${this.table}${where}`).run(...this._params)
        return { data: null, error: null, count: null }
      }
      // upsert (settings: PK key)
      const r = this.values as Record<string, unknown>
      const entries = Object.entries(r).filter(([, v]) => v !== undefined)
      const cols = entries.map(([k]) => k)
      const updates = cols.filter(c => c !== 'key').map(c => `${c}=excluded.${c}`).join(', ')
      const sql = `INSERT INTO ${this.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')}) ON CONFLICT(key) DO UPDATE SET ${updates}`
      db.prepare(sql).run(...entries.map(([k, v]) => encVal(k, v)))
      return { data: null, error: null, count: null }
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : String(e) }, count: null }
    }
  }
  then(resolve: (r: Result) => void, reject?: (e: unknown) => void) {
    try { resolve(this.run()) } catch (e) { reject ? reject(e) : resolve({ data: null, error: { message: String(e) }, count: null }) }
  }
}

function from(table: string) {
  return {
    select: (cols?: string, opts?: { count?: string; head?: boolean }) => new SelectQuery(table, cols, opts),
    insert: (values: Record<string, unknown> | Record<string, unknown>[]) => new WriteQuery(table, 'insert', values),
    update: (values: Record<string, unknown>) => new WriteQuery(table, 'update', values),
    delete: () => new WriteQuery(table, 'delete'),
    upsert: (values: Record<string, unknown>) => new WriteQuery(table, 'upsert', values),
  }
}

export function supabaseAdmin() { return { from } }
export const supabase = { from }
