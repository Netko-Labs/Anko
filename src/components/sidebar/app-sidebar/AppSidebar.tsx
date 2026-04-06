import { IconDatabase, IconDeviceFloppy, IconHistory, IconSearch } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { ConnectionDialog } from '@/components/connection/ConnectionDialog'
import { listWorkspaces } from '@/lib/rpc'
import { cn } from '@/lib/utils'
import { useLeftSidebarStore } from '@/stores/left-sidebar'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ConnectionInfo } from '@/types'
import type { AppSidebarProps, NavItem, NavItemId } from '../definitions'
import { DatabasesPanel, HistoryPanel, SavedQueriesPanel, SearchPanel } from '../panels'

const SIDEBAR_WIDTH = '18rem'

const navItems: NavItem[] = [
  { id: 'connections', title: 'Connections', icon: IconDatabase },
  { id: 'saved-queries', title: 'Saved Queries', icon: IconDeviceFloppy },
  { id: 'history', title: 'History', icon: IconHistory },
  { id: 'search', title: 'Search', icon: IconSearch },
]

export function AppSidebar({ onConnectionSelect }: AppSidebarProps) {
  const open = useLeftSidebarStore((s) => s.open)
  const [activeNav, setActiveNav] = useState<NavItemId>('connections')

  // Workspace store
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)

  // Local state
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  const [editConnection, setEditConnection] = useState<ConnectionInfo | undefined>()

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const ws = await listWorkspaces()
        setWorkspaces(ws)
      } catch (e) {
        console.error('Failed to load workspaces:', e)
      }
    }
    loadWorkspaces()
  }, [setWorkspaces])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  const handleEditConnection = (connection: ConnectionInfo) => {
    setEditConnection(connection)
    setConnectionDialogOpen(true)
  }

  const handleNewConnection = () => {
    setEditConnection(undefined)
    setConnectionDialogOpen(true)
  }

  const renderSidebarContent = () => {
    switch (activeNav) {
      case 'connections':
        return (
          <DatabasesPanel
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onNewConnection={handleNewConnection}
            onEditConnection={handleEditConnection}
            onConnectionSelect={onConnectionSelect}
          />
        )
      case 'saved-queries':
        return <SavedQueriesPanel />
      case 'history':
        return <HistoryPanel />
      case 'search':
        return <SearchPanel />
      default:
        return null
    }
  }

  return (
    <>
      <div
        data-state={open ? 'expanded' : 'collapsed'}
        className="group text-sidebar-foreground"
        style={{ '--sidebar-width': SIDEBAR_WIDTH } as React.CSSProperties}
      >
        {/* Spacer */}
        <div
          className={cn(
            'relative bg-transparent transition-[width] duration-200 ease-linear',
            open ? 'w-[calc(var(--sidebar-width)+1px)]' : 'w-0',
          )}
        />

        {/* Fixed sidebar */}
        <div
          className={cn(
            'fixed top-9 bottom-0 left-0 z-10 flex flex-col border-r bg-sidebar transition-[left] duration-200 ease-linear',
            !open && '-left-[500px]',
          )}
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Icon tab strip */}
          <div className="relative flex items-center gap-0.5 px-2.5 pt-2 pb-1.5">
            {navItems.map((item) => {
              const isActive = activeNav === item.id
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.title}
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    'relative h-7 w-7 flex items-center justify-center rounded-[5px] transition-all duration-150',
                    isActive
                      ? 'text-primary'
                      : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/80',
                  )}
                >
                  <Icon className="size-4" />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1 right-1 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}

            {/* Bottom rule */}
            <div className="absolute bottom-0 left-2.5 right-2.5 h-px bg-border" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {renderSidebarContent()}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
        editConnection={editConnection}
        workspaceId={activeWorkspaceId}
        onConnectionAdded={async () => {
          const ws = await listWorkspaces()
          setWorkspaces(ws)
        }}
      />
    </>
  )
}
