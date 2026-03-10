import type { Database } from 'bun:sqlite'
import { AppError } from '../error'

export interface SavedQuery {
  id: string
  name: string
  query: string
  description?: string
  workspaceId?: string
  connectionId?: string
  databaseName?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSavedQueryInput {
  name: string
  query: string
  description?: string
  workspaceId?: string
  connectionId?: string
  databaseName?: string
}

export interface UpdateSavedQueryInput {
  name?: string
  query?: string
  description?: string
  workspaceId?: string
  connectionId?: string
  databaseName?: string
}

export class SavedQueriesStorage {
  constructor(private db: Database) {
    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
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

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_saved_queries_workspace
      ON saved_queries(workspace_id)
    `)
  }

  create(input: CreateSavedQueryInput): SavedQuery {
    const id = crypto.randomUUID()

    this.db
      .prepare(
        `INSERT INTO saved_queries (id, name, query, description, workspace_id, connection_id, database_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.name,
        input.query,
        input.description ?? null,
        input.workspaceId ?? null,
        input.connectionId ?? null,
        input.databaseName ?? null,
      )

    const result = this.getById(id)
    if (!result) throw AppError.storage('Failed to retrieve created saved query')
    return result
  }

  getById(id: string): SavedQuery | null {
    const row = this.db
      .prepare(
        `SELECT id, name, query, description, workspace_id, connection_id, database_name,
                datetime(created_at) as created_at, datetime(updated_at) as updated_at
         FROM saved_queries WHERE id = ?`,
      )
      .get(id) as Record<string, unknown> | null

    if (!row) return null
    return this.mapRow(row)
  }

  list(workspaceId?: string): SavedQuery[] {
    const rows = workspaceId
      ? (this.db
          .prepare(
            `SELECT id, name, query, description, workspace_id, connection_id, database_name,
                    datetime(created_at) as created_at, datetime(updated_at) as updated_at
             FROM saved_queries WHERE workspace_id = ? OR workspace_id IS NULL
             ORDER BY name ASC`,
          )
          .all(workspaceId) as Array<Record<string, unknown>>)
      : (this.db
          .prepare(
            `SELECT id, name, query, description, workspace_id, connection_id, database_name,
                    datetime(created_at) as created_at, datetime(updated_at) as updated_at
             FROM saved_queries ORDER BY name ASC`,
          )
          .all() as Array<Record<string, unknown>>)

    return rows.map((r) => this.mapRow(r))
  }

  update(id: string, input: UpdateSavedQueryInput): SavedQuery {
    const existing = this.getById(id)
    if (!existing) throw AppError.storage(`Saved query not found: ${id}`)

    const name = input.name ?? existing.name
    const query = input.query ?? existing.query
    const description = input.description ?? existing.description
    const workspaceId = input.workspaceId ?? existing.workspaceId
    const connectionId = input.connectionId ?? existing.connectionId
    const databaseName = input.databaseName ?? existing.databaseName

    this.db
      .prepare(
        `UPDATE saved_queries
         SET name = ?, query = ?, description = ?, workspace_id = ?,
             connection_id = ?, database_name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(
        name,
        query,
        description ?? null,
        workspaceId ?? null,
        connectionId ?? null,
        databaseName ?? null,
        id,
      )

    const result = this.getById(id)
    if (!result) throw AppError.storage('Failed to retrieve updated saved query')
    return result
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM saved_queries WHERE id = ?').run(id)
  }

  clearAll(): void {
    this.db.prepare('DELETE FROM saved_queries').run()
  }

  private mapRow(row: Record<string, unknown>): SavedQuery {
    return {
      id: row.id as string,
      name: row.name as string,
      query: row.query as string,
      description: (row.description as string | null) ?? undefined,
      workspaceId: (row.workspace_id as string | null) ?? undefined,
      connectionId: (row.connection_id as string | null) ?? undefined,
      databaseName: (row.database_name as string | null) ?? undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }
}
