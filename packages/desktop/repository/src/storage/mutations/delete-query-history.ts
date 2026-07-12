import { queryHistoryTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

export function deleteQueryHistory(id: string): void {
  getDb().delete(queryHistoryTable).where(eq(queryHistoryTable.id, id)).run()
}
