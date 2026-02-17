import type * as React from 'react'

export interface SaveQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryRef: React.RefObject<string | undefined>
  activeWorkspaceId: string
  connectionInfoId: string | undefined
  selectedDatabase: string | undefined
}
