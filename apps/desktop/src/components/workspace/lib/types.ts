import type { Workspace } from '@anko/desktop-domain'

export interface WorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editWorkspace?: Workspace | null
}
