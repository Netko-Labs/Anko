import type { SavedQuery } from '@/types'

export interface SavedQueryItemProps {
  query: SavedQuery
  onDelete: () => void
  onCopy: () => void
  onOpenInEditor: () => void
  onEdit: () => void
}
