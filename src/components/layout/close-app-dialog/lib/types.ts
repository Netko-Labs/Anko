export type CloseAppPreference = 'ask' | 'always-close' | 'never-close'

export interface CloseAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}
