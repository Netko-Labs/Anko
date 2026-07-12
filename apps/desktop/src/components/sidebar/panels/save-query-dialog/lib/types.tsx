import type { SavedQuery } from '@anko/desktop-domain'

export interface SaveQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editQuery: SavedQuery | null
  onSave: (name: string, query: string, description: string) => void
}
