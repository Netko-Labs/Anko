import { queryHistoryTable } from '@anko/desktop-domain/db'
import { getDb } from '../client'

export function clearQueryHistory(): void {
  getDb().delete(queryHistoryTable).run()
}
