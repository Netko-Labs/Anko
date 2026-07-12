import { getDb } from '../client'
import { queryHistoryTable } from '@anko/desktop-domain/db'

export function clearQueryHistory(): void {
  getDb().delete(queryHistoryTable).run()
}
