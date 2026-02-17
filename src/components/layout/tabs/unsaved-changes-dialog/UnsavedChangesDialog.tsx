import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type UnsavedChangesDialogProps, UNSAVED_CHANGES_VALUES } from '../definitions'

export function UnsavedChangesDialog({
  open,
  changesCount,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{UNSAVED_CHANGES_VALUES.title}</AlertDialogTitle>
          <AlertDialogDescription>
            You have {changesCount} uncommitted change{changesCount !== 1 ? 's' : ''}. Are you sure
            you want to discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{UNSAVED_CHANGES_VALUES.cancelButton}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {UNSAVED_CHANGES_VALUES.discardButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
