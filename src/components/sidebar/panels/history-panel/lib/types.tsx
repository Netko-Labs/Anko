import type { QueryHistoryEntry } from '@/types'

export interface HistoryEntryProps {
  entry: QueryHistoryEntry
  onDelete: () => void
  onCopy: () => void
  onOpenInEditor: () => void
  onSaveToQueries: () => void
}
