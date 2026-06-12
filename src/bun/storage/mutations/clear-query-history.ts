import { getDb } from '../client'
import { queryHistoryTable } from '../schema'

export function clearQueryHistory(): void {
  getDb().delete(queryHistoryTable).run()
}
