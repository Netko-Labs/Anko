import { connectionTable } from '@anko/desktop-domain/db'
import { getDb } from '../client'

export function clearConnections(): void {
  getDb().delete(connectionTable).run()
}
