import { IconPencil, IconPlugConnected, IconTrash } from '@tabler/icons-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { DatabaseTypeIcon, TreeNode } from '../../../tree'
import type { DisconnectedConnectionProps } from '../lib'

export function DisconnectedConnection({
  connection,
  isConnecting,
  onConnect,
  onEdit,
  onDelete,
}: DisconnectedConnectionProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <TreeNode
          label={connection.name}
          secondaryLabel={`${connection.host}:${connection.port}`}
          icon={
            <DatabaseTypeIcon
              driver={connection.driver}
              className="size-4 text-muted-foreground/70"
            />
          }
          isExpandable={false}
          isLoading={isConnecting}
          onClick={onConnect}
          onDoubleClick={onConnect}
          level={0}
          className="opacity-80 hover:opacity-100"
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onConnect}>
          <IconPlugConnected className="size-4 mr-2" />
          Connect
        </ContextMenuItem>
        <ContextMenuItem onClick={onEdit}>
          <IconPencil className="size-4 mr-2" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} variant="destructive">
          <IconTrash className="size-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
