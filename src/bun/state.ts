import type { ConnectionConfig, DatabaseConnector } from './db/connector'
import { MySqlConnector } from './db/mysql'
import { PostgresConnector } from './db/postgres'
import { AppError } from './error'
import { Storage } from './storage'

export class AppState {
  private connections = new Map<string, DatabaseConnector>()
  public storage: Storage | null = null

  initializeStorage(appDataDir: string) {
    this.storage = new Storage(appDataDir)
  }

  getStorage(): Storage {
    if (!this.storage) throw AppError.storage('Storage not initialized')
    return this.storage
  }

  async connect(config: ConnectionConfig): Promise<string> {
    let connector: DatabaseConnector
    if (config.driver === 'mysql') {
      connector = await MySqlConnector.connect(config)
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
