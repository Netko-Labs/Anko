import { IconDatabase, IconEggs, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_WORKSPACE_ICON, WORKSPACE_ICONS } from '@/components/workspace/definitions'
import type { Workspace } from '@/types'

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  activeWorkspace?: Workspace
  activeWorkspaceId?: string | null
  onWorkspaceSelect: (workspaceId: string) => void
  onNewWorkspace: () => void
  onEditWorkspace?: (workspace: Workspace) => void
  onDeleteWorkspace?: (workspace: Workspace) => void
}

export function WorkspaceIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = WORKSPACE_ICONS[icon] || WORKSPACE_ICONS[DEFAULT_WORKSPACE_ICON] || IconEggs
  return <IconComponent className={className ?? 'size-4'} />
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  activeWorkspaceId,
  onWorkspaceSelect,
  onNewWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
}: WorkspaceSwitcherProps) {
  return (
    <div className="p-2">
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20 shadow-sm transition-all duration-200 hover:bg-primary/25 hover:shadow glow-primary">
                {activeWorkspace ? (
                  <WorkspaceIcon icon={activeWorkspace.icon} />
                ) : (
                  <IconDatabase className="size-4" />
                )}
              </DropdownMenuTrigger>
            }
          />
          <DropdownMenuContent side="right" align="start" sideOffset={8} className="min-w-52 animate-scale-in">
            {workspaces.map((workspace) => (
              <ContextMenu key={workspace.id}>
                <ContextMenuTrigger>
                  <DropdownMenuItem
                    onClick={() => onWorkspaceSelect(workspace.id)}
                    className="gap-3 py-2"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted/50 border border-border/50 text-foreground/70">
                      <WorkspaceIcon icon={workspace.icon} />
                    </div>
                    <span className="flex-1 truncate font-medium">{workspace.name}</span>
                    {workspace.id === activeWorkspaceId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Active</span>
                    )}
                  </DropdownMenuItem>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onEditWorkspace?.(workspace)}>
                    <IconPencil className="size-4 mr-2" />
                    Edit Workspace
                  </ContextMenuItem>
                  {!workspace.is_default && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => onDeleteWorkspace?.(workspace)}
                      >
                        <IconTrash className="size-4 mr-2" />
                        Delete Workspace
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewWorkspace}>
              <IconPlus className="size-4 mr-2" />
              New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent side="right">{activeWorkspace?.name ?? 'All Connections'}</TooltipContent>
      </Tooltip>
    </div>
  )
}
