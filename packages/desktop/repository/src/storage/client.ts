import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import * as schema from '@anko/desktop-domain/db'
import { workspaceTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { type BunSQLiteDatabase, drizzle } from 'drizzle-orm/bun-sqlite'

export type DrizzleDB = BunSQLiteDatabase<typeof schema>

let _db: DrizzleDB | null = null

export function initializeDb(appDataDir: string): void {
  mkdirSync(appDataDir, { recursive: true })

  const dbPath = join(appDataDir, 'connections.db')
  const sqlite = new Database(dbPath, { create: true })
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec('PRAGMA foreign_keys = ON')

  _db = drizzle(sqlite, { schema })

  createTables(sqlite)
  ensureDefaultWorkspace()
}

export function getDb(): DrizzleDB {
  if (!_db) throw new Error('Database not initialized. Call initializeDb() first.')
  return _db
}

function ensureDefaultWorkspace() {
  const db = getDb()
  const [exists] = db
    .select({ id: workspaceTable.id })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, 'default'))
    .all()

  if (!exists) {
    db.insert(workspaceTable)
      .values({ id: 'default', name: 'Default', icon: 'database', isDefault: true })
      .run()
  }
}

function createTables(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      username TEXT NOT NULL,
      encrypted_password BLOB NOT NULL,
      database_name TEXT,
      driver TEXT NOT NULL DEFAULT 'mysql',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'database',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspace_connections (
      workspace_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (workspace_id, connection_id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS query_history (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      connection_name TEXT NOT NULL,
      database_name TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      row_count INTEGER,
      success INTEGER NOT NULL DEFAULT 1,
      error_message TEXT,
      source TEXT NOT NULL DEFAULT 'ui',
      approval_status TEXT
    )
  `)

  ensureColumn(sqlite, 'query_history', 'source', "TEXT NOT NULL DEFAULT 'ui'")
  ensureColumn(sqlite, 'query_history', 'approval_status', 'TEXT')

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_query_history_executed_at
    ON query_history(executed_at)
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS saved_queries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      query TEXT NOT NULL,
      description TEXT,
      workspace_id TEXT,
      connection_id TEXT,
      database_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
    )
  `)

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_saved_queries_workspace
    ON saved_queries(workspace_id)
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS window_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      is_maximized INTEGER NOT NULL DEFAULT 0
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspace_sessions (
      workspace_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

function ensureColumn(sqlite: Database, table: string, column: string, definition: string) {
  const columns = sqlite.query(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!columns.some((item) => item.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}
