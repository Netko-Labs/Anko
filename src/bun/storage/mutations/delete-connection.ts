import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { connectionTable } from '../schema'

export function deleteConnection(id: string): void {
  getDb().delete(connectionTable).where(eq(connectionTable.id, id)).run()
}
