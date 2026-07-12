import { getDb } from '../client'
import { connectionTable } from '@anko/desktop-domain/db'

export function clearConnections(): void {
  getDb().delete(connectionTable).run()
}
