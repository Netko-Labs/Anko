import type { SavedQuery } from '@anko/desktop-domain'

export interface SavedQueryItemProps {
  query: SavedQuery
  onDelete: () => void
  onCopy: () => void
  onOpenInEditor: () => void
  onEdit: () => void
}
