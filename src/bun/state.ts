import type { ConnectionConfig, DatabaseConnector } from './db/connector'
import { MySqlConnector } from './db/mysql'
import { PostgresConnector } from './db/postgres'
import { SqliteConnector } from './db/sqlite'
import { AppError } from './error'
import { initializeDb } from './storage'

export class AppState {
  private connections = new Map<string, DatabaseConnector>()
  private storageReady = false

  initializeStorage(appDataDir: string) {
    initializeDb(appDataDir)
    this.storageReady = true
  }

  ensureStorageReady() {
    if (!this.storageReady) throw AppError.storage('Storage not initialized')
  }

  async connect(config: ConnectionConfig): Promise<string> {
    let connector: DatabaseConnector
    if (config.driver === 'mysql') {
      connector = await MySqlConnector.connect(config)
    } else if (config.driver === 'sqlite') {
      connector = await SqliteConnector.connect(config)
    } else {
      connector = await PostgresConnector.connect(config)
    }

    const connectionId = crypto.randomUUID()
    this.connections.set(connectionId, connector)
    return connectionId
  }

  async disconnect(connectionId: string): Promise<void> {
    const connector = this.connections.get(connectionId)
    if (connector) {
      await connector.close()
      this.connections.delete(connectionId)
    }
  }

  getConnection(connectionId: string): DatabaseConnector {
    const connector = this.connections.get(connectionId)
    if (!connector) throw AppError.connectionNotFound(connectionId)
    return connector
  }
}
