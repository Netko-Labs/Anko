import { eq, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { encrypt } from '../encryption'
import type { ConnectionConfig } from '../entities'
import { connectionTable } from '../schema'

export function updateConnection(id: string, config: ConnectionConfig): void {
  const encryptedPassword = config.password ? encrypt(config.password) : undefined

  getDb()
    .update(connectionTable)
    .set({
      name: config.name,
      host: config.host,
      port: config.port,
      username: config.username,
      ...(encryptedPassword ? { encryptedPassword } : {}),
      databaseName: config.database ?? null,
      driver: config.driver,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(connectionTable.id, id))
    .run()
}
