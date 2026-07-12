import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { queryHistoryTable } from '../schema'

export function deleteQueryHistory(id: string): void {
  getDb().delete(queryHistoryTable).where(eq(queryHistoryTable.id, id)).run()
}
