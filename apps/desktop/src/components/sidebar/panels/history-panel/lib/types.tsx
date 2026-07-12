import type { QueryHistoryEntry } from '@anko/desktop-domain'

export interface HistoryEntryProps {
  entry: QueryHistoryEntry
  onDelete: () => void
  onCopy: () => void
  onOpenInEditor: () => void
  onSaveToQueries: () => void
}
