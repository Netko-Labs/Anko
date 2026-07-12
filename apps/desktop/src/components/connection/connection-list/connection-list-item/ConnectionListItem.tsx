import { Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ConnectionInfo } from '@/types'

interface ConnectionListItemProps {
  connection: ConnectionInfo
  isSelected: boolean
  selectionActive: boolean
  isConnecting: boolean
  isConnected: boolean
  showMenu: boolean
  menuOpen: boolean
  onHoverChange: (hovered: boolean) => void
  onMenuOpenChange: (open: boolean) => void
  onToggleSelected: (checked: boolean) => void
  onConnect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ConnectionListItem({
  connection,
  isSelected,
  selectionActive,
  isConnecting,
  isConnected,
  showMenu,
  menuOpen,
  onHoverChange,
  onMenuOpenChange,
  onToggleSelected,
  onConnect,
  onEdit,
  onDelete,
}: ConnectionListItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-md hover:bg-accent',
        isSelected && 'bg-accent',
      )}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggleSelected(checked === true)}
        aria-label={`Select ${connection.name}`}
        className={cn(
          'shrink-0 transition-opacity',
          selectionActive || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      />
      <button
        type="button"
        onClick={onConnect}
        disabled={isConnecting || isConnected}
        className="flex-1 text-left min-w-0"
      >
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-muted'}`} />
          )}
          <span className="font-medium text-sm">{connection.name}</span>
        </div>
        <div className="text-xs text-muted-foreground ml-4">
          {connection.host}:{connection.port}
          {connection.database && ` / ${connection.database}`}
        </div>
      </button>

      {showMenu && (
        <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground">
            ⋮
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
