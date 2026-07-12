import { getDb } from '../client'
import { encrypt } from '../encryption'
import type { ConnectionConfig, ConnectionInfo } from '../entities'
import { connectionTable } from '../schema'

export function saveConnection(config: ConnectionConfig): ConnectionInfo {
  const id = crypto.randomUUID()
  const encryptedPassword = encrypt(config.password)

  getDb()
    .insert(connectionTable)
    .values({
      id,
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      encryptedPassword: encryptedPassword,
      databaseName: config.database ?? null,
      driver: config.driver,
    })
    .run()

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
