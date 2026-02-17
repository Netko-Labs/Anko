import { Trash2, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RowActionsProps } from '../definitions'

export function RowActions({
  isNewRow,
  isMarkedForDeletion,
  onDelete,
  onUndoDelete,
  onRemoveNewRow,
}: RowActionsProps) {
  if (isNewRow) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemoveNewRow}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        title="Remove new row"
      >
        <X className="size-3.5" />
      </Button>
    )
  }

  if (isMarkedForDeletion) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndoDelete}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
        title="Undo delete"
      >
        <Undo2 className="size-3.5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDelete}
      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
      title="Delete row"
    >
      <Trash2 className="size-3.5" />
    </Button>
  )
}
