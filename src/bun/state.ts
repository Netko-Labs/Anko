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

  private async createConnector(config: ConnectionConfig): Promise<DatabaseConnector> {
    if (config.driver === 'mysql') return MySqlConnector.connect(config)
    if (config.driver === 'sqlite') return SqliteConnector.connect(config)
    return PostgresConnector.connect(config)
  }

  async connect(config: ConnectionConfig): Promise<string> {
    const connector = await this.createConnector(config)
    const connectionId = crypto.randomUUID()
    this.connections.set(connectionId, connector)
    return connectionId
  }

  /** Open a throwaway connection to validate a config, then close it. */
  async testConnection(config: ConnectionConfig): Promise<void> {
    const connector = await this.createConnector(config)
    await connector.close()
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
