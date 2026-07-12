import { getDb } from '../client'
import { connectionTable } from '../schema'

export function clearConnections(): void {
  getDb().delete(connectionTable).run()
}
