import { getDb } from '../client'
import { savedQueryTable } from '../schema'

export function clearSavedQueries(): void {
  getDb().delete(savedQueryTable).run()
}
