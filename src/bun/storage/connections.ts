import type { Database } from 'bun:sqlite'
import { AppError } from '../error'
import { decrypt, encrypt } from './encryption'

type DatabaseDriver = 'mysql' | 'postgresql' | 'sqlite'

export interface ConnectionConfig {
  name: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  driver: DatabaseDriver
}

export interface ConnectionInfo {
  id: string
  name: string
  host: string
  port: number
  username: string
  database?: string
  driver: DatabaseDriver
}

interface SavedConnection extends ConnectionInfo {
  encrypted_password: Buffer
}

export class ConnectionStorage {
  constructor(private db: Database) {
    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
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
  }

  save(config: ConnectionConfig): ConnectionInfo {
    const id = crypto.randomUUID()
    const encryptedPassword = encrypt(config.password)

    this.db
      .prepare(
        `INSERT INTO connections (id, name, host, port, username, encrypted_password, database_name, driver)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        config.name,
        config.host,
        config.port,
        config.username,
        encryptedPassword,
        config.database ?? null,
        config.driver,
      )

    return {
      id,
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      database: config.database,
      driver: config.driver,
    }
  }

  update(id: string, config: ConnectionConfig): void {
    const encryptedPassword = encrypt(config.password)

    this.db
      .prepare(
        `UPDATE connections
         SET name = ?, host = ?, port = ?, username = ?, encrypted_password = ?,
             database_name = ?, driver = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(
        config.name,
        config.host,
        config.port,
        config.username,
        encryptedPassword,
        config.database ?? null,
        config.driver,
        id,
      )
  }

  list(): ConnectionInfo[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, host, port, username, database_name, driver
         FROM connections ORDER BY name`,
      )
      .all() as Array<{
      id: string
      name: string
      host: string
      port: number
      username: string
      database_name: string | null
      driver: string
    }>

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port,
      username: row.username,
      database: row.database_name ?? undefined,
      driver: parseDriver(row.driver),
    }))
  }

  get(id: string): SavedConnection | null {
    const row = this.db
      .prepare(
        `SELECT id, name, host, port, username, encrypted_password, database_name, driver
         FROM connections WHERE id = ?`,
      )
      .get(id) as {
      id: string
      name: string
      host: string
      port: number
      username: string
      encrypted_password: Buffer
      database_name: string | null
      driver: string
    } | null

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port,
      username: row.username,
      database: row.database_name ?? undefined,
      driver: parseDriver(row.driver),
      encrypted_password: Buffer.from(row.encrypted_password),
    }
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM connections WHERE id = ?').run(id)
  }

  getConnectionConfig(id: string): ConnectionConfig {
    const saved = this.get(id)
    if (!saved) throw AppError.notFound(`Connection not found: ${id}`)

    const password = decrypt(saved.encrypted_password)
    return {
      name: saved.name,
      host: saved.host,
      port: saved.port,
      username: saved.username,
      password,
      database: saved.database,
      driver: saved.driver,
    }
  }

  clearAll(): void {
    this.db.prepare('DELETE FROM connections').run()
  }
}

function parseDriver(value: string): DatabaseDriver {
  if (value === 'mysql') return 'mysql'
  if (value === 'postgresql') return 'postgresql'
  if (value === 'sqlite') return 'sqlite'
  throw new AppError(`Unknown database driver: ${value}`, 'INVALID_DRIVER')
}
