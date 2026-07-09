import { IconChevronDown, IconDatabase, IconPencil, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { WorkspaceIcon } from '@/components/sidebar/menus/workspace-icon/WorkspaceIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkspaceDialog } from '@/components/workspace/workspace-dialog'
import { listWorkspaces } from '@/lib/rpc'
import { switchWorkspace } from '@/lib/session'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Workspace } from '@/types'

export function TitleBarWorkspaceSwitcher() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWorkspace, setEditWorkspace] = useState<Workspace | undefined>()

  const handleNewWorkspace = () => {
    setEditWorkspace(undefined)
    setDialogOpen(true)
  }

  const handleEditWorkspace = (workspace: Workspace) => {
    setMenuOpen(false)
    setEditWorkspace(workspace)
    setDialogOpen(true)
  }

  const handleDialogChange = async (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      try {
        const ws = await listWorkspaces()
        setWorkspaces(ws)
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          className={cn(
            'h-7 px-2 inline-flex items-center gap-1.5 rounded-md',
            'text-muted-foreground hover:text-foreground/80',
            'hover:bg-muted/60 active:bg-muted',
            'transition-colors duration-100 outline-none',
            'text-[11px] w-32',
          )}
        >
          {activeWorkspace ? (
            <WorkspaceIcon icon={activeWorkspace.icon} className="size-3.5 shrink-0" />
          ) : (
            <IconDatabase className="size-3.5 shrink-0" />
          )}
          <span className="truncate flex-1 text-left">
            {activeWorkspace?.name ?? 'All Connections'}
          </span>
          <IconChevronDown className="size-2.5 opacity-70 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={4} className="min-w-48 z-100">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => void switchWorkspace(workspace.id)}
              className="gap-2 group/ws"
            >
              <div className="flex size-5 items-center justify-center rounded border text-xs shrink-0">
                <WorkspaceIcon icon={workspace.icon} className="size-3" />
              </div>
              <span className="flex-1 truncate text-xs">{workspace.name}</span>
              {workspace.id === activeWorkspaceId && (
                <span className="text-[10px] text-primary shrink-0 group-hover/ws:hidden">
                  Active
                </span>
              )}
              <button
                type="button"
                aria-label={`Edit ${workspace.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditWorkspace(workspace)
                }}
                className="opacity-0 group-hover/ws:opacity-100 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-opacity shrink-0"
              >
                <IconPencil className="size-3" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNewWorkspace}>
            <IconPlus className="size-4 mr-2" />
            New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editWorkspace={editWorkspace}
      />
    </>
  )
}
