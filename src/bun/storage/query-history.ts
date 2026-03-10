import type { Database } from 'bun:sqlite'
import { AppError } from '../error'

const MAX_HISTORY_ENTRIES = 1000
const HISTORY_RETENTION_DAYS = 30

export interface QueryHistoryEntry {
  id: string
  query: string
  connectionId: string
  connectionName: string
  databaseName?: string
  executedAt: string
  executionTimeMs?: number
  rowCount?: number
  success: boolean
  errorMessage?: string
}

export interface AddQueryHistoryInput {
  query: string
  connectionId: string
  connectionName: string
  databaseName?: string
  executionTimeMs?: number
  rowCount?: number
  success: boolean
  errorMessage?: string
}

export class QueryHistoryStorage {
  constructor(private db: Database) {
    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
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
        error_message TEXT
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_query_history_executed_at
      ON query_history(executed_at)
    `)
  }

  add(input: AddQueryHistoryInput): QueryHistoryEntry {
    this.cleanup()

    const id = crypto.randomUUID()

    this.db
      .prepare(
        `INSERT INTO query_history (id, query, connection_id, connection_name, database_name,
         execution_time_ms, row_count, success, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.query,
        input.connectionId,
        input.connectionName,
        input.databaseName ?? null,
        input.executionTimeMs ?? null,
        input.rowCount ?? null,
        input.success ? 1 : 0,
        input.errorMessage ?? null,
      )

    const entry = this.getById(id)
    if (!entry) throw AppError.storage('Failed to retrieve created history entry')
    return entry
  }

  getById(id: string): QueryHistoryEntry | null {
    const row = this.db
      .prepare(
        `SELECT id, query, connection_id, connection_name, database_name,
                datetime(executed_at) as executed_at, execution_time_ms,
                row_count, success, error_message
         FROM query_history WHERE id = ?`,
      )
      .get(id) as {
      id: string
      query: string
      connection_id: string
      connection_name: string
      database_name: string | null
      executed_at: string
      execution_time_ms: number | null
      row_count: number | null
      success: number
      error_message: string | null
    } | null

    if (!row) return null
    return this.mapRow(row)
  }

  list(connectionId?: string, limit?: number): QueryHistoryEntry[] {
    const lim = limit ?? 100

    const query = connectionId
      ? `SELECT id, query, connection_id, connection_name, database_name,
                datetime(executed_at) as executed_at, execution_time_ms,
                row_count, success, error_message
         FROM query_history WHERE connection_id = ?
         ORDER BY executed_at DESC LIMIT ?`
      : `SELECT id, query, connection_id, connection_name, database_name,
                datetime(executed_at) as executed_at, execution_time_ms,
                row_count, success, error_message
         FROM query_history ORDER BY executed_at DESC LIMIT ?`

    const rows = connectionId
      ? (this.db.prepare(query).all(connectionId, lim) as Array<Record<string, unknown>>)
      : (this.db.prepare(query).all(lim) as Array<Record<string, unknown>>)

    return rows.map((r) => this.mapRow(r as Record<string, unknown>))
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM query_history WHERE id = ?').run(id)
  }

  clearAll(): void {
    this.db.prepare('DELETE FROM query_history').run()
  }

  private cleanup() {
    this.db
      .prepare(
        `DELETE FROM query_history WHERE executed_at < datetime('now', '-${HISTORY_RETENTION_DAYS} days')`,
      )
      .run()

    const countResult = this.db.prepare('SELECT COUNT(*) as count FROM query_history').get() as {
      count: number
    }
    const count = countResult.count

    if (count >= MAX_HISTORY_ENTRIES) {
      const toDelete = count - MAX_HISTORY_ENTRIES + 1
      this.db
        .prepare(
          `DELETE FROM query_history WHERE id IN (
            SELECT id FROM query_history ORDER BY executed_at ASC LIMIT ?
          )`,
        )
        .run(toDelete)
    }
  }

  private mapRow(row: Record<string, unknown>): QueryHistoryEntry {
    return {
      id: row.id as string,
      query: row.query as string,
      connectionId: row.connection_id as string,
      connectionName: row.connection_name as string,
      databaseName: (row.database_name as string | null) ?? undefined,
      executedAt: row.executed_at as string,
      executionTimeMs: (row.execution_time_ms as number | null) ?? undefined,
      rowCount: (row.row_count as number | null) ?? undefined,
      success: (row.success as number) !== 0,
      errorMessage: (row.error_message as string | null) ?? undefined,
    }
  }
}
