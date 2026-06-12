import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { savedQueryTable } from '../schema'

export function deleteSavedQuery(id: string): void {
  getDb().delete(savedQueryTable).where(eq(savedQueryTable.id, id)).run()
}
