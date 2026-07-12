import { connectionTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

export function deleteConnection(id: string): void {
  getDb().delete(connectionTable).where(eq(connectionTable.id, id)).run()
}
