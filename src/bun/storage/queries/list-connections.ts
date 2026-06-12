import type { ConnectionInfo } from '../entities'
import { getDb } from '../client'
import { connectionTable } from '../schema'

export function listConnections(): ConnectionInfo[] {
  const rows = getDb()
    .select({
      id: connectionTable.id,
      name: connectionTable.name,
      host: connectionTable.host,
      port: connectionTable.port,
      username: connectionTable.username,
      databaseName: connectionTable.databaseName,
      driver: connectionTable.driver,
    })
    .from(connectionTable)
    .orderBy(connectionTable.name)
    .all()

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    username: row.username,
    database: row.databaseName ?? undefined,
    driver: row.driver,
  }))
}
