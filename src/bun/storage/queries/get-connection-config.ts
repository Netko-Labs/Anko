import { AppError } from '../../error'
import type { ConnectionConfig } from '../entities'
import { decrypt } from '../encryption'
import { getConnection } from './get-connection'

export function getConnectionConfig(id: string): ConnectionConfig {
  const saved = getConnection(id)
  if (!saved) throw AppError.notFound(`Connection not found: ${id}`)

  const password = decrypt(Buffer.from(saved.encryptedPassword))
  return {
    name: saved.name,
    host: saved.host,
    port: saved.port,
    username: saved.username,
    password,
    database: saved.databaseName ?? undefined,
    driver: saved.driver,
  }
}
