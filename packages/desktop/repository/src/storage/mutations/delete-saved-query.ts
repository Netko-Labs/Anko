import { savedQueryTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

export function deleteSavedQuery(id: string): void {
  getDb().delete(savedQueryTable).where(eq(savedQueryTable.id, id)).run()
}
