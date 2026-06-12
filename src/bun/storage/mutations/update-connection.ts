import { eq, sql } from 'drizzle-orm'
import type { ConnectionConfig } from '../entities'
import { getDb } from '../client'
import { connectionTable } from '../schema'
import { encrypt } from '../encryption'

export function updateConnection(id: string, config: ConnectionConfig): void {
  const encryptedPassword = encrypt(config.password)

  getDb()
    .update(connectionTable)
    .set({
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      encryptedPassword: encryptedPassword,
      databaseName: config.database ?? null,
      driver: config.driver,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(connectionTable.id, id))
    .run()
}
