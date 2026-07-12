import type { ActiveConnectionInfo, ConnectionInfo } from '@anko/desktop-domain'
import type { ConnectionConfig } from '@anko/desktop-domain'
import type { DatabaseConnector } from '@anko/desktop-repository'
import { MySqlConnector, PostgresConnector, SqliteConnector } from '@anko/desktop-repository'
import { AppError } from '@anko/desktop-domain'
import { getConnection, getConnectionConfig, initializeDb } from '@anko/desktop-repository'

interface LiveConnection {
  connector: DatabaseConnector
  savedConnectionId: string
  info: ConnectionInfo
}

export class AppState {
  private connections = new Map<string, LiveConnection>()
  private runtimeIdBySavedId = new Map<string, string>()
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

  async connectSaved(savedConnectionId: string): Promise<ActiveConnectionInfo> {
    const existingRuntimeId = this.runtimeIdBySavedId.get(savedConnectionId)
    if (existingRuntimeId) return this.describeConnection(existingRuntimeId)

    const saved = getConnection(savedConnectionId)
    if (!saved) throw AppError.notFound(`Connection not found: ${savedConnectionId}`)
    const config = getConnectionConfig(savedConnectionId)
    const connector = await this.createConnector(config)
    const connectionId = crypto.randomUUID()
    const info: ConnectionInfo = {
      id: saved.id,
      name: saved.name,
      host: saved.host,
      port: saved.port,
      username: saved.username,
      database: saved.databaseName ?? undefined,
      driver: saved.driver,
    }
    this.connections.set(connectionId, { connector, savedConnectionId, info })
    this.runtimeIdBySavedId.set(savedConnectionId, connectionId)
    return this.describeConnection(connectionId)
  }

  /** Open a throwaway connection to validate a config, then close it. */
  async testConnection(config: ConnectionConfig): Promise<void> {
    const connector = await this.createConnector(config)
    await connector.close()
  }

  async disconnect(connectionId: string): Promise<void> {
    const live = this.connections.get(connectionId)
    if (live) {
      await live.connector.close()
      this.connections.delete(connectionId)
      this.runtimeIdBySavedId.delete(live.savedConnectionId)
    }
  }

  getConnection(connectionId: string): DatabaseConnector {
    const live = this.connections.get(connectionId)
    if (!live) throw AppError.connectionNotFound(connectionId)
    return live.connector
  }

  getConnectionInfo(connectionId: string): ConnectionInfo {
    const live = this.connections.get(connectionId)
    if (!live) throw AppError.connectionNotFound(connectionId)
    return live.info
  }

  getConnectionBySavedId(savedConnectionId: string): DatabaseConnector {
    const runtimeId = this.runtimeIdBySavedId.get(savedConnectionId)
    if (!runtimeId) throw AppError.connectionNotFound(savedConnectionId)
    return this.getConnection(runtimeId)
  }

  getActiveConnections(): ActiveConnectionInfo[] {
    return [...this.connections.keys()].map((runtimeId) => this.describeConnection(runtimeId))
  }

  getActiveConnection(savedConnectionId: string): ActiveConnectionInfo | undefined {
    const runtimeId = this.runtimeIdBySavedId.get(savedConnectionId)
    return runtimeId ? this.describeConnection(runtimeId) : undefined
  }

  private describeConnection(runtimeId: string): ActiveConnectionInfo {
    const live = this.connections.get(runtimeId)
    if (!live) throw AppError.connectionNotFound(runtimeId)
    return {
      id: live.savedConnectionId,
      connectionId: runtimeId,
      info: live.info,
      selectedDatabase: live.info.database,
    }
  }
}
