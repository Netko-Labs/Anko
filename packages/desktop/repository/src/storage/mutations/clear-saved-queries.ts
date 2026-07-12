import { getDb } from '../client'
import { savedQueryTable } from '@anko/desktop-domain/db'

export function clearSavedQueries(): void {
  getDb().delete(savedQueryTable).run()
}
