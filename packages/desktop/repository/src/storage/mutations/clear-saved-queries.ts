import { savedQueryTable } from '@anko/desktop-domain/db'
import { getDb } from '../client'

export function clearSavedQueries(): void {
  getDb().delete(savedQueryTable).run()
}
