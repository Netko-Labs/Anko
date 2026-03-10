import type { Database } from 'bun:sqlite'
import { AppError } from '../error'

const DEFAULT_WORKSPACE_ID = 'default'

export interface Workspace {
  id: string
  name: string
  icon: string
  is_default: boolean
  connection_ids: string[]
  created_at: string
  updated_at: string
}

export interface WorkspaceConfig {
  name: string
  icon: string
}

export class WorkspaceStorage {
  constructor(private db: Database) {
    this.initializeSchema()
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'database',
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspace_connections (
        workspace_id TEXT NOT NULL,
        connection_id TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_id, connection_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      )
    `)

    this.ensureDefaultWorkspace()
  }

  private ensureDefaultWorkspace() {
    const exists = this.db
      .prepare('SELECT id FROM workspaces WHERE id = ?')
      .get(DEFAULT_WORKSPACE_ID)

    if (!exists) {
      this.db
        .prepare(
          "INSERT INTO workspaces (id, name, icon, is_default) VALUES (?, 'Default', 'database', 1)",
        )
        .run(DEFAULT_WORKSPACE_ID)
    }
  }

  private getWorkspaceConnections(workspaceId: string): string[] {
    const rows = this.db
      .prepare(
        'SELECT connection_id FROM workspace_connections WHERE workspace_id = ? ORDER BY added_at ASC',
      )
      .all(workspaceId) as Array<{ connection_id: string }>

    return rows.map((r) => r.connection_id)
  }

  create(config: WorkspaceConfig): Workspace {
    const id = crypto.randomUUID()

    this.db
      .prepare('INSERT INTO workspaces (id, name, icon, is_default) VALUES (?, ?, ?, 0)')
      .run(id, config.name, config.icon)

    const workspace = this.getById(id)
    if (!workspace) throw AppError.notFound('Workspace not found')
    return workspace
  }

  update(id: string, config: WorkspaceConfig): Workspace {
    this.db
      .prepare(
        'UPDATE workspaces SET name = ?, icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      )
      .run(config.name, config.icon, id)

    const workspace = this.getById(id)
    if (!workspace) throw AppError.notFound('Workspace not found')
    return workspace
  }

  delete(id: string): void {
    const workspace = this.getById(id)
    if (workspace?.is_default) {
      throw AppError.validation('Cannot delete the default workspace')
    }

    this.db.prepare('DELETE FROM workspaces WHERE id = ? AND is_default = 0').run(id)
  }

  list(): Workspace[] {
    const rows = this.db
      .prepare(
        'SELECT id, name, icon, is_default, created_at, updated_at FROM workspaces ORDER BY is_default DESC, name ASC',
      )
      .all() as Array<{
      id: string
      name: string
      icon: string
      is_default: number
      created_at: string
      updated_at: string
    }>

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      is_default: row.is_default === 1,
      connection_ids: this.getWorkspaceConnections(row.id),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  }

  getById(id: string): Workspace | null {
    const row = this.db
      .prepare(
        'SELECT id, name, icon, is_default, created_at, updated_at FROM workspaces WHERE id = ?',
      )
      .get(id) as {
      id: string
      name: string
      icon: string
      is_default: number
      created_at: string
      updated_at: string
    } | null

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      is_default: row.is_default === 1,
      connection_ids: this.getWorkspaceConnections(row.id),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  addConnection(workspaceId: string, connectionId: string): void {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO workspace_connections (workspace_id, connection_id) VALUES (?, ?)',
      )
      .run(workspaceId, connectionId)

    this.db
      .prepare('UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(workspaceId)
  }

  removeConnection(workspaceId: string, connectionId: string): void {
    this.db
      .prepare('DELETE FROM workspace_connections WHERE workspace_id = ? AND connection_id = ?')
      .run(workspaceId, connectionId)

    this.db
      .prepare('UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(workspaceId)
  }

  moveConnection(connectionId: string, fromWorkspaceId: string, toWorkspaceId: string): void {
    this.removeConnection(fromWorkspaceId, connectionId)
    this.addConnection(toWorkspaceId, connectionId)
  }

  removeConnectionFromAll(connectionId: string): void {
    this.db.prepare('DELETE FROM workspace_connections WHERE connection_id = ?').run(connectionId)
  }

  clearAll(): void {
    this.db.prepare('DELETE FROM workspace_connections').run()
    this.db.prepare('DELETE FROM workspaces WHERE is_default = 0').run()
  }
}
