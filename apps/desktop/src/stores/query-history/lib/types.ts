import type { QueryHistoryEntry } from '@anko/desktop-domain'

export interface QueryHistoryStore {
  entries: QueryHistoryEntry[]
  isLoading: boolean
  filterConnectionId: string | null

  // Actions
  setEntries: (entries: QueryHistoryEntry[]) => void
  addEntry: (entry: QueryHistoryEntry) => void
  removeEntry: (id: string) => void
  clearEntries: () => void
  setLoading: (loading: boolean) => void
  setFilterConnectionId: (connectionId: string | null) => void
}
