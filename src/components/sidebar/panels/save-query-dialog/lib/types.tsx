import type { SavedQuery } from '@/types'

export interface SaveQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editQuery: SavedQuery | null
  onSave: (name: string, query: string, description: string) => void
}
