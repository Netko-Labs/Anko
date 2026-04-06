import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { ConnectionStorage } from './connections'
import { QueryHistoryStorage } from './query-history'
import { SavedQueriesStorage } from './saved-queries'
import { WindowStateStorage } from './window-state'
import { WorkspaceStorage } from './workspaces'

export class Storage {
  public readonly connections: ConnectionStorage
  public readonly workspaces: WorkspaceStorage
  public readonly queryHistory: QueryHistoryStorage
  public readonly savedQueries: SavedQueriesStorage
  public readonly windowState: WindowStateStorage

  constructor(appDataDir: string) {
    mkdirSync(appDataDir, { recursive: true })

    const dbPath = join(appDataDir, 'connections.db')
    const db = new Database(dbPath, { create: true })
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')

    this.connections = new ConnectionStorage(db)
    this.workspaces = new WorkspaceStorage(db)
    this.queryHistory = new QueryHistoryStorage(db)
    this.savedQueries = new SavedQueriesStorage(db)
    this.windowState = new WindowStateStorage(db)
  }
}
