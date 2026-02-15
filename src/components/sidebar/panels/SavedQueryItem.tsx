import {
  IconClipboard,
  IconCode,
  IconFileCode,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react'
import { useMemo } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { SavedQuery } from '@/types'

interface SavedQueryItemProps {
  query: SavedQuery
  onDelete: () => void
  onCopy: () => void
  onOpenInEditor: () => void
  onEdit: () => void
}

export function SavedQueryItem({ query, onDelete, onCopy, onOpenInEditor, onEdit }: SavedQueryItemProps) {
  const queryPreview = useMemo(() => {
    const trimmed = query.query.trim().replace(/\s+/g, ' ')
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed
  }, [query.query])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="button"
          tabIndex={0}
          className="group px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer select-none"
          onDoubleClick={onOpenInEditor}
          onKeyDown={(e) => e.key === 'Enter' && onOpenInEditor()}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <IconCode className="size-3.5 text-primary/70" />
            {query.name}
          </div>

          <div className="text-[10px] font-mono truncate text-muted-foreground mt-0.5">
            {queryPreview}
          </div>

          {query.description && (
            <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
              {query.description}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onOpenInEditor}>
          <IconFileCode className="size-4 mr-2" />
          Open in Editor
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>
          <IconClipboard className="size-4 mr-2" />
          Copy Query
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onEdit}>
          <IconPencil className="size-4 mr-2" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} variant="destructive">
          <IconTrash className="size-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
